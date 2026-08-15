#!/usr/bin/env node
// Validates every content document against its JSON Schema, checks that the
// document id matches its filename, and verifies that referenced media files
// exist on disk.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ROOT = new URL('..', import.meta.url).pathname;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const postSchema = JSON.parse(readFileSync(join(ROOT, 'schema/post.schema.json'), 'utf8'));
const storySchema = JSON.parse(readFileSync(join(ROOT, 'schema/story.schema.json'), 'utf8'));

const validatePost = ajv.compile(postSchema);
const validateStory = ajv.compile(storySchema);

function collectJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => extname(name) === '.json')
    .map((name) => join(dir, name));
}

function validateDocuments(dir, validate, kind) {
  let hasErrors = false;

  for (const filePath of collectJsonFiles(dir)) {
    const expectedId = basename(filePath, '.json');
    let doc;

    try {
      doc = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.error(`[${kind}] ${filePath}: invalid JSON (${err.message})`);
      hasErrors = true;
      continue;
    }

    if (!validate(doc)) {
      hasErrors = true;
      for (const error of validate.errors) {
        console.error(`[${kind}] ${filePath}: ${error.instancePath || '/'} ${error.message}`);
      }
      continue;
    }

    if (doc.id !== expectedId) {
      console.error(`[${kind}] ${filePath}: id "${doc.id}" does not match filename "${expectedId}"`);
      hasErrors = true;
    }

    for (const mediaPath of doc.media ?? []) {
      if (!existsSync(join(ROOT, mediaPath))) {
        console.error(`[${kind}] ${filePath}: referenced media file not found: ${mediaPath}`);
        hasErrors = true;
      }
    }
  }

  return hasErrors;
}

const postsHadErrors = validateDocuments(join(ROOT, 'content/posts'), validatePost, 'post');
const storiesHadErrors = validateDocuments(join(ROOT, 'content/stories'), validateStory, 'story');

if (postsHadErrors || storiesHadErrors) {
  console.error('\nContent validation failed.');
  process.exit(1);
}

console.log('Content validation passed.');
