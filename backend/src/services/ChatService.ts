import type { ILoggingService } from "./LoggingService.js";
import { exec } from "child_process";
import type { Result } from "../lib/result.js";
import type { ChatOptions, Query, Message } from "../types/schemas.js";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface IChatService {
    runQuery(
        query: Query,
    ): Promise<Result<Message, Error>>;
}

function extractJson(raw: string): unknown {
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  return JSON.parse(stripped);
}

class ChatService {
    constructor(private readonly logger: ILoggingService) {}

    async runQuery(
        query: Query,
    ): Promise<Result<Message, Error>> {
        this.logger.info(`Running query with prompt: ${query.prompt.content}`);
        
        const base_system_prompt = query.options?.system_prompt || "You are a helpful assistant.";

        let system_prompt = base_system_prompt;

        if (query.options?.response_format?.type === "json") {
            system_prompt += `${base_system_prompt} Always respond with valid JSON only, no markdown, no backticks. Your response must conform to this JSON schema: ${JSON.stringify(query.options.response_format.schema)}`;
        }

        const cmd = [
            "claude",
            "-p", JSON.stringify(query.prompt.content),
            "--model", query.options?.model || env.DEFAULT_MODEL,
            "--system-prompt", JSON.stringify(system_prompt),
            "--output-format", "json",
            "--allowedTools", "none",
            "--no-session-persistence",
            "< /dev/null"
        ].join(" ")

        try {
            const { stdout, stderr } = await execAsync(cmd, { cwd: "/tmp" });

            if (stderr) {
                this.logger.error(`Error from Claude CLI ${stderr}`);
                return { ok: false, value: new Error(stderr) };
            }

            const response = JSON.parse(stdout);
            const message: Message = {
                content: response.result,
            };

            if (query.options?.response_format?.type === "json") {
                try {
                    const jsonContent = extractJson(response.result);
                    message.content = JSON.stringify(jsonContent);
                } catch (parseError) {
                    this.logger.error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
                    return { ok: false, value: new Error("Failed to parse JSON response") };
                }
            }

            return { ok: true, value: message };
        }

        catch (error) {
            this.logger.error(`Error running query ${error instanceof Error ? error.message : "Unknown error"}`);
            return { ok: false, value: error instanceof Error ? error : new Error("Unknown error") };
        }
    }
}

export function CreateChatService(logger: ILoggingService): ChatService {
    return new ChatService(logger);
}
