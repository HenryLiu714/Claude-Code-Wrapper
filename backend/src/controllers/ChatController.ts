import type { Result } from "../lib/result.js";
import type { IChatService } from "../services/ChatService.js";
import type { ILoggingService } from "../services/LoggingService.js";
import type { ChatOptions, Query, Message } from "../types/schemas.js";

export interface IChatController {
    handleChatRequest(
        query: Query,
    ): Promise<Result<Message, Error>>;
}

class ChatController implements IChatController {
    constructor(private readonly chatService: IChatService, private readonly logger: ILoggingService) {}

    async handleChatRequest(query: Query): Promise<Result<Message, Error>> {
        const response = await this.chatService.runQuery(query);
        return response;
    }
}

export function CreateChatController(chatService: IChatService, logger: ILoggingService): ChatController {
    return new ChatController(chatService, logger);
}  