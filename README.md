# Poppy Ad Engine — concept demo

A split-screen AI ad creative engine: chat assistant on the left, live creative
library on the right. Built as a concept demo by Raunek Pratap.

The app lives in [`chat-assitant-ui/`](chat-assitant-ui/).

## Run locally

```bash
cd chat-assitant-ui
pnpm install
pnpm dev
```

No API key is required. Without one the chat streams a canned offline reply
instead of erroring, and every creative-library command still works — those are
mocked locally rather than routed to a model.

## Try

- `make variation 3 more aggressive` (also: softer, shorter, punchier, more urgent, funnier)
- `duplicate variation 2`
- `delete variation 5`
- Click any card to open its detail sheet and edit the copy.

## Deploy (Vercel)

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `chat-assitant-ui` |
| Build command | default (`next build`) |
| Install command | default (`pnpm install`) |
| Node version | 20.x or 22.x |
| Environment variables | none required — `AI_GATEWAY_API_KEY` optional, enables live chat |

## Notes

[`docs/merge-analysis.md`](docs/merge-analysis.md) is the pre-merge analysis of the
two source templates. [`library-grid-prompt.md`](library-grid-prompt.md) is the original
carousel integration prompt, kept for provenance.
