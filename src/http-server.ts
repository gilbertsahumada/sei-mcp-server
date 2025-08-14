import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { registerEVMTools } from "./core/tools.js";
import express, { Request, Response } from "express";
import cors from "cors";

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = "0.0.0.0";

async function main() {
  try {
    // Create MCP server instance
    const server = new McpServer(
      { name: "SEI MCP Server", version: "1.0.0" },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Register EVM tools
    registerEVMTools(server);

    // Create Express app
    const app = express();
    app.use(express.json());
    app.use(cors({
      origin: "*",
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }));

    const connections = new Map<string, SSEServerTransport>();

    // SSE endpoint
    app.get("/sse", (req: Request, res: Response) => {
      const sessionId = generateSessionId();
      
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");

      try {
        const transport = new SSEServerTransport("/messages", res);
        connections.set(sessionId, transport);

        req.on("close", () => {
          connections.delete(sessionId);
        });

        server.connect(transport).then(() => {
          res.write(`data: ${JSON.stringify({ type: "session_init", sessionId })}\n\n`);
        });
      } catch (error) {
        console.error("Error creating SSE transport:", error);
        connections.delete(sessionId);
        res.status(500).send("Internal server error");
      }
    });

    // Messages endpoint
    app.post("/messages", (req: Request, res: Response) => {
      const sessionId = req.query.sessionId?.toString() || Array.from(connections.keys())[0];
      
      if (!sessionId) {
        return res.status(400).json({ error: "No session ID provided" });
      }

      const transport = connections.get(sessionId);
      if (!transport) {
        return res.status(404).json({ error: "Session not found" });
      }

      transport.handlePostMessage(req, res).catch((error: Error) => {
        console.error("Error handling message:", error);
        res.status(500).json({ error: "Internal server error" });
      });
    });

    // Health endpoint
    app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "ok",
        server: "initialized",
        activeConnections: connections.size,
      });
    });

    // Start server
    app.listen(PORT, HOST, () => {
      console.error(`SEI MCP Server running at http://${HOST}:${PORT}`);
      console.error(`SSE endpoint: http://${HOST}:${PORT}/sse`);
      console.error(`Health check: http://${HOST}:${PORT}/health`);
    });

  } catch (error) {
    console.error("Error starting SEI MCP HTTP server:", error);
    process.exit(1);
  }
}

function generateSessionId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});