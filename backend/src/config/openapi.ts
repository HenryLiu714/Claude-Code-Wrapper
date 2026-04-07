export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "API",
    version: "1.0.0",
  },
  paths: {
    "/messages": {
      post: {
        summary: "Send a chat message",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["prompt"],
                properties: {
                  prompt: {
                    type: "object",
                    required: ["content"],
                    properties: {
                      content: { type: "string", minLength: 1, example: "Hello!" },
                    },
                  },
                  options: {
                    type: "object",
                    properties: {
                      system_prompt: { type: "string" },
                      model: { type: "string", enum: ["Haiku", "Sonnet"] },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Success",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
