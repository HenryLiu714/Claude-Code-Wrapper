import type { Hono } from "hono";
/**
 * Interface for the Hono app wrapper
 */
export interface IApp {
    getApp(): Hono;
}

/**
 * Interface for a server process that can listen on a port
 */
export interface IServer {
    start(port: number): void;
}
