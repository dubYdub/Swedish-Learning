# Audio files for Swedish Learning Tools

Place your audio files here. The app automatically detects them by article ID.

## File naming

Name your file after the article ID, e.g.:

```
fika.mp3
norrsken.mp3
spotify.mp3
atervinning.mp3
abba.mp3
zlatan.mp3
stockholm.mp3
uppfinningar.mp3
```

Supported formats: **MP3, WAV, M4A, OGG**

The app checks for these extensions in order and uses the first one it finds.
No code changes needed — just drop the file here and reload the page.

---

## Optional: paragraph timestamps

To enable "jump to paragraph" in the Listen phase and highlighted sync in the Shadow phase,
create a JSON file with the same name as your audio file:

```
fika.json
```

Format — an array of paragraph timestamps in seconds:

```json
[
  { "id": "fika-1", "start": 0.0,  "end": 14.2 },
  { "id": "fika-2", "start": 14.5, "end": 31.8 },
  { "id": "fika-3", "start": 32.1, "end": 52.0 }
]
```

- `id` must match the paragraph IDs in `src/data/articles.js` (format: `{articleId}-{number}`)
- `start` and `end` are seconds from the beginning of the audio file
- Without this file the app still plays the audio — it just can't sync per-paragraph highlighting

### How to get timestamps

1. Open the audio file in Audacity or any DAW
2. Note the start/end time of each paragraph in the article
3. Write them into the JSON file above

Or use a script — the paragraph IDs are `fika-1`, `fika-2`, … in order.
