# OmniLearn Ghost Node

A distributed compute node for the [OmniLearn](https://github.com) AI agent network.

Ghost nodes extend the OmniLearn network by providing additional processing capacity. Your primary OmniLearn instance routes tasks to registered ghost nodes when operating in Ghost Mode.

## Quick Start

### Option 1 — Docker (recommended)

```bash
docker compose up -d
```

### Option 2 — Node.js (manual)

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### Option 3 — One-liner

```bash
GHOST_NODE_SECRET=your-secret ANTHROPIC_API_KEY=your-key PORT=8080 node ghost-server.js
```

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `GHOST_NODE_SECRET` | Yes | Shared secret — must match what you enter in OmniLearn when registering this node |
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude access |
| `PORT` | No | Port to listen on (default: 8080) |
| `GHOST_NODE_NAME` | No | Human-readable name shown in OmniLearn dashboard |
| `GHOST_NODE_REGION` | No | Region label (e.g. eu-west, us-east) |

## Registering the Node

Once running, add it in OmniLearn:

1. Open **Ghost Network** in the sidebar
2. Click **Add Node**
3. Enter your node's public URL (e.g. `https://your-server.com`) and the secret you set
4. Click **Connect** — OmniLearn will ping it to verify

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/ghost/health` | Health check (no auth required) |
| POST | `/api/ghost/execute` | Execute a task (requires `X-Ghost-Secret` header) |

## Security

- All task requests require the `X-Ghost-Secret` header matching `GHOST_NODE_SECRET`
- Never share your secret key or commit `.env` to version control
- Use HTTPS in production (set up a reverse proxy with nginx or Caddy)

## Architecture

```
Primary OmniLearn ──── Ghost Mode Chat ───► Node Registry
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                         Ghost Node 1      Ghost Node 2      Ghost Node N
                         (this server)     (another server)  (cloud instance)
```
