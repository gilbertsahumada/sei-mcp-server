# MCP Inspector

This project includes commands to inspect MCP tools and test their functionality.

## Available Commands

### Inspector for stdio server (recommended)
```bash
npm run inspector
```
This command:
- Runs the MCP server in stdio mode
- Opens a web interface to inspect tools
- Allows interactive testing of each tool
- Shows input and output schemas

### Inspector for HTTP server
```bash
# Terminal 1: Run the HTTP server
npm run dev:http

# Terminal 2: Run the inspector
npm run inspector:http
```

## How to use the inspector

1. **Run the inspector**: `npm run inspector`
2. **Browser opens automatically** at `http://localhost:5173`
3. **Explore tools**: See all available tools in the sidebar
4. **Test tools**: Click on any tool to see its schema and test it
5. **View results**: Results are shown in real-time

## Available tools for inspection

The SEI MCP server includes the following tool categories:

### Network and Blockchain
- `get_chain_info` - Sei network information
- `get_supported_networks` - Supported networks
- `get_latest_block` - Latest block
- `get_block_by_number` - Specific block

### Balances
- `get_balance` - Native balance (SEI)
- `get_token_balance` - ERC20 token balance
- `get_erc20_balance` - Specific ERC20 balance
- `get_nft_balance` - NFT balance

### Transactions
- `get_transaction` - Transaction details
- `get_transaction_receipt` - Transaction receipt
- `estimate_gas` - Gas estimation
- `transfer_sei` - Transfer native SEI
- `transfer_token` - Transfer ERC20 tokens
- `transfer_nft` - Transfer NFTs

### Contracts
- `read_contract` - Read contract data
- `write_contract` - Write to contract
- `is_contract` - Check if address is contract
- `get_token_info` - Token information

### NFTs and ERC1155
- `get_nft_info` - NFT information
- `check_nft_ownership` - Check NFT ownership
- `get_erc1155_token_uri` - ERC1155 token URI
- `get_erc1155_balance` - ERC1155 balance
- `transfer_erc1155` - Transfer ERC1155 tokens

### Wallet
- `get_address_from_private_key` - Get address from private key

## Required environment variables

To test tools that require transaction signing, configure:

```bash
# .env
PRIVATE_KEY=your_private_key_here
PORT=3001
```

## Usage tips

- **Without private key**: You can test read-only tools (get_*, read_*)
- **With private key**: You can test all tools including transfers
- **Testnet**: Use test networks to avoid real costs
- **Logs**: Errors are shown in the inspector console

## Debugging

If you encounter issues:

1. Verify the server is running
2. Check logs in browser console
3. Ensure environment variables are configured
4. Verify the network is valid (sei, sei-testnet, sei-devnet)