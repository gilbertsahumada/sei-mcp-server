import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ContractAddresses } from "../dex/contracts/ContractAddresses.js";
import { DragonSwap } from "../dex/DragonSwap.js";
import { SailorDex } from "../dex/SailorDex.js";
import { YakaDex } from "../dex/YakaDex.js";
import { OkuDex } from "../dex/OkuDex.js";

/**
 * Register contract-related tools with the MCP server
 */
export function registerContractTools(server: McpServer) {

  // Get all contract addresses for a specific chain
  server.tool(
    "get_contract_addresses",
    "Get all DEX and token contract addresses for a specific chain",
    {
      chainId: z.number().optional().describe("Chain ID (1329 for Sei mainnet, 1328 for testnet). Default: 1329")
    },
    async ({ chainId = 1329 }) => {
      try {
        const contracts = new ContractAddresses(chainId);
        
        const dexContracts = {
          DragonSwap: contracts.getDexContracts("DragonSwap"),
          Sailor: contracts.getDexContracts("Sailor"),
          Yaka: contracts.getDexContracts("Yaka"),
          Oku: contracts.getDexContracts("Oku")
        };

        const tokenContracts = contracts.getTokenContracts();

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              chainId,
              dexContracts,
              tokenContracts,
              availableDexes: contracts.getAvailableDexes(),
              availableTokens: contracts.getAvailableTokens()
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching contract addresses: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get specific DEX contract addresses
  server.tool(
    "get_dex_contracts",
    "Get contract addresses for a specific DEX",
    {
      dexName: z.enum(["DragonSwap", "Sailor", "Yaka", "Oku"]).describe("DEX name"),
      chainId: z.number().optional().describe("Chain ID (default: 1329)")
    },
    async ({ dexName, chainId = 1329 }) => {
      try {
        const contracts = new ContractAddresses(chainId);
        const dexContracts = contracts.getDexContracts(dexName);
        
        // Check if addresses are placeholders
        const isPlaceholder = contracts.isPlaceholderAddress(dexContracts.router);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              dexName,
              chainId,
              contracts: dexContracts,
              isPlaceholder,
              warning: isPlaceholder ? "These are placeholder addresses. Real addresses needed for actual trading." : undefined
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching DEX contracts: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get token address by symbol
  server.tool(
    "get_token_address",
    "Get contract address for a specific token by symbol",
    {
      symbol: z.string().describe("Token symbol (e.g., WSEI, USDC, DRG, YAKA)"),
      chainId: z.number().optional().describe("Chain ID (default: 1329)")
    },
    async ({ symbol, chainId = 1329 }) => {
      try {
        const contracts = new ContractAddresses(chainId);
        const address = contracts.getTokenAddress(symbol);
        const isPlaceholder = contracts.isPlaceholderAddress(address);
        const isKnown = contracts.isKnownToken(address);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              symbol: symbol.toUpperCase(),
              address,
              chainId,
              isPlaceholder,
              isKnown,
              warning: isPlaceholder ? "This is a placeholder address. Real address needed for actual transactions." : undefined
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching token address: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get all supported tokens
  server.tool(
    "get_supported_tokens",
    "Get list of all supported tokens with their addresses",
    {
      chainId: z.number().optional().describe("Chain ID (default: 1329)")
    },
    async ({ chainId = 1329 }) => {
      try {
        const contracts = new ContractAddresses(chainId);
        const tokenContracts = contracts.getTokenContracts();
        
        const tokens = Object.entries(tokenContracts).map(([symbol, address]) => ({
          symbol,
          address,
          isPlaceholder: contracts.isPlaceholderAddress(address)
        }));

        const placeholderCount = tokens.filter(t => t.isPlaceholder).length;
        const realCount = tokens.length - placeholderCount;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              chainId,
              totalTokens: tokens.length,
              realAddresses: realCount,
              placeholderAddresses: placeholderCount,
              tokens
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching supported tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Check DEX readiness status
  server.tool(
    "check_dex_readiness",
    "Check if DEXes have real contract addresses and are ready for trading",
    {
      chainId: z.number().optional().describe("Chain ID (default: 1329)")
    },
    async ({ chainId = 1329 }) => {
      try {
        const dragonSwap = new DragonSwap(chainId === 1329 ? "sei" : "sei-testnet");
        const sailor = new SailorDex(chainId === 1329 ? "sei" : "sei-testnet");
        const yaka = new YakaDex(chainId === 1329 ? "sei" : "sei-testnet");
        const oku = new OkuDex(chainId === 1329 ? "sei" : "sei-testnet");

        const readiness = {
          DragonSwap: {
            hasRealAddresses: !dragonSwap.isUsingPlaceholderAddresses(),
            contracts: dragonSwap.getContractAddresses(),
            status: dragonSwap.isUsingPlaceholderAddresses() ? "NOT_READY" : "READY"
          },
          Sailor: {
            hasRealAddresses: !sailor.isUsingPlaceholderAddresses(),
            contracts: sailor.getContractAddresses(),
            status: sailor.isUsingPlaceholderAddresses() ? "NOT_READY" : "READY"
          },
          Yaka: {
            hasRealAddresses: !yaka.isUsingPlaceholderAddresses(),
            contracts: yaka.getContractAddresses(),
            status: yaka.isUsingPlaceholderAddresses() ? "NOT_READY" : "READY"
          },
          Oku: {
            hasRealAddresses: !oku.isUsingPlaceholderAddresses(),
            contracts: oku.getContractAddresses(),
            status: oku.isUsingPlaceholderAddresses() ? "NOT_READY" : "READY"
          }
        };

        const readyCount = Object.values(readiness).filter(dex => dex.status === "READY").length;
        const totalDexes = Object.keys(readiness).length;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              chainId,
              overallStatus: readyCount === totalDexes ? "ALL_READY" : readyCount > 0 ? "PARTIALLY_READY" : "NOT_READY",
              readyDexes: `${readyCount}/${totalDexes}`,
              dexes: readiness,
              nextSteps: readyCount < totalDexes ? [
                "Find real contract addresses for DEXes marked as NOT_READY",
                "Update ContractAddresses.ts with real addresses",
                "Test with small amounts before full deployment"
              ] : ["All DEXes ready for trading!"]
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error checking DEX readiness: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Update contract address (for when you find real addresses)
  server.tool(
    "update_dex_contracts",
    "Update DEX contract addresses (for development use)",
    {
      dexName: z.string().describe("DEX name"),
      router: z.string().describe("Router contract address"),
      factory: z.string().describe("Factory contract address"),
      quoter: z.string().optional().describe("Quoter contract address (for V3-style DEXes)"),
      positionManager: z.string().optional().describe("Position manager address"),
      multicall: z.string().optional().describe("Multicall contract address"),
      chainId: z.number().optional().describe("Chain ID (default: 1329)")
    },
    async ({ dexName, router, factory, quoter, positionManager, multicall, chainId = 1329 }) => {
      try {
        const contracts = new ContractAddresses(chainId);
        
        // Validate addresses
        if (!contracts.isValidAddress(router)) {
          throw new Error(`Invalid router address: ${router}`);
        }
        if (!contracts.isValidAddress(factory)) {
          throw new Error(`Invalid factory address: ${factory}`);
        }

        const newContracts = {
          router: router as `0x${string}`,
          factory: factory as `0x${string}`,
          ...(quoter && { quoter: quoter as `0x${string}` }),
          ...(positionManager && { positionManager: positionManager as `0x${string}` }),
          ...(multicall && { multicall: multicall as `0x${string}` })
        };

        // This is a development tool - in production you'd update the static data
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              action: "Contract addresses ready for update",
              dexName,
              chainId,
              newContracts,
              instruction: "These addresses should be manually updated in src/dex/contracts/ContractAddresses.ts",
              codeSnippet: `ContractAddresses.updateDexContracts(${chainId}, "${dexName}", ${JSON.stringify(newContracts, null, 2)})`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error updating DEX contracts: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  console.log("Contract tools registered successfully");
}