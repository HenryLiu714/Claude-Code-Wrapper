# Claude Code HTTP Wrapper

A lightweight REST API that wraps the `claude` CLI, letting any HTTP client query Claude models without the Anthropic SDK. Built with [Hono](https://hono.dev) and TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (`claude --version` should work)

## Getting started

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable        | Description                                                        | Default             |
|-----------------|--------------------------------------------------------------------|---------------------|
| `PORT`          | Port the server listens on                                         | `3000`              |
| `URL`           | Base URL used in logs                                              | `http://localhost`  |
| `CORS_ORIGINS`  | Comma-separated allowed origins (supports `*` wildcard in port)    | —                   |
| `DEFAULT_MODEL` | Model used when none specified (`Haiku` or `Sonnet`)               | `Haiku`             |

### 3. Run the server

**Development** (watch mode):

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

## Usage

Send a prompt via POST and get the model's response:

```bash
curl -X POST http://localhost:7878/messages \
  -H "Content-Type: application/json" \
  -d '{"prompt": {"content": "What is 2+2?"}, "options": {"model": "Sonnet"}}'
# {"message":{"content":"4"}}
```

**Request body:**

| Field                   | Type     | Required | Description                        |
|-------------------------|----------|----------|------------------------------------|
| `prompt.content`        | string   | yes      | The message to send                |
| `options.model`         | string   | no       | `"Haiku"` or `"Sonnet"`            |
| `options.system_prompt` | string   | no       | System prompt override             |

**API docs:** Swagger UI is available at `http://localhost:<PORT>/ui`.

## Verify it's running

```bash
curl http://localhost:7878/health
# {"status":"ok"}
```

## Project structure

```
backend/
└── src/
    ├── app.ts              # Hono app — middleware and route registration
    ├── server.ts           # Entry point — wires dependencies, starts server
    ├── contract.ts         # Core interfaces: IApp, IServer
    ├── lib/
    │   └── result.ts       # Result<T, E> type (Ok / Err)
    ├── types/
    │   ├── errors.ts       # BaseError and custom error classes
    │   └── schemas.ts      # Zod validation schemas
    ├── config/
    │   ├── env.ts          # Env var parsing and validation
    │   └── openapi.ts      # OpenAPI spec for Swagger UI
    ├── ai_models/
    │   └── models.ts       # Model name → Claude model ID mapping
    ├── routes/             # Hono route files grouped by resource
    ├── controllers/        # Request/response handling
    └── services/           # Business logic (Claude CLI invocation, logging)
```

See [CLAUDE.md](./CLAUDE.md) for full architectural conventions and coding patterns.
