<div align="center">

# LANSONAI

**Voice AI, end to end — our own inference engines, our own products.**

[Website](https://www.lansonai.com) · [Docs](https://www.lansonai.com/docs) · [Developer API](https://audio.lansonai.com) · [Pricing](https://www.lansonai.com/pricing)

</div>

---

## What we do

LANSONAI builds speech products and the voice infrastructure underneath them. We do not resell a third-party transcription API: we run a multi-engine inference fleet and route every request to the engine that fits its language, latency target and hardware budget.

Three layers, one stack:

| Layer | What it is |
| --- | --- |
| **Inference** | Self-hosted ASR and TTS engines — FunASR, Faster-Whisper, Qwen3 ASR/TTS, Cohere Transcribe — across CPU and GPU pools, with language-aware routing at the ingress |
| **Platform** | `audio.lansonai.com` — real-time WebSocket and batch transcription API with metered usage; `relay.lansonai.com` — a globally distributed relay for live multilingual subtitles |
| **Products** | Dictation and writing, live meeting interpretation, phone agents, creator tooling |

## Products

- **Lanson Flow** — voice-first writing. Hold to talk, get clean structured text in any app, plus a PSTN voice agent that answers and acts on calls.
- **Lanson Live** — real-time meeting interpretation: per-segment LLM correction, parallel multilingual translation, shareable subtitles on web, Chrome extension and mobile.
- **Lanson Reception** — an AI front desk that answers, routes and logs.
- **Creator tools** — podcast and captioning apps sharing one subscription.

## Developer platform

- **Real-time API** — WebSocket streaming that accepts encoded audio directly (mpegts/aac/m4a/mp3/wav); no client-side ffmpeg.
- **Batch API** — asynchronous transcription with metered, retry-safe usage accounting.
- **Docs and contract** — quickstart, API reference, rate limits and an OpenAPI 3.1 document, published at [www.lansonai.com/docs](https://www.lansonai.com/docs).
- **Relay** — `relay.lansonai.com`, audience-agnostic broadcast of translated subtitles.

## How we build

- Every service ships as a standalone single-file Bun binary with its models embedded; a full machine rebuild is scripted end to end.
- Latency is a contract parameter — batch window, buffer seconds, watermark — not a hidden constant.
- Every LLM call is traced for latency, token cost and fallback, so quality and cost are compared on measurements rather than opinion.

## Links

| | |
| --- | --- |
| Website | https://www.lansonai.com |
| App | https://app.lansonai.com |
| Docs | https://www.lansonai.com/docs |
| Developer API | https://audio.lansonai.com |
| Pricing | https://www.lansonai.com/pricing |
| Contact | https://www.lansonai.com/contact |

This organization hosts the repositories behind our products, platform and websites. Most of them are private; the public surfaces above are where the product lives.
