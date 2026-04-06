import { z } from "zod"

const messageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1),
})

export type Message = z.infer<typeof messageSchema>;

const chatSchema = z.object({
     messages: z.array(messageSchema).min(1),
     system: z.string().optional()
})

export type ChatRequest = z.infer<typeof chatSchema>;

const chatOptionSchema = z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).optional(),
})

export type ChatOptions = z.infer<typeof chatOptionSchema>;