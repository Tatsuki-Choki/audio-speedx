# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Chrome Manifest V3 extension that controls playback speed of audio/video on any website. Vanilla JS, no build step.

## Architecture

The extension uses two layers to cover all playback methods:

1. **content.js** (MAIN world, `document_start`) — Monkey-patches `AudioContext.prototype.createBufferSource` before the page's own JS runs. This hooks `AudioBufferSourceNode.start()` to apply the desired `playbackRate`. Also handles standard HTML5 `<audio>`/`<video>` elements including those inside Shadow DOM. This layer is essential because sites like Fish Audio use Web Audio API (`AudioBufferSourceNode`) instead of HTML5 media elements.

2. **popup.js → content.js** — The popup sends speed values via `chrome.scripting.executeScript` which posts a `window.postMessage({ type: 'SPEED_CONTROL_SET', rate })`. The content script listens for this message and applies the rate to all tracked `AudioBufferSourceNode` refs (stored as `WeakRef`) and DOM media elements.

## Development

No build tools. Edit files directly, then:

1. Open `chrome://extensions/`, enable Developer Mode
2. "Load unpacked" → select this directory
3. After code changes, click the reload icon on the extension card
4. **Page reload required** after updating `content.js` (hooks must run before page JS)

## Key Constraints

- `content.js` must run in `"world": "MAIN"` to access and patch `AudioContext.prototype` on the page's JS context (the default `ISOLATED` world cannot reach it).
- `run_at: "document_start"` is critical — the monkey-patch must be in place before the site creates its `AudioContext`.
- Speed state lives in `window.__speedControl.rate`; the popup is stateless and re-reads nothing on open.
