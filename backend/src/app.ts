import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { env } from "./config/env.js"
import type { IApp } from "./contract.js";
import { createHealthRouter } from "./routes/health.js";
import { openApiSpec } from "./config/openapi.js";
import type { IChatController } from "./controllers/ChatController.js";
import { createMessageRouter } from "./routes/messages.js";
import type { ILoggingService } from "./services/LoggingService.js";

const patterns = env.CORS_ORIGINS.split(",").map((origin) => {
  const escaped = origin.trim().replace(/\./g, "\\.").replace(/\*/g, "\\d+");
  return new RegExp(`^${escaped}(:\\d+)?$`);
});


export class HonoApp implements IApp {
    private readonly app: Hono;

    constructor(private readonly chatController: IChatController, private readonly logger: ILoggingService) {
        this.app = new Hono();
        this.registerMiddleware();
        this.registerRoutes();
    }

    private registerMiddleware(): void {
        const corsMiddleware = cors({
            origin: (origin) => {
                if (!origin) return origin;
                return patterns.some((r) => r.test(origin)) ? origin : null;
            },
            allowMethods: ["GET", "POST"],
        })

        this.app.use("*", corsMiddleware);
    }

    private registerRoutes(): void {
        this.app.route("/health", createHealthRouter());
        this.app.route("/messages", createMessageRouter(this.chatController, this.logger));


        this.app.get("/doc", (c) => c.json(openApiSpec));
        this.app.get("/ui", swaggerUI({ url: "/doc" }));
    }

    getApp(): Hono {
        return this.app;
    }
}

export function CreateApp(chatController: IChatController, logger: ILoggingService): HonoApp {
    return new HonoApp(chatController, logger);
}
