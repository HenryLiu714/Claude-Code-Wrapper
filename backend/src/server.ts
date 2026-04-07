import "dotenv/config";
import { serve } from "@hono/node-server";
import { CreateApp } from "./app.js";
import type { IApp, IServer } from "./contract.js";
import { CreateLoggingService } from "./services/LoggingService.js";
import { env } from "./config/env.js";
import { CreateChatService } from "./services/ChatService.js";
import { CreateChatController } from "./controllers/ChatController.js";

const logger = CreateLoggingService();

export class HTTPServer implements IServer {
    constructor(private readonly app: IApp) {}

    start(port: number): void {
        serve(
            {
                fetch: this.app.getApp().fetch,
                port,
            },
            (info) => {
                logger.info(`Server listening on port ${info.port}`);
                logger.info(`UI: http://localhost:${info.port}/ui`)
            }
        );
    }
}

const PORT = env.PORT;

const chatService = CreateChatService(logger);
const chatController = CreateChatController(chatService, logger);

const app = CreateApp(chatController,logger);
const server = new HTTPServer(app);
server.start(PORT);
