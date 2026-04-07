import { Hono } from "hono";

import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { querySchema } from "../types/schemas.js";
import type { IChatController } from "../controllers/ChatController.js";
import type { ILoggingService } from "../services/LoggingService.js";

export function createMessageRouter(controller: IChatController, logger: ILoggingService) {
    const router = new Hono();

    router.post("/", zValidator("json", querySchema), async (c) => {
        const query = c.req.valid("json");
        const result = await controller.handleChatRequest(query);

        if (result.ok) {
            return c.json({ message: result.value });
        } else {
            logger.error(`Error handling chat request ${result.value.message}`);
            return c.json({ error: result.value.message }, 500);
        }
    })
    return router;
}