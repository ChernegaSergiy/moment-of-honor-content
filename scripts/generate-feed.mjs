#!/usr/bin/env node
// Reads all posts and stories, drops expired stories, sorts by publish date
// and writes the aggregated feed.json used by the "Хвилина мовчання" client.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const FEED_VERSION = 1;

function readDocuments(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => extname(name) === '.json')
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')));
}

const now = new Date();

const posts = readDocuments(join(ROOT, 'content/posts')).sort(
  (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
);

const stories = readDocuments(join(ROOT, 'content/stories'))
  .filter((story) => new Date(story.expiresAt) > now)
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

let existingFeed = null;
try {
  existingFeed = JSON.parse(readFileSync(join(ROOT, 'feed.json'), 'utf8'));
} catch (e) {
  // Ignored, file might not exist
}

const contentChanged =
  !existingFeed ||
  JSON.stringify(existingFeed.posts) !== JSON.stringify(posts) ||
  JSON.stringify(existingFeed.stories) !== JSON.stringify(stories);

if (!contentChanged) {
  console.log('Content is unchanged. Skipping feed.json generation.');
  process.exit(0);
}

const feed = {
  version: FEED_VERSION,
  generatedAt: now.toISOString(),
  posts,
  stories,
};

writeFileSync(join(ROOT, 'feed.json'), `${JSON.stringify(feed, null, 2)}\n`);

console.log(`Generated feed.json with ${posts.length} post(s) and ${stories.length} active story(ies).`);
