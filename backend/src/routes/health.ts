import { Hono } from "hono";

export function createHealthRouter() {
    const router = new Hono();

    router.get("/", (c) => {
        return c.json({ status: "ok" });
    });

    return router;
}