# Ladybug APIs

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-red)](package.json)

**Ladybug APIs** — A simple, powerful, and free-to-use REST API platform with Discord Bot Integration.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Available APIs](#available-apis)
- [Discord Bot Integration](#discord-bot-integration)
- [Configuration](#configuration)
- [API Key Management](#api-key-management)
- [Rate Limiting](#rate-limiting)
- [License](#license)

## Installation

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Clone the Repository

```bash
git clone https://github.com/dev-modder/Ladybug-UI.git
cd Ladybug-UI
```

### Install Dependencies

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Discord Bot (optional)
DISCORD_TOKEN=

# Server
PORT=3000
```

## Quick Start

### Development

```bash
npm start
```

### Production

```bash
npm run build
npm run production
```

Server starts on port 3000 (or `PORT` in env).

## Available APIs

### Artificial Intelligence
| Endpoint | Description |
|---|---|
| `GET /ai/luminai?text=` | LuminAI chat assistant |
| `GET /ai/blackbox?text=` | Blackbox AI coding/chat assistant |
| `GET /ai/duckduckgo?text=` | DuckDuckGo free AI (GPT-4o mini) |
| `GET /ai/gpt4free?text=&model=` | Multiple free AI models via GPT4Free |

### Downloader
| Endpoint | Description |
|---|---|
| `GET /downloader/tiktok?url=` | TikTok video without watermark |
| `GET /downloader/instagram?url=` | Instagram reels, photos, videos |
| `GET /downloader/youtube?url=` | YouTube video/community posts |
| `GET /downloader/facebook?url=` | Facebook video HD/SD |
| `GET /downloader/spotify?url=` | Spotify track as MP3 |
| `GET /downloader/pinterest?url=` | Pinterest images and videos |
| `GET /downloader/twitter?url=` | Twitter/X videos and GIFs |
| `GET /downloader/threads?url=` | Threads media |
| `GET /downloader/capcut?url=` | CapCut video without watermark |

### Tools
| Endpoint | Description |
|---|---|
| `GET /tools/qrcode?text=&size=` | Generate QR code image |
| `GET /tools/shorten?url=` | Shorten URL via TinyURL |
| `GET /tools/weather?city=` | Current weather for any city |
| `GET /tools/translate?text=&to=&from=` | Translate text (Google) |
| `GET /tools/tts?text=&lang=` | Text to speech (MP3) |
| `GET /tools/musicfinder?query=` | Search song by title/artist — returns metadata, artwork, streaming links, lyrics preview |
| `GET /tools/musicfinder?url=<youtube>` | Identify song from YouTube URL |
| `GET /tools/musicfinder?url=<audio>&mode=recognize` | Identify song from direct audio file URL (MP3/WAV/etc) |

### Random Images
| Endpoint | Description |
|---|---|
| `GET /random/ba` | Random Blue Archive image |
| `GET /random/waifu?category=` | Random SFW waifu image |
| `GET /random/dog` | Random dog image |
| `GET /random/cat` | Random cat image |
| `GET /random/fox` | Random fox image |
| `GET /random/animequote?anime=` | Random anime quote |

### Image Makers
| Endpoint | Description |
|---|---|
| `GET /maker/brat?text=` | BRAT-style text image |
| `GET /maker/bratvid?text=` | Animated BRAT-style video |

### Anime
| Endpoint | Description |
|---|---|
| `GET /anime/mal-search?query=` | Search anime on MyAnimeList |
| `GET /anime/manga-search?query=` | Search manga on MyAnimeList |
| `GET /anime/top?type=&page=` | Top anime list |
| `GET /anime/anichin-search?query=` | Search on Anichin |
| `GET /anime/anichin-latest` | Latest episodes on Anichin |
| `GET /anime/anichin-popular` | Popular anime on Anichin |
| `GET /anime/anichin-detail?url=` | Anime details on Anichin |
| `GET /anime/anichin-episode?url=` | Episode streaming links |

### Search
| Endpoint | Description |
|---|---|
| `GET /search/google?query=` | Google search results |
| `GET /search/wikipedia?query=&lang=` | Wikipedia article summary |
| `GET /search/npm?query=` | NPM package search |

## Discord Bot Integration

The optional Discord bot provides slash commands for managing your API:

- **`/stats`** - View real-time API statistics
- **`/maintenance`** - Toggle maintenance mode
- **`/apikey`** - Manage API keys
- **`/endpoint`** - Manage API endpoints
- **`/activity`** - Manage bot activity status

Set `DISCORD_TOKEN` in your `.env` to enable it.

## Configuration

Edit `src/settings.json`:

```json
{
  "name": "Ladybug APIs",
  "version": "v1.0.0",
  "apiSettings": {
    "creator": "Ladybug",
    "requireApikey": false,
    "apikey": {
      "your-key": { "rateLimit": "5000/day", "enabled": true }
    }
  }
}
```

## API Key Management

Set `requireApikey: true` and pass `?apikey=your-key` in requests.

### Rate Limit Formats

- `"unlimited"` — no limit
- `"100/minute"` — 100 per minute
- `"1000/hour"` — 1000 per hour  
- `"5000/day"` — 5000 per day

## Rate Limiting

- Global: 50 requests/minute per IP (when `requireApikey` is `false`)
- Per key: configurable per API key

## License

MIT — see [LICENSE](LICENSE)
