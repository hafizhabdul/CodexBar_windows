# CodexBar Windows

AI Provider Usage Monitor for Windows — a system tray app that keeps your AI provider usage limits visible.

## Features
- System tray app with per-provider usage monitoring
- Multi-provider support: Claude, Codex, Cursor, Gemini, Copilot, OpenRouter, and more
- Session + weekly usage meters with reset countdowns
- Settings UI with provider toggles
- Auto-update support via electron-updater

## Install

### Requirements
- Windows 10+

### From Release
Download the latest installer from the releases page.

### Build from Source
```bash
npm install
npm run build
```

## Development
```bash
npm install
npm run dev
```

## Providers
- [Codex](docs/codex.md) — OpenAI Codex usage tracking
- [Claude](docs/claude.md) — Anthropic Claude usage tracking
- [Cursor](docs/cursor.md) — Cursor usage + billing
- [Gemini](docs/gemini.md) — Google Gemini quota
- [Copilot](docs/copilot.md) — GitHub Copilot usage
- [OpenRouter](docs/openrouter.md) — OpenRouter credit tracking
- [Augment](docs/augment.md) — Augment credits tracking
- [Amp](docs/amp.md) — Amp usage tracking
- [JetBrains AI](docs/jetbrains.md) — JetBrains AI credits
- See [docs/providers.md](docs/providers.md) for the full list.

## Tech Stack
- Electron + TypeScript
- React + TailwindCSS
- Vite (bundler)
- electron-builder (packaging)

## License
MIT
