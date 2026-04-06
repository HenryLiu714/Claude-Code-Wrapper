import type { Result } from "../src/lib/result.js";
import type { ILoggingService } from "../src/services/LoggingService.js";
import type { ChatOptions, ChatRequest, Message } from "../src/types/schemas.js";

export interface IChatController {
    handleChatRequest(
        chatRequest: ChatRequest,
        options?: ChatOptions
    ): Promise<Result<Message, Error>>;
}

class ChatController implements IChatController {
    constructor(private readonly logger: ILoggingService) {}
}