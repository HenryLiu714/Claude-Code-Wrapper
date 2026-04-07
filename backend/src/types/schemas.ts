import { z } from "zod"
import { Models } from "../ai_models/models.js";

const messageSchema = z.object({
    content: z.string().min(1),
})

export type Message = z.infer<typeof messageSchema>;

const chatOptionSchema = z.object({
    system_prompt: z.string().optional(),
    model: z.enum(Models).optional(),
})

export type ChatOptions = z.infer<typeof chatOptionSchema>;

export const querySchema = z.object({
    prompt: messageSchema,
    options: chatOptionSchema.optional()
})

export type Query = z.infer<typeof querySchema>;