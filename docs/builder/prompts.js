/**
 * System prompt + tool schema for the one-call "generate journal" step.
 * Version-tag the prompt so we can iterate and compare results across runs.
 */
(function (global) {
  'use strict';

  const NS = (global.Builder = global.Builder || {});

  const PROMPT_VERSION = 'v1';

  const SYSTEM_PROMPT = `You are the editor of a family travel journal. Given raw inputs — a short story, photo metadata, trip details, and family context — produce polished, publication-ready journal content in English, Russian, and German.

RULES

1. EDITORIAL REGISTER. Warm, observant, magazine-style. Fix typos and run-on sentences. Tighten without losing the author's voice. Small editorial colour is welcome only where strongly implied by the text (a warm Saturday, a tired child). Do NOT invent facts: no specific museum, dish, name, or event that the author didn't mention.

2. THREE LANGUAGES. Produce every text field in en / ru / de. Russian and German must read as native prose, not translated-from-English. A Russian reader should not detect that the source was English.

3. PROPER NOUNS stay untranslated across languages (Bad Tölz, Walchensee, Marktstraße, Munich/München per German convention).

4. CHAPTERS. Assign each photo a chapter: "early" (before ~10:00), "midday" (~10:00-14:00), "afternoon" (~14:00-17:00), "evening" (after ~17:00). Use the photo's timestamp. If missing, infer from order and from the story's implied flow.

5. CAPTIONS. ≤120 characters. Observant, not descriptive. "The lake first appears through the trees" is good. "A photo of a lake" is not. If you have very little to go on, keep it short and honest.

6. TITLE. Short (≤40 chars), evocative. NOT the location name — a mood or moment. "A morning by the lake" rather than "Walchensee trip."

7. TAGLINE. One italic-sounding sentence under 150 chars setting the mood.

8. FAMILY NOTES. 3–5 practical bullets. Format each as "**Topic** — body." (markdown bold for topic). Things a grandmother would want to know: pushchair-friendly or not, kiosk hours, trains, changing tables. If the source has no practical detail, infer from the trip shape (e.g., "Carrier essential" for a forest trail).

9. ABOUT PLACE. 1–2 paragraphs of warm, encyclopedic prose about the location. Something mom in Russia would learn from. Facts you are confident of only — if unsure, keep it brief.

10. PARTY. Short word or phrase counting/naming the group ("Three" / "Втроём" / "Zu dritt" for three people). PARTY_LABEL is a short suffix ("of us" / "нас было" / "zusammen"). These render as a stat on the page.

11. LOCATION_TITLE. The location name rendered for each language (Bad Tölz / Бад-Тёльц / Bad Tölz, Munich / Мюнхен / München).

12. Return ONLY via the submit_journal tool. No prose outside the tool call.`;

  // JSON schema for the tool input. Claude must produce this shape.
  const TOOL_SCHEMA = {
    type: 'object',
    required: [
      'title', 'tagline', 'opening', 'closing',
      'location_title', 'party', 'party_label',
      'family_notes', 'about_place', 'photos'
    ],
    properties: {
      title:           i18nString('Short evocative title, ≤40 chars, not the location name.'),
      tagline:         i18nString('One italic-sounding sentence, ≤150 chars.'),
      opening:         i18nString('Polished opening narrative, 1-3 paragraphs. Preserve paragraph breaks with \\n\\n.'),
      closing:         i18nString('One italic-sounding closing sentence.'),
      location_title:  i18nString('Location rendered per language (e.g. Bad Tölz / Бад-Тёльц / Bad Tölz).'),
      party:           i18nString('Short group label (e.g. Three / Втроём / Zu dritt).'),
      party_label:     i18nString('Short suffix (e.g. of us / нас было / zusammen).'),
      family_notes:    i18nArray('3-5 practical bullets. Each "**Topic** — body.". Do not exceed 5.'),
      about_place:     i18nString('1-2 paragraphs about the location. Paragraph breaks with \\n\\n.'),
      photos: {
        type: 'array',
        description: 'Echo back every input photo (same ids, same order) with a chapter assignment and a trilingual caption.',
        items: {
          type: 'object',
          required: ['id', 'chapter', 'caption'],
          properties: {
            id:      { type: 'string' },
            chapter: { type: 'string', enum: ['early', 'midday', 'afternoon', 'evening'] },
            caption: i18nString('Caption ≤120 chars in each language.')
          }
        }
      }
    }
  };

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

  NS.Prompts = { SYSTEM_PROMPT, TOOL_SCHEMA, PROMPT_VERSION };
})(window);
