# Claude Code HTTP Wrapper — Hono Backend

This is a TypeScript HTTP server that wraps the `claude` CLI as a REST API. It receives chat queries over HTTP and returns responses from Claude models by invoking the CLI as a subprocess. Follow the patterns below consistently across the codebase.

---

## Architecture

```
src/
├── app.ts              — Hono app setup and middleware registration
├── server.ts           — HTTP server entry point
├── contract.ts         — Core service interfaces (IApp, IServer)
├── lib/
│   └── result.ts       — Result<T, E> type (Ok / Err)
├── types/
│   ├── errors.ts       — BaseError and custom error classes
│   └── schemas.ts      — Zod validation schemas
├── config/
│   ├── env.ts          — Env var parsing and validation
│   └── openapi.ts      — OpenAPI spec for Swagger UI
├── ai_models/
│   └── models.ts       — Model name → Claude model ID mapping
├── routes/             — Hono route handlers grouped by resource
├── controllers/        — Request/response handling logic
└── services/           — Business logic layer (Claude CLI invocation, logging)
```

Execution flows strictly top-down:

```
Routes → Controllers → Services
```

Each layer only depends on the layer directly below it.

---

## TypeScript Configuration

- **Strict mode** is enabled — `"strict": true`
- **Module**: `nodenext`
- **Target**: `esnext`
- **Key flags**:
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `verbatimModuleSyntax: true`
  - `isolatedModules: true`
- Never use `any` — prefer `unknown` and narrow explicitly
- Always use explicit return types on exported functions
- Use `z.infer<typeof Schema>` to derive types from Zod schemas

---

## Result<T, E> — Error Handling

**All functions that can fail must return `Result<T, E>`, not throw.**

```typescript
import { Ok, Err, Result } from "../lib/result.js";

async function runQuery(query: Query): Promise<Result<Message, Error>> {
  try {
    const { stdout } = await execAsync(cmd);
    return Ok({ content: JSON.parse(stdout).result });
  } catch (e) {
    return Err(e instanceof Error ? e : new Error("Unknown error"));
  }
}
```

**Checking results:**

```typescript
const result = await chatService.runQuery(query);
if (!result.ok) {
  return c.json({ error: result.value.message }, 500);
}
return c.json({ message: result.value });
```

Never use `try/catch` in controllers — that belongs in the service layer.

---

## Custom Errors

All errors extend `BaseError` from `types/errors.ts`:

```typescript
export abstract class BaseError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

Define domain errors close to where they are used:

```typescript
export class ServiceError extends BaseError {
  readonly code = "SERVICE_ERROR";
}
```

Map error codes to HTTP status codes in controllers.

---

## Hono App Setup

The app class implements `IApp` from `contract.ts`.

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

export class HonoApp implements IApp {
  private readonly app: Hono;

  constructor(private readonly chatController: IChatController, private readonly logger: ILoggingService) {
    this.app = new Hono();
    this.registerMiddleware();
    this.registerRoutes();
  }

  private registerMiddleware(): void {
    this.app.use("*", cors({ /* ... */ }));
  }

  private registerRoutes(): void {
    this.app.route("/messages", createMessageRouter(this.chatController, this.logger));
    this.app.get("/doc", (c) => c.json(openApiSpec));
    this.app.get("/ui", swaggerUI({ url: "/doc" }));
  }

  getApp(): Hono {
    return this.app;
  }
}
```

---

## Routes

Group routes by resource in `src/routes/`. Each file exports a factory function returning a `Hono` instance.

```typescript
// src/routes/messages.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { querySchema } from "../types/schemas.js";

export function createMessageRouter(controller: IChatController, logger: ILoggingService) {
  const router = new Hono();

  router.post("/", zValidator("json", querySchema), async (c) => {
    const query = c.req.valid("json");
    const result = await controller.handleChatRequest(query);
    if (result.ok) return c.json({ message: result.value });
    logger.error(`Error: ${result.value.message}`);
    return c.json({ error: result.value.message }, 500);
  });

  return router;
}
```

---

## Controllers

Controllers handle HTTP concerns: parsing request input, calling services, and returning responses. They do not contain business logic.

```typescript
export class ChatController implements IChatController {
  constructor(private readonly chatService: IChatService) {}

  async handleChatRequest(query: Query): Promise<Result<Message, Error>> {
    return this.chatService.runQuery(query);
  }
}
```

---

## Services

Services contain business logic. For this project the primary service invokes the `claude` CLI subprocess.

```typescript
export interface IChatService {
  runQuery(query: Query): Promise<Result<Message, Error>>;
}

export class ChatService implements IChatService {
  constructor(private readonly logger: ILoggingService) {}

  async runQuery(query: Query): Promise<Result<Message, Error>> {
    const cmd = [
      "claude",
      "-p", JSON.stringify(query.prompt.content),
      "--model", query.options?.model || env.DEFAULT_MODEL,
      "--output-format", "json",
      "--allowedTools", "none",
      "--no-session-persistence",
      "< /dev/null",
    ].join(" ");

    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: "/tmp" });
      if (stderr) return Err(new Error(stderr));
      return Ok({ content: JSON.parse(stdout).result });
    } catch (e) {
      return Err(e instanceof Error ? e : new Error("Unknown error"));
    }
  }
}
```

---

## AI Models

Model name → Claude model ID mappings live in `src/ai_models/models.ts`. The `Models` array is used as the Zod enum for request validation.

```typescript
export const ModelMap: { [key: string]: string } = {
  "Haiku": "claude-haiku-4-5",
  "Sonnet": "claude-sonnet-4-5",
};

export const Models = Object.keys(ModelMap);
```

To add a new model, add an entry to `ModelMap`. No other changes are needed.

---

## Logging Service

Inject the logger via constructor. Never call `console.log` directly in application code.

```typescript
export interface ILoggingService {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
```

The `ConsoleLoggingService` is a singleton obtained via `CreateLoggingService()`.

---

## Dependency Injection

Use constructor injection throughout. Factory functions (`CreateX()`) create and wire dependencies.

```typescript
// Good: injected
class ChatService {
  constructor(private readonly logger: ILoggingService) {}
}

export function CreateChatService(logger: ILoggingService): IChatService {
  return new ChatService(logger);
}
```

---

## Validation with Zod

Define Zod schemas in `src/types/schemas.ts`. Derive TypeScript types from schemas.

```typescript
export const querySchema = z.object({
  prompt: z.object({ content: z.string().min(1) }),
  options: z.object({
    system_prompt: z.string().optional(),
    model: z.enum(Models).optional(),
  }).optional(),
});

export type Query = z.infer<typeof querySchema>;
```

Validate request bodies in routes using `zValidator` before passing data to controllers.

---

## Environment Variables

| Variable        | Description                                                     | Default            |
|-----------------|-----------------------------------------------------------------|--------------------|
| `PORT`          | HTTP server port                                                | `3000`             |
| `URL`           | Base URL used in startup logs                                   | `http://localhost` |
| `CORS_ORIGINS`  | Comma-separated allowed origins (supports `*` wildcard in port) | —                  |
| `DEFAULT_MODEL` | Fallback model when none specified in request                   | `Haiku`            |

Load via `import 'dotenv/config'` at the top of `server.ts`. Never hard-code secrets or access `process.env` outside of `config/env.ts`.

---

## File Naming and Module Imports

- Files use PascalCase for classes (`ChatService.ts`) and camelCase for utilities (`result.ts`)
- Always use `.js` extensions in import paths (required for ESM with `nodenext`):
  ```typescript
  import { Ok, Err } from "../lib/result.js";
  ```
- Never use default exports except for Hono route files

---

## What Belongs Where

| Layer       | Responsibility                                      | May not                                  |
|-------------|------------------------------------------------------|------------------------------------------|
| Route       | Mount controller methods, validate request body      | Call services directly, contain logic   |
| Controller  | Call service, return HTTP response                   | Contain business logic, parse HTTP body |
| Service     | Business logic, CLI invocation, return `Result<T,E>` | Parse HTTP, return `Response`           |

---

## Common Mistakes to Avoid

- Do not throw errors in services — return `Err(...)` instead
- Do not use `any` — use `unknown` and narrow
- Do not access `process.env` outside of `config/env.ts`
- Do not use `console.log` — use the injected `ILoggingService`
- Do not create helper utilities for single-use operations
- Do not add optional features or abstractions not required by the task
