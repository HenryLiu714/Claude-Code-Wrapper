import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { env } from "./config/env.js"
import type { IApp, ILoggingService } from "./contract.js";
import healthRoutes from "./routes/health.js";
import { openApiSpec } from "./config/openapi.js";

const patterns = env.CORS_ORIGINS.split(",").map((origin) => {
  const escaped = origin.trim().replace(/\./g, "\\.").replace(/\*/g, "\\d+");
  return new RegExp(`^${escaped}(:\\d+)?$`);
});


export class HonoApp implements IApp {
    private readonly app: Hono;

    constructor(private readonly logger: ILoggingService) {
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
        this.app.route("/health", healthRoutes);
        this.app.get("/doc", (c) => c.json(openApiSpec));
        this.app.get("/ui", swaggerUI({ url: "/doc" }));
    }

    getApp(): Hono {
        return this.app;
    }
}

export function CreateApp(logger: ILoggingService): HonoApp {
    return new HonoApp(logger);
}
