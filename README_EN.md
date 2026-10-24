# DSH Translator · DeepSeek Hermes Translator

![Manifest V3](https://img.shields.io/badge/Manifest-V3-4d6bfe)
![Languages](https://img.shields.io/badge/languages-200-4d6bfe)
![Chrome](https://img.shields.io/badge/Chrome-116%2B-4d6bfe)
![License](https://img.shields.io/badge/license-MIT-4d6bfe)

A minimal browser translation extension: **200 languages**, powered by your own model (DeepSeek / Hermes / vLLM / Ollama / any OpenAI-compatible endpoint).

The UI follows the familiar Baidu Translate flow — pick languages, paste text, hit translate. Nothing else.

> 中文文档: [README.md](README.md)

![Main panel](docs/screenshot-main.png)

---

## Why this one

- **Translation only** — no accounts, no ads, no analytics, no third-party relay server
- **200 languages** — from English and Japanese to Cebuano, Northern Sami and Walloon
- **Bring your own model** — DeepSeek's official API, Nous Hermes, an internal vLLM box or a local Ollama
- **Your key stays local** — the API key lives in `chrome.storage.local` and is only sent to the endpoint you configure
- **No build step** — plain HTML/CSS/JS, edit and reload

## Features

| Feature | Description |
| --- | --- |
| 200 languages | Full built-in language library, the 20 most used pinned on top |
| Language search | Filter by Chinese name, English name or language code |
| Auto detect | Let the model detect the source language, or lock it manually |
| Swap | Swap source/target; the translation is moved back into the input box for round-trip work |
| Translate | Button, or `Ctrl + Enter` (`⌘ + Enter` on macOS) |
| Context menu | Select text on a page → right click → "Translate selection with DSH" |
| Result actions | Copy, read aloud with system TTS, export as `.txt` |
| Character counter | 5000 characters per request, counted live |
| Error messages | 401 / 402 / 404 / 429 / timeout / network failures each explained |

## Install

### Chrome / Edge (developer mode)

1. Download this repo: **Code → Download ZIP**, then unzip it to a permanent folder
2. Open `chrome://extensions` (`edge://extensions` on Edge)
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked** and pick the folder that contains `manifest.json`
5. The options page opens automatically on first install; you can also click the gear icon in the panel

> Keep the unzipped folder in place — moving or deleting it breaks the extension.

### Configuration

| Setting | Default | Notes |
| --- | --- | --- |
| API key | empty | Required. Create one at <https://platform.deepseek.com> → API keys |
| Base URL | `https://api.deepseek.com` | `/v1` is optional; `/chat/completions` is appended automatically |
| Model | `deepseek-chat` | Prefer instruction-tuned chat models; reasoning models are much slower |
| Timeout | 60 s | 5–300 s |
| Default target | Chinese (Simplified) | Used when the panel opens |

Click **Test connection** — if it returns a translated sentence, the pipeline works.

![Settings page](docs/screenshot-settings.png)

## Usage

1. Click the blue toolbar icon to open the panel
2. Choose the source language (auto detect by default) and the target language
3. Type or paste text, then click **Translate** or press `Ctrl + Enter`
4. The result appears below; the four buttons at the bottom copy, read aloud, export or open settings

**Language search** focuses automatically — typing `jap`, `日语` or `ja` finds Japanese. Use `↑ ↓` to move, `Enter` to pick, `Esc` to close.

**Selection translation**: select text on any page → right click → "Translate selection with DSH". On Chrome 127+ the panel opens and translates immediately; on older builds the toolbar icon shows a badge — click it to see the result.

## Using other models

The extension only needs an endpoint implementing OpenAI's `POST /chat/completions`. Common setups:

| Service | Base URL | Model name |
| --- | --- | --- |
| DeepSeek official | `https://api.deepseek.com` | `deepseek-chat` |
| DeepSeek official (v1) | `https://api.deepseek.com/v1` | `deepseek-reasoner` |
| Nous Hermes (hosted) | the OpenAI-compatible URL from your provider | `nousresearch/hermes-3-llama-3.1-70b` |
| Self-hosted vLLM | `http://192.168.10.250:8084/v1` | the value passed to `--served-model-name` |
| Ollama | `http://localhost:11434/v1` | `qwen2.5:7b` |
| One API / New API gateway | gateway URL + `/v1` | model name defined in the gateway |

Notes:

- **Ollama** binds to localhost and validates origins. Start it with `OLLAMA_ORIGINS=chrome-extension://*`
- **LAN endpoints** are covered by the declared `http://*/*` and `https://*/*` host permissions
- **Not supported**: streaming-only or non-standard protocols — this extension uses a single non-streaming request

## Language support

200 languages covering the world's major languages plus a long tail of regional ones. The first 20 are the most used (Chinese Simplified/Traditional, English, Japanese, Korean, Spanish, French, German, Russian, Portuguese, Italian, Arabic, Hindi, Thai, Vietnamese, Indonesian, Malay, Turkish, Dutch, Polish).

The full list lives in [`src/languages.js`](src/languages.js) as `[code, Chinese name, English name]` tuples — edit it and the panel, search and settings dropdown all follow.

## Privacy

- No data collection, no remote scripts or fonts
- Text is sent only to **the API endpoint you configure**
- The API key is stored in local browser storage and used solely in that request header
- "Restore defaults" wipes all local data of this extension

## Project layout

```
deepseek-hermes-translator/
├── manifest.json          # Manifest V3
├── popup.html             # Translation panel
├── popup.css
├── popup.js               # Dropdowns, translation, copy / speak / export
├── options.html           # Settings page
├── options.css
├── options.js
├── background.js          # Context menu, first-run onboarding
├── src/
│   ├── languages.js       # 200-language library
│   └── translator.js      # Config, Chat Completions call, error mapping
├── icons/                 # Icons + generator script (stdlib Python)
└── docs/                  # Screenshots
```

## Development

No npm, no bundler:

1. Edit the code → open `chrome://extensions` → click reload on the extension card
2. Debug the panel: right click inside it → Inspect
3. Regenerate icons: `python icons/make_icons.py` (standard library only)

## Known limitations

- 5000 characters per request; split longer text
- Non-streaming: long input returns all at once
- Read-aloud uses system TTS; rare languages may have no matching voice
- Not published on the Chrome Web Store — load it in developer mode

## Contributing

Issues and PRs are welcome — especially language table corrections and compatibility reports for more endpoints.

## License

[MIT](LICENSE)
