import { BaseTokenFetcher, type TokenInfo } from "./BaseTokenFetcher.js";

interface DragonSwapTokenListResponse {
  name?: string;
  version?: string;
  tokens: Array<{
    chainId: number;
    address: string;
    decimals: number;
    name: string;
    symbol: string;
    tags?: string[];
    about?: string;
    logoURI?: string;
  }>;
}

/**
 * DragonSwap Token Fetcher
 * 
 * Fetches tokens from DragonSwap's GitHub repository
 * URL: https://raw.githubusercontent.com/dragonswap-app/assets/refs/heads/main/tokenlist-sei-mainnet.json
 */
export class DragonSwapTokens extends BaseTokenFetcher {
  private static readonly TOKEN_LIST_URL = "https://raw.githubusercontent.com/dragonswap-app/assets/refs/heads/main/tokenlist-sei-mainnet.json";

  constructor(chainId: number = 1329) {
    super("DragonSwap", chainId);
  }

  protected async fetchTokens(): Promise<TokenInfo[]> {
    try {
      console.log(`Fetching DragonSwap tokens from: ${DragonSwapTokens.TOKEN_LIST_URL}`);
      
      const response = await fetch(DragonSwapTokens.TOKEN_LIST_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SEI-MCP-Server/1.0.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DragonSwapTokenListResponse = await response.json();
      
      if (!data.tokens || !Array.isArray(data.tokens)) {
        throw new Error('Invalid token list format: missing tokens array');
      }

      console.log(`Found ${data.tokens.length} tokens from DragonSwap`);

      // Filter and normalize tokens for the specified chain
      const filteredTokens = data.tokens
        .filter(token => token.chainId === this.chainId)
        .filter(token => this.validateToken(token))
        .map(token => this.normalizeDragonSwapToken(token));

      console.log(`Processed ${filteredTokens.length} valid tokens for chain ${this.chainId}`);
      
      return filteredTokens;

    } catch (error) {
      console.error('Error fetching DragonSwap tokens:', error);
      throw new Error(`Failed to fetch DragonSwap tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Normalize DragonSwap token format to our standard format
   */
  private normalizeDragonSwapToken(token: DragonSwapTokenListResponse['tokens'][0]): TokenInfo {
    return {
      address: token.address as `0x${string}`,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      chainId: token.chainId,
      logoURI: token.logoURI,
      tags: token.tags || [],
      about: token.about || ''
    };
  }

  /**
   * Get popular DragonSwap tokens (those with "Top" tag)
   */
  async getPopularTokens(): Promise<TokenInfo[]> {
    return this.getTokensByTags(['Top']);
  }

  /**
   * Get DeFi tokens from DragonSwap
   */
  async getDeFiTokens(): Promise<TokenInfo[]> {
    return this.getTokensByTags(['DeFi']);
  }

  /**
   * Get DragonSwap native token (DRG)
   */
  async getDragonSwapToken(): Promise<TokenInfo | null> {
    const tokens = await this.findTokensBySymbol('DRG');
    return tokens.find(token => token.name.includes('Dragonswap')) || tokens[0] || null;
  }

  /**
   * Get token list metadata
   */
  async getTokenListMetadata(): Promise<{
    name?: string;
    version?: string;
    tokenCount: number;
    chainId: number;
  }> {
    try {
      const response = await fetch(DragonSwapTokens.TOKEN_LIST_URL);
      const data: DragonSwapTokenListResponse = await response.json();
      
      return {
        name: data.name,
        version: data.version,
        tokenCount: data.tokens.filter(t => t.chainId === this.chainId).length,
        chainId: this.chainId
      };
    } catch (error) {
      console.error('Error fetching DragonSwap metadata:', error);
      return {
        tokenCount: 0,
        chainId: this.chainId
      };
    }
  }

  /**
   * Validate if token exists in DragonSwap
   */
  async isTokenSupported(address: string): Promise<boolean> {
    try {
      const token = await this.findTokenByAddress(address as `0x${string}`);
      return token !== null;
    } catch (error) {
      console.error('Error checking token support:', error);
      return false;
    }
  }

  /**
   * Get tokens with specific tags
   */
  async getTokensWithTags(): Promise<{ [tag: string]: TokenInfo[] }> {
    const tokenList = await this.getTokens();
    const result: { [tag: string]: TokenInfo[] } = {};

    tokenList.tokens.forEach(token => {
      if (token.tags) {
        token.tags.forEach(tag => {
          if (!result[tag]) {
            result[tag] = [];
          }
          result[tag].push(token);
        });
      }
    });

    return result;
  }
}