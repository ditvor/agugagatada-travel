#!/usr/bin/env node
/**
 * Two checks:
 *   1. Schema validation — every data/*.json validates against data/schema.json
 *   2. Consistency check — JSON ↔ HTML ↔ index.html coverage
 *        • every data/*.json has a matching preview/<slug>.html
 *        • every destination preview/*.html has a matching data/<slug>.json
 *        • every destination is linked from preview/index.html (dest-card__link)
 * No npm dependencies — uses only Node built-ins.
 * Run: node scripts/validate.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Minimal JSON Schema draft-07 validator
// Handles: type, required, additionalProperties, properties, $ref,
//          definitions, enum, minimum, maximum, minItems, maxItems, pattern, items
// ---------------------------------------------------------------------------

function validate(data, schema, rootSchema, path) {
  const errors = [];
  const at = path || '#';

  // Resolve $ref
  if (schema.$ref) {
    const ref = schema.$ref;
    if (!ref.startsWith('#/definitions/')) {
      errors.push(`${at}: unsupported $ref "${ref}"`);
      return errors;
    }
    const defName = ref.slice('#/definitions/'.length);
    const def = rootSchema.definitions && rootSchema.definitions[defName];
    if (!def) {
      errors.push(`${at}: $ref "${ref}" not found in definitions`);
      return errors;
    }
    return validate(data, def, rootSchema, path);
  }

  // type
  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array'
      : data === null ? 'null'
      : typeof data;
    // JSON Schema "integer" means a number with no fractional part
    const typeOk = schema.type === 'integer'
      ? (typeof data === 'number' && Number.isInteger(data))
      : actualType === schema.type;
    if (!typeOk) {
      const gotDesc = actualType === 'number' && schema.type === 'integer'
        ? `number (${data}, not an integer)`
        : actualType;
      errors.push(`${at}: expected type "${schema.type}", got "${gotDesc}"`);
      return errors; // further checks are meaningless if type is wrong
    }
  }

  // enum
  if (schema.enum) {
    if (!schema.enum.includes(data)) {
      errors.push(`${at}: "${data}" is not one of [${schema.enum.map(v => JSON.stringify(v)).join(', ')}]`);
    }
  }

  // minimum / maximum (numbers)
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${at}: ${data} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push(`${at}: ${data} is greater than maximum ${schema.maximum}`);
    }
  }

  // pattern (strings)
  if (typeof data === 'string' && schema.pattern) {
    if (!new RegExp(schema.pattern).test(data)) {
      errors.push(`${at}: "${data}" does not match pattern ${schema.pattern}`);
    }
  }

  // object keywords
  if (schema.type === 'object' || (typeof data === 'object' && data !== null && !Array.isArray(data))) {
    // required
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in data)) {
          errors.push(`${at}: missing required property "${key}"`);
        }
      }
    }

    // additionalProperties: false
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(data)) {
        if (!(key in schema.properties)) {
          errors.push(`${at}: unexpected property "${key}"`);
        }
      }
    }

    // properties
    if (schema.properties) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const subErrors = validate(data[key], subSchema, rootSchema, `${at}/${key}`);
          errors.push(...subErrors);
        }
      }
    }
  }

  // array keywords
  if (schema.type === 'array' || Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push(`${at}: array has ${data.length} items, minimum is ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push(`${at}: array has ${data.length} items, maximum is ${schema.maxItems}`);
    }
    if (schema.items) {
      data.forEach((item, i) => {
        const subErrors = validate(item, schema.items, rootSchema, `${at}/${i}`);
        errors.push(...subErrors);
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const root = path.resolve(__dirname, '..');
const schemaPath = path.join(root, 'data', 'schema.json');
const dataDir = path.join(root, 'data');
const previewDir = path.join(root, 'preview');

if (!fs.existsSync(schemaPath)) {
  console.error('ERROR: data/schema.json not found');
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const dataFiles = fs.readdirSync(dataDir)
  .filter(f => f.endsWith('.json') && f !== 'schema.json')
  .sort();

if (dataFiles.length === 0) {
  console.error('ERROR: no data files found in data/');
  process.exit(1);
}

// Non-destination HTML files that live alongside destination pages
const NON_DESTINATION_HTML = new Set(['index.html', 'shell.html', 'route-composer.html']);

let totalErrors = 0;

// ---------------------------------------------------------------------------
// Check 1: Schema validation
// ---------------------------------------------------------------------------

console.log('=== Schema validation ===');
let schemaFailed = 0;

for (const fname of dataFiles) {
  const filePath = path.join(dataDir, fname);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`FAIL  ${fname}`);
    console.log(`      JSON parse error: ${e.message}`);
    schemaFailed++;
    totalErrors++;
    continue;
  }

  const errors = validate(data, schema, schema, '#');

  if (errors.length === 0) {
    console.log(`OK    ${fname}`);
  } else {
    console.log(`FAIL  ${fname}`);
    for (const err of errors) {
      console.log(`      ${err}`);
    }
    schemaFailed++;
    totalErrors += errors.length;
  }
}

// ---------------------------------------------------------------------------
// Check 2: Consistency — JSON ↔ HTML ↔ index.html
// ---------------------------------------------------------------------------

console.log('\n=== Consistency check ===');
let consistencyErrors = 0;

// Slugs derived from data files (e.g. "bamberg" from "bamberg.json")
const jsonSlugs = new Set(dataFiles.map(f => f.replace('.json', '')));

// Destination HTML files (exclude non-destination pages)
const htmlFiles = fs.readdirSync(previewDir)
  .filter(f => f.endsWith('.html') && !NON_DESTINATION_HTML.has(f))
  .sort();
const htmlSlugs = new Set(htmlFiles.map(f => f.replace('.html', '')));

// Slugs linked from index.html via class="dest-card__link"
const indexHtml = fs.readFileSync(path.join(previewDir, 'index.html'), 'utf8');
const indexLinkPattern = /href="([^"]+\.html)"\s+class="dest-card__link"/g;
const indexSlugs = new Set();
let match;
while ((match = indexLinkPattern.exec(indexHtml)) !== null) {
  indexSlugs.add(match[1].replace('.html', ''));
}

// JSON → HTML
for (const slug of [...jsonSlugs].sort()) {
  if (!htmlSlugs.has(slug)) {
    console.log(`FAIL  data/${slug}.json has no matching preview/${slug}.html`);
    consistencyErrors++;
    totalErrors++;
  }
}

// HTML → JSON
for (const slug of [...htmlSlugs].sort()) {
  if (!jsonSlugs.has(slug)) {
    console.log(`FAIL  preview/${slug}.html has no matching data/${slug}.json`);
    consistencyErrors++;
    totalErrors++;
  }
}

// JSON → index.html
for (const slug of [...jsonSlugs].sort()) {
  if (!indexSlugs.has(slug)) {
    console.log(`FAIL  data/${slug}.json is not linked from preview/index.html`);
    consistencyErrors++;
    totalErrors++;
  }
}

// index.html → JSON (catch stale links)
for (const slug of [...indexSlugs].sort()) {
  if (!jsonSlugs.has(slug)) {
    console.log(`FAIL  preview/index.html links to "${slug}.html" but data/${slug}.json does not exist`);
    consistencyErrors++;
    totalErrors++;
  }
}

if (consistencyErrors === 0) {
  console.log(`OK    ${jsonSlugs.size} destinations — JSON, HTML, and index.html all in sync`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
if (totalErrors === 0) {
  console.log(`All checks passed (${dataFiles.length} destinations).`);
} else {
  const parts = [];
  if (schemaFailed > 0) parts.push(`${schemaFailed} schema failure(s)`);
  if (consistencyErrors > 0) parts.push(`${consistencyErrors} consistency failure(s)`);
  console.log(`FAILED: ${parts.join(', ')}.`);
}

process.exit(totalErrors > 0 ? 1 : 0);
