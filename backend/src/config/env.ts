// src/env.ts — parse and validate env once at startup
import { z } from "zod";

const envSchema = z.object({
  URL: z.string().default("http://localhost"),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default("http://localhost:*"),
});

export const env = envSchema.parse(process.env);