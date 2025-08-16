import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerEVMTools } from "./core/tools.js";
import { registerTokenTools } from "./core/token-tools.js";
import { registerContractTools } from "./core/contract-tools.js";

async function main() {
  try {
    // Create MCP server instance
    const server = new McpServer(
      { name: "SEI MCP Server", version: "1.0.0" },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register EVM tools
    registerEVMTools(server);

    // Register Token tools
    registerTokenTools(server);

    // Register Contract tools
    registerContractTools(server);


    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Don't log to stderr during normal operation - it interferes with MCP protocol
  } catch (error) {
    console.error("Error starting SEI MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});