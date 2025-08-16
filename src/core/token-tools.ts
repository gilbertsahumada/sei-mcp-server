import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TokenManager, DragonSwapTokens, SailorTokens, OkuTradeTokens, YakaFinanceTokens } from "../dex/tokens/index.js";
import type { ProtocolName } from "../dex/tokens/TokenManager.js";

/**
 * Register token-related tools with the MCP server
 */
export function registerTokenTools(server: McpServer) {
  const tokenManager = new TokenManager(1329); // Sei mainnet

  // Get unified token list from all protocols
  server.tool(
    "get_unified_token_list",
    "Get a unified list of all tokens from DragonSwap, Oku Trade, and Yaka Finance",
    {
      forceRefresh: z.boolean().optional().describe("Force refresh token data from sources (default: false)")
    },
    async ({ forceRefresh = false }) => {
      try {
        const tokens = await tokenManager.getUnifiedTokenList(forceRefresh);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalTokens: tokens.length,
              tokens: tokens.map(token => ({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                sources: token.sources,
                bestPrice: token.bestPrice,
                priceVariance: token.priceVariance,
                logoURI: token.logoURI,
                tags: token.tags
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching unified token list: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get tokens from specific protocol
  server.tool(
    "get_tokens_by_protocol",
    "Get tokens from a specific protocol (DragonSwap, OkuTrade, or YakaFinance)",
    {
      protocol: z.enum(["DragonSwap", "OkuTrade", "YakaFinance"]).describe("Protocol to fetch tokens from"),
      forceRefresh: z.boolean().optional().describe("Force refresh token data (default: false)")
    },
    async ({ protocol, forceRefresh = false }) => {
      try {
        const fetcher = tokenManager.getProtocolFetcher(protocol);
        if (!fetcher) {
          throw new Error(`Protocol ${protocol} not found`);
        }

        const tokenList = await fetcher.getTokens(forceRefresh);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              protocol: tokenList.protocolName,
              chainId: tokenList.chainId,
              totalTokens: tokenList.tokens.length,
              lastUpdated: new Date(tokenList.lastUpdated).toISOString(),
              tokens: tokenList.tokens
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching tokens from ${protocol}: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Search tokens across all protocols
  server.tool(
    "search_tokens",
    "Search for tokens by name, symbol, or address across all protocols",
    {
      query: z.string().describe("Search query (token name, symbol, or address)")
    },
    async ({ query }) => {
      try {
        const results = await tokenManager.searchTokensAcrossProtocols(query);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              query,
              resultsCount: results.length,
              tokens: results.map(token => ({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                sources: token.sources,
                bestPrice: token.bestPrice,
                logoURI: token.logoURI
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error searching tokens: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Find token details everywhere
  server.tool(
    "find_token_everywhere",
    "Find detailed information about a token across all protocols",
    {
      address: z.string().describe("Token contract address (e.g., '0x1234...')")
    },
    async ({ address }) => {
      try {
        const comparison = await tokenManager.findTokenEverywhere(address as `0x${string}`);
        
        if (!comparison) {
          return {
            content: [{
              type: "text",
              text: `Token not found in any protocol: ${address}`
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              token: {
                address: comparison.address,
                symbol: comparison.symbol,
                name: comparison.name
              },
              availableIn: comparison.protocols.map(p => p.protocol),
              priceComparison: comparison.protocols.map(p => ({
                protocol: p.protocol,
                price: p.price,
                riskScore: p.riskScore,
                hasLogo: !!p.logoURI
              })),
              priceSpread: comparison.priceSpread
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error finding token: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get tokens with current prices (from Yaka Finance)
  server.tool(
    "get_tokens_with_prices",
    "Get tokens that have current price data available",
    {
      sortBy: z.enum(["price", "name", "symbol"]).optional().describe("Sort results by price, name, or symbol"),
      limit: z.number().optional().describe("Limit number of results (default: 50)")
    },
    async ({ sortBy = "price", limit = 50 }) => {
      try {
        const yakaFetcher = new YakaFinanceTokens(1329);
        const tokens = await yakaFetcher.getTokensWithPrices();
        
        // Sort tokens
        let sortedTokens = [...tokens];
        if (sortBy === "price") {
          sortedTokens.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === "name") {
          sortedTokens.sort((a, b) => a.name.localeCompare(b.name));
        } else {
          sortedTokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
        }

        // Apply limit
        const limitedTokens = sortedTokens.slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              totalWithPrices: tokens.length,
              showing: limitedTokens.length,
              sortedBy: sortBy,
              tokens: limitedTokens.map(token => ({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                price: token.price,
                riskScore: token.riskScore,
                decimals: token.decimals
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching tokens with prices: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get arbitrage opportunities (price differences)
  server.tool(
    "get_arbitrage_opportunities",
    "Find tokens with price differences between protocols (potential arbitrage)",
    {
      minSpread: z.number().optional().describe("Minimum price spread percentage to show (default: 5%)")
    },
    async ({ minSpread = 5 }) => {
      try {
        const opportunities = await tokenManager.getArbitrageOpportunities(minSpread);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              minSpreadRequired: `${minSpread}%`,
              opportunitiesFound: opportunities.length,
              opportunities: opportunities.map(opp => ({
                token: {
                  address: opp.address,
                  symbol: opp.symbol,
                  name: opp.name
                },
                priceSpread: {
                  variance: `${opp.priceSpread?.variance.toFixed(2)}%`,
                  minPrice: opp.priceSpread?.min,
                  maxPrice: opp.priceSpread?.max
                },
                protocols: opp.protocols.map(p => ({
                  protocol: p.protocol,
                  price: p.price
                }))
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error finding arbitrage opportunities: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get cross-protocol statistics
  server.tool(
    "get_cross_protocol_stats",
    "Get comprehensive statistics about tokens across all protocols",
    {},
    async () => {
      try {
        const stats = await tokenManager.getCrossProtocolStats();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              overview: {
                totalUniqueTokens: stats.totalUniqueTokens,
                commonTokens: stats.commonTokens,
                uniqueTokensPercentage: `${((stats.totalUniqueTokens - stats.commonTokens) / stats.totalUniqueTokens * 100).toFixed(1)}%`
              },
              protocolBreakdown: {
                DragonSwap: {
                  ...stats.protocolStats.DragonSwap,
                  avgPriceFormatted: `$${stats.protocolStats.DragonSwap.avgPrice.toFixed(4)}`
                },
                OkuTrade: {
                  ...stats.protocolStats.OkuTrade,
                  avgPriceFormatted: `$${stats.protocolStats.OkuTrade.avgPrice.toFixed(4)}`
                },
                YakaFinance: {
                  ...stats.protocolStats.YakaFinance,
                  avgPriceFormatted: `$${stats.protocolStats.YakaFinance.avgPrice.toFixed(4)}`
                }
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error fetching cross-protocol stats: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Get protocol health status
  server.tool(
    "get_protocol_health",
    "Check the health status of all token protocol APIs",
    {},
    async () => {
      try {
        const health = await tokenManager.getProtocolHealthStatus();
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              timestamp: new Date().toISOString(),
              protocols: {
                DragonSwap: {
                  status: health.DragonSwap.status,
                  lastCheck: new Date(health.DragonSwap.lastCheck).toISOString(),
                  error: health.DragonSwap.error
                },
                OkuTrade: {
                  status: health.OkuTrade.status,
                  lastCheck: new Date(health.OkuTrade.lastCheck).toISOString(),
                  error: health.OkuTrade.error
                },
                YakaFinance: {
                  status: health.YakaFinance.status,
                  lastCheck: new Date(health.YakaFinance.lastCheck).toISOString(),
                  error: health.YakaFinance.error
                }
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error checking protocol health: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  console.log("Token tools registered successfully");
}