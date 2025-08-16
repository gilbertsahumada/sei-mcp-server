import { BaseTokenFetcher, type TokenInfo, type TokenList } from "./BaseTokenFetcher.js";

// Sailor Finance token list response interface
interface SailorTokenResponse {
  id: string; // This is the token address
  name: string;
  symbol: string;
  url: string; // Logo URL
  decimals: string; // Note: comes as string, not number
  verified: boolean;
}

// Sailor Finance price response interface
interface SailorPriceResponse {
  [tokenAddress: string]: {
    price: number;
    volume24h?: number;
    liquidity?: number;
  };
}

/**
 * Sailor Finance Token Fetcher
 * 
 * Fetches token data from Sailor Finance API endpoints
 * Token List: https://asia-southeast1-ktx-finance-2.cloudfunctions.net/sailor_poolapi/getTokenListV2
 * Prices: https://asia-southeast1-ktx-finance-2.cloudfunctions.net/sailor_poolapi/getPriceList?tokens=
 */
export class SailorTokens extends BaseTokenFetcher {
  private static readonly TOKEN_LIST_URL = "https://asia-southeast1-ktx-finance-2.cloudfunctions.net/sailor_poolapi/getTokenListV2";
  private static readonly PRICE_API_URL = "https://asia-southeast1-ktx-finance-2.cloudfunctions.net/sailor_poolapi/getPriceList";
  
  constructor(chainId: number = 1329) {
    super("Sailor", chainId);
  }

  protected async fetchTokens(): Promise<TokenInfo[]> {
    try {
      const response = await fetch(SailorTokens.TOKEN_LIST_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SEI-MCP-Server/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Sailor API returned ${response.status}: ${response.statusText}`);
      }

      const tokens: SailorTokenResponse[] = await response.json();

      if (!Array.isArray(tokens)) {
        throw new Error("Invalid response format from Sailor API");
      }

      // Convert to TokenInfo format
      return tokens.map(token => ({
        address: token.id as `0x${string}`, // id is the token address
        symbol: token.symbol,
        name: token.name,
        decimals: parseInt(token.decimals), // Convert string to number
        logoURI: token.url,
        chainId: this.chainId, // Assume all tokens are for current chain
        isVerified: token.verified
      }));

    } catch (error) {
      console.error("Error fetching tokens from Sailor API:", error);
      
      // Return fallback tokens if API fails
      return this.getFallbackTokens();
    }
  }

  /**
   * Get fallback tokens if API is unavailable
   */
  private getFallbackTokens(): TokenInfo[] {
    if (this.chainId !== 1329) {
      return []; // No fallback for testnet
    }

    // Common Sei tokens as fallback
    return [
      {
        address: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Placeholder for WSEI
        symbol: "WSEI",
        name: "Wrapped SEI",
        decimals: 18,
        chainId: 1329,
        isVerified: true,
        tags: ["native", "wrapped"]
      },
      {
        address: "0x51121BCAE92E302f19D06C193C95E1f7b81a444b" as `0x${string}`, // Real YAKA address
        symbol: "YAKA",
        name: "Yaka Finance",
        decimals: 18,
        chainId: 1329,
        isVerified: true,
        tags: ["defi", "governance"]
      }
    ];
  }

  /**
   * Get prices for specific tokens using Sailor Finance price API
   * Note: API expects tokens parameter with comma at the beginning
   */
  async getTokenPrices(tokenAddresses: string[]): Promise<SailorPriceResponse> {
    try {
      // Format addresses with leading comma as required by API
      const tokensParam = "," + tokenAddresses.join(",");
      const url = `${SailorTokens.PRICE_API_URL}?tokens=${tokensParam}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SEI-MCP-Server/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Sailor Price API returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching prices from Sailor API:", error);
      return {};
    }
  }

  /**
   * Get token list with enhanced Sailor data including prices
   */
  async getTokensWithMetadata(forceRefresh: boolean = false): Promise<TokenList & {
    metadata: {
      verifiedTokens: number;
      totalTokens: number;
      tokensWithPrices: number;
      apiTimestamp: string;
    }
  }> {
    const tokenList = await this.getTokens(forceRefresh);
    const tokens = tokenList.tokens;
    
    // Get prices for all tokens
    const addresses = tokens.map(token => token.address);
    const prices = await this.getTokenPrices(addresses);
    
    // Add price data to tokens
    const tokensWithPrices = tokens.map(token => ({
      ...token,
      priceUsd: prices[token.address]?.price,
      volume24h: prices[token.address]?.volume24h,
      liquidityUsd: prices[token.address]?.liquidity
    }));

    const verifiedTokens = tokens.filter(token => token.isVerified).length;
    const tokensWithPricesCount = Object.keys(prices).length;

    return {
      ...tokenList,
      tokens: tokensWithPrices,
      metadata: {
        verifiedTokens,
        totalTokens: tokens.length,
        tokensWithPrices: tokensWithPricesCount,
        apiTimestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get high liquidity tokens (for trading recommendations)
   */
  async getHighLiquidityTokens(minLiquidityUsd: number = 10000): Promise<TokenInfo[]> {
    const tokensWithMetadata = await this.getTokensWithMetadata();
    
    return tokensWithMetadata.tokens
      .filter(token => (token.liquidityUsd || 0) >= minLiquidityUsd)
      .sort((a, b) => (b.liquidityUsd || 0) - (a.liquidityUsd || 0));
  }

  /**
   * Get most traded tokens (by 24h volume)
   */
  async getMostTradedTokens(limit: number = 10): Promise<TokenInfo[]> {
    const tokensWithMetadata = await this.getTokensWithMetadata();
    
    return tokensWithMetadata.tokens
      .filter(token => token.volume24h && token.volume24h > 0)
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, limit);
  }

  /**
   * Search tokens by symbol or name
   */
  async searchTokens(query: string): Promise<TokenInfo[]> {
    const tokens = await this.fetchTokens();
    const lowerQuery = query.toLowerCase();
    
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get verified tokens only
   */
  async getVerifiedTokens(): Promise<TokenInfo[]> {
    const tokens = await this.fetchTokens();
    return tokens.filter(token => token.isVerified);
  }

  /**
   * Get token by address
   */
  async getTokenByAddress(address: string): Promise<TokenInfo | null> {
    const tokens = await this.fetchTokens();
    return tokens.find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    ) || null;
  }
}