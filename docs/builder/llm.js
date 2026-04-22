/**
 * Claude API wrapper — one call does polish + translate + describe-place
 * + location-inference + language-detection + per-photo vision captions
 * + chapter assignment.
 *
 * Reads the API key from window.CLAUDE_API_KEY (set by docs/builder/.key.js,
 * gitignored — must be created locally).
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});
  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-sonnet-4-6';

  /**
   * Input shape:
   *   {
   *     description: string,
   *     track: { distance_km, duration_min, start_coord: [lat, lon], date },
   *     photos: [{ id, timestamp, coord, vision: { base64, mediaType } }]
   *   }
   *
   * Output: { journal, usage, model, prompt_version }
   */
  async function generate(input) {
    const key = global.CLAUDE_API_KEY;
    if (!key || !key.startsWith('sk-ant-')) {
      throw new Error(
        'Claude API key not found. Create docs/builder/.key.js with:\n' +
        '  window.CLAUDE_API_KEY = "sk-ant-…";\n' +
        '(the file is gitignored)'
      );
    }

    const prompts = global.Builder.Prompts;

    // Build the user content: metadata first, then each photo (text preamble + image block).
    const content = [];

    const photosMeta = input.photos.map(p => ({
      id: p.id,
      timestamp: p.timestamp,
      coord: p.coord,
      coord_source: p.coord_source || null
    }));

    const preamble = [
      'Here is the input for a family travel journal. Produce the polished trilingual content via the submit_journal tool.',
      '',
      '```json',
      JSON.stringify({
        description: input.description,
        track: input.track,
        photos: photosMeta
      }, null, 2),
      '```',
      '',
      'The photos themselves follow, in order. Write each caption from what you actually SEE in that photo.'
    ].join('\n');

    content.push({ type: 'text', text: preamble });

    for (const photo of input.photos) {
      const label = [
        `Photo ${photo.id}`,
        photo.timestamp ? ` — ${photo.timestamp}` : '',
        photo.coord ? ` — coord ${photo.coord[0].toFixed(4)}, ${photo.coord[1].toFixed(4)}` : ''
      ].join('');
      content.push({ type: 'text', text: label });
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: photo.vision.mediaType,
          data: photo.vision.base64
        }
      });
    }

    const body = {
      model: MODEL,
      max_tokens: 16000,
      system: prompts.SYSTEM_PROMPT,
      tools: [{
        name: 'submit_journal',
        description: 'Submit the polished journal content.',
        input_schema: prompts.TOOL_SCHEMA
      }],
      tool_choice: { type: 'tool', name: 'submit_journal' },
      messages: [{ role: 'user', content }]
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Claude API ${res.status}: ${text.slice(0, 600)}`);
    }

    const data = await res.json();
    const toolBlock = (data.content || []).find(b => b.type === 'tool_use');
    if (!toolBlock || !toolBlock.input) {
      throw new Error('Claude did not call the submit_journal tool. Raw:\n' + JSON.stringify(data).slice(0, 800));
    }

    const inputIds = input.photos.map(p => p.id);
    const outputIds = (toolBlock.input.photos || []).map(p => p.id);
    const missing = inputIds.filter(id => !outputIds.includes(id));
    if (missing.length > 0) {
      throw new Error('Claude returned photos with missing ids: ' + missing.join(', '));
    }

    return {
      journal: toolBlock.input,
      usage: data.usage,
      model: data.model,
      prompt_version: prompts.PROMPT_VERSION
    };
  }

  NS.Llm = { generate, MODEL };
})(window);
