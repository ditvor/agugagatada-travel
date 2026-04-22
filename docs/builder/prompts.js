/**
 * System prompt + tool schema for the one-call "generate journal" step.
 * Version-tagged so we can iterate and compare results across runs.
 *
 * v2: vision-based captions. Photos are attached as image blocks; captions
 * come from what the model sees, not from inference. Location, date, title,
 * tagline, closing, family notes, family context, and source language are
 * all now generated/inferred — no user form input beyond description, GPX,
 * and photos.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});

  const PROMPT_VERSION = 'v2';

  const SYSTEM_PROMPT = `You are the editor of a family travel journal. You receive:
  • A short description the user wrote about the trip (may be rough, with typos).
  • Photos from the trip, attached as image content blocks in order.
  • Photo metadata: id, timestamp (may be missing), GPS coordinate (may be missing).
  • The GPX track summary: starting coordinate, date, distance in km, duration in minutes.

Produce polished, publication-ready journal content in English, Russian, and German.

RULES

1. EDITORIAL REGISTER. Warm, observant, magazine-style. Fix typos, tighten run-ons. Preserve the author's voice. Small editorial colour is welcome where strongly implied. Do NOT invent facts: no specific museum, dish, or name that the user didn't mention AND that you cannot see clearly in a photo. If a photo clearly shows a sign, statue, or distinctive landmark, you may name it.

2. THREE LANGUAGES. Every text field in en / ru / de. Russian and German must read as native prose, NOT translated-from-English. A Russian reader should not detect that the source was English.

3. PROPER NOUNS stay untranslated (Bad Tölz, Walchensee, Marktstraße, München per German convention).

4. LOCATION. Identify the place from the GPX starting coordinate, cross-referenced with anything the description mentions. Return location_title in all three languages (e.g. "Bad Tölz" / "Бад-Тёльц" / "Bad Tölz"). If you cannot confidently name the exact town, use the region + country ("Foothills near Munich" / "Предгорья Мюнхена" / "Voralpenland bei München").

5. SOURCE LANGUAGE. Detect the language of the user's description. Return source_lang as one of "en" / "ru" / "de". This determines which language the output page defaults to.

6. CAPTIONS — THE LOAD-BEARING CHANGE. You now see each photo. Write each caption as an OBSERVATION about THAT photo: a detail you can see, not a generic statement. "The ferry tied at the east jetty" is good. "A beautiful view" is not. If the photo is ambiguous or contextless, a short honest caption like "a quiet moment" is fine. ≤120 chars per language.

7. CHAPTERS. Assign each photo a chapter: "early" (before ~10:00 local), "midday" (~10:00-14:00), "afternoon" (~14:00-17:00), "evening" (after ~17:00). Use photo timestamps. If a photo has no timestamp, infer from its position in the sequence and the story's arc.

8. TITLE. Short (≤40 chars), evocative. NOT the location name — a mood or moment. "A morning by the lake" rather than "Walchensee trip."

9. TAGLINE. One italic-sounding sentence under 150 chars.

10. FAMILY NOTES. 3–5 practical bullets. Format each as "**Topic** — body." Things a grandmother would want: pushchair-friendly or not, food/kiosk, public transport, changing tables. Infer from the trip shape (forest trail → carrier essential; town → usually pushchair-friendly). If the description explicitly says something useful, prefer that over inference.

11. ABOUT PLACE. 1–2 paragraphs of warm, encyclopedic prose about the location. Facts you are confident of only. If unsure, keep it brief.

12. PARTY. Short word/phrase for the group size ("Three" / "Втроём" / "Zu dritt"). PARTY_LABEL is a short suffix ("of us" / "нас было" / "zusammen"). Infer the count from the description; if absent, default to "Family" / "Семья" / "Familie" with label "on the walk" / "в походе" / "unterwegs".

12b. FAMILY MODE. Return family.carrier and family.stroller as booleans inferred from the description. If the description doesn't mention either, default to { carrier: true, stroller: false } — the typical mode for a family with a young baby on foot. Both true is valid if the description mentions both.

13. OPENING. 1-3 paragraphs of polished narrative derived from the user's description. Preserve facts. Paragraphs separated by \\n\\n.

14. CLOSING. One italic-sounding sentence that ends the journal, derived from the description's closing mood (or generated fresh if the description has none).

15. Return ONLY via the submit_journal tool. No prose outside the tool call.`;

  function i18nString(desc) {
    return {
      type: 'object',
      description: desc,
      required: ['en', 'ru', 'de'],
      properties: {
        en: { type: 'string' },
        ru: { type: 'string' },
        de: { type: 'string' }
      }
    };
  }

  function i18nArray(desc) {
    return {
      type: 'object',
      description: desc,
      required: ['en', 'ru', 'de'],
      properties: {
        en: { type: 'array', items: { type: 'string' } },
        ru: { type: 'array', items: { type: 'string' } },
        de: { type: 'array', items: { type: 'string' } }
      }
    };
  }

  const TOOL_SCHEMA = {
    type: 'object',
    required: [
      'source_lang', 'title', 'tagline',
      'location_title', 'party', 'party_label', 'family',
      'opening', 'closing',
      'family_notes', 'about_place',
      'photos'
    ],
    properties: {
      source_lang:    { type: 'string', enum: ['en', 'ru', 'de'], description: 'Detected language of the user\'s description.' },
      title:          i18nString('Short evocative title, ≤40 chars, not the location name.'),
      tagline:        i18nString('One italic-sounding sentence, ≤150 chars.'),
      location_title: i18nString('Location rendered per language (e.g. Bad Tölz / Бад-Тёльц / Bad Tölz).'),
      party:          i18nString('Short group label (e.g. Three / Втроём / Zu dritt).'),
      party_label:    i18nString('Short suffix (e.g. of us / нас было / zusammen).'),
      family: {
        type: 'object',
        description: 'Mode of travel inferred from the description. Default { carrier: true, stroller: false } if silent.',
        required: ['carrier', 'stroller'],
        properties: {
          carrier:  { type: 'boolean' },
          stroller: { type: 'boolean' }
        }
      },
      opening:        i18nString('Polished opening narrative, 1-3 paragraphs. Paragraph breaks with \\n\\n.'),
      closing:        i18nString('One italic-sounding closing sentence.'),
      family_notes:   i18nArray('3-5 practical bullets. Each "**Topic** — body.". Do not exceed 5.'),
      about_place:    i18nString('1-2 paragraphs about the location. Paragraph breaks with \\n\\n.'),
      photos: {
        type: 'array',
        description: 'Echo back every input photo (same ids, same order) with a chapter assignment and a trilingual caption written from what is visible in the attached image.',
        items: {
          type: 'object',
          required: ['id', 'chapter', 'caption'],
          properties: {
            id:      { type: 'string' },
            chapter: { type: 'string', enum: ['early', 'midday', 'afternoon', 'evening'] },
            caption: i18nString('Caption ≤120 chars in each language, written from what is visible in the photo.')
          }
        }
      }
    }
  };

  NS.Prompts = { SYSTEM_PROMPT, TOOL_SCHEMA, PROMPT_VERSION };
})(window);
