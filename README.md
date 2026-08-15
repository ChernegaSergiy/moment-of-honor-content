# Moment of Honor Content

[![Validate content](https://github.com/ChernegaSergiy/moment-of-honor-content/actions/workflows/validate.yml/badge.svg)](https://github.com/ChernegaSergiy/moment-of-honor-content/actions/workflows/validate.yml)
[![Generate feed](https://github.com/ChernegaSergiy/moment-of-honor-content/actions/workflows/generate-feed.yml/badge.svg)](https://github.com/ChernegaSergiy/moment-of-honor-content/actions/workflows/generate-feed.yml)

Content repository for the **Moment of Honor CMS**, the content source for the "Хвилина мовчання" ("Minute of Silence") desktop application.

This repository is the source of truth for informational content. It stores posts and stories as JSON documents, their related media files, and the generated `feed.json` consumed by the CMS's serverless API.

## Repository structure

```text
moment-of-honor-content/
+-- content/
|   +-- posts/                # Post documents (*.json)
|   \-- stories/              # Story documents (*.json)
+-- media/
|   +-- posts/                # Media referenced by posts
|   \-- stories/              # Media referenced by stories
+-- schema/
|   +-- post.schema.json
|   +-- story.schema.json
|   \-- feed.schema.json
+-- scripts/
|   +-- validate-content.mjs
|   \-- generate-feed.mjs
\-- feed.json                 # Generated feed, do not edit by hand
```

## Content format

A post:

```json
{
  "id": "2026-08-15-example",
  "type": "post",
  "title": "Пам'ятаємо",
  "content": "Текст допису...",
  "media": ["media/posts/2026-08-15-example.jpg"],
  "author": "moment_of_honor",
  "publishedAt": "2026-08-15T10:00:00Z"
}
```

A story:

```json
{
  "id": "2026-08-15-01",
  "type": "story",
  "media": ["media/stories/2026-08-15-01.jpg"],
  "publishedAt": "2026-08-15T12:00:00Z",
  "expiresAt": "2026-08-16T12:00:00Z"
}
```

Rules:

- The document `id` must match its filename (without the `.json` extension).
- Every path in `media` must exist under `media/`.
- Stories are dropped from `feed.json` once `expiresAt` is in the past.

The exact schemas live in [`schema/`](schema) and are enforced by [`scripts/validate-content.mjs`](scripts/validate-content.mjs).

## Working with content

Content is edited either directly through Git, or through the Moment of Honor CMS UI, which uses the GitHub App to create commits in this repository on the author's behalf.

```bash
npm install
npm run validate         # Validate all posts and stories against the schema
npm run generate-feed    # Regenerate feed.json from current content
```

## Automation

Two GitHub Actions workflows automate this repository:

- **`validate.yml`** — runs on every pull request and push that touches `content/` or `schema/`, and fails the check if any document is invalid.
- **`generate-feed.yml`** — runs on every push to `main` that touches `content/`, and hourly on a schedule so expired stories are removed even without new commits. It regenerates `feed.json` and commits it back to the repository.

## Design principles

- **Git is the history.** Every content change is a commit; the repository does not maintain a separate changelog.
- **Text and media are independent.** Content documents only reference media by path; they never embed binary data.
- **The feed is derived, not authored.** `feed.json` is always generated from `content/`, never edited by hand.

## License

All content and data in this repository is released into the public domain under CC0 1.0 Universal. See the [LICENSE](LICENSE) file for details.
