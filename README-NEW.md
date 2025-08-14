# SEI MCP Server

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)
![Viem](https://img.shields.io/badge/Viem-2.0+-green)
![Tests](https://img.shields.io/badge/Tests-24%2F24%20Passing-brightgreen)

A Model Context Protocol (MCP) server that provides comprehensive blockchain services for the Sei network. This server enables AI assistants like Claude to interact with Sei blockchain through a standardized interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Claude Desktop Integration](#claude-desktop-integration)
  - [Local Development](#local-development)
  - [Inspector Tool](#inspector-tool)
- [Available Tools](#available-tools)
- [Testing](#testing)
- [Development](#development)
- [Security](#security)
- [License](#license)

## 🔭 Overview

The Sei MCP Server leverages the Model Context Protocol to provide blockchain services to AI agents. It supports comprehensive Sei blockchain operations including:

- **Blockchain state reading** (balances, transactions, blocks)
- **Smart contract interactions** (read/write operations)
- **Token operations** (native SEI, ERC20, ERC721, ERC1155)
- **Transaction management** (sending, monitoring, gas estimation)
- **Wallet operations** (address derivation, key management)

## ✨ Features

### 🌐 Network Support
- **Sei Mainnet** (Chain ID: 1329)
- **Sei Testnet** (Chain ID: 713715)
- **Sei Devnet** (Chain ID: 713714)

### 💰 Token Operations
- **Native SEI**: Balance queries, transfers, gas estimation
- **ERC20 Tokens**: Metadata, balances, transfers, approvals
- **NFTs (ERC721)**: Metadata, ownership, transfers, collection info
- **Multi-tokens (ERC1155)**: Balances, metadata, batch operations

### 📄 Smart Contracts
- **Read Operations**: Call view/pure functions
- **Write Operations**: Execute state-changing functions
- **Contract Verification**: Distinguish contracts from EOAs
- **Event Logs**: Retrieve and filter blockchain events

### 🔗 Blockchain Data
- **Chain Information**: Network details, block numbers, RPCs
- **Block Data**: Latest blocks, historical data, transaction lists
- **Transaction Details**: Full transaction data and receipts
- **Address Analysis**: Balance checking, transaction history

## 🛠️ Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **bun** package manager
- **tsx** (installed automatically)

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd sei-mcp-server

# Install dependencies
npm install

# Run tests to verify installation
npm test
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for transaction signing operations
PRIVATE_KEY=your_private_key_here

# Optional: Custom port for HTTP server
PORT=3001

# Optional: API keys for external services
NFTSCAN_API_KEY=your_api_key_here
```

**⚠️ Security Warning**: Never commit your private key to version control. The `.env` file is included in `.gitignore`.

### Supported Networks

| Network | Chain ID | RPC Endpoint |
|---------|----------|-------------|
| Sei Mainnet | 1329 | Default configured |
| Sei Testnet | 713715 | Default configured |
| Sei Devnet | 713714 | Default configured |

## 🚀 Usage

### Claude Desktop Integration

#### Step 1: Configure the MCP Server

1. **Install Claude Desktop** from [claude.ai/download](https://claude.ai/download)
2. **Open Claude Desktop Settings** → Developer → Edit Config
3. **Add the following configuration:**

```json
{
  "mcpServers": {
    "sei-mcp": {
      "command": "tsx",
      "args": ["src/index.ts"],
      "cwd": "/absolute/path/to/your/sei-mcp-server",
      "env": {
        "PRIVATE_KEY": "your_private_key_here"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/your/sei-mcp-server` with your actual project path.

#### Step 2: Alternative Configuration (using npm)

```json
{
  "mcpServers": {
    "sei-mcp": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/absolute/path/to/your/sei-mcp-server",
      "env": {
        "PRIVATE_KEY": "your_private_key_here"
      }
    }
  }
}
```

#### Step 3: Verify Integration

1. **Save configuration** and restart Claude Desktop
2. **Test the connection** by asking Claude:
   ```
   What MCP tools do you have available for blockchain operations?
   ```
3. **Try a specific operation**:
   ```
   Use the get_chain_info tool to show me Sei network information
   ```

### Local Development

```bash
# Start the MCP server in stdio mode
npm run dev

# Start the HTTP server (for web integrations)
npm run dev:http

# Build the project
npm run build
```

### Inspector Tool

The MCP Inspector provides a web interface to test and debug tools:

```bash
# Launch the inspector
npm run inspector

# Opens browser at http://localhost:6274
# Shows all available tools with interactive testing
```

## 🔧 Available Tools

### Network & Blockchain
- `get_chain_info` - Network information and status
- `get_supported_networks` - List of supported networks
- `get_latest_block` - Latest block data
- `get_block_by_number` - Specific block information

### Balances & Tokens
- `get_balance` - Native SEI balance
- `get_token_balance` - ERC20 token balance
- `get_token_info` - Token metadata (name, symbol, decimals)
- `get_nft_balance` - NFT collection balance
- `get_erc1155_balance` - ERC1155 token balance

### Transactions
- `get_transaction` - Transaction details
- `get_transaction_receipt` - Transaction receipt
- `estimate_gas` - Gas estimation
- `transfer_sei` - Send native SEI tokens
- `transfer_token` - Send ERC20 tokens
- `transfer_nft` - Transfer NFTs
- `transfer_erc1155` - Transfer ERC1155 tokens

### Smart Contracts
- `read_contract` - Call contract view functions
- `write_contract` - Execute contract functions
- `is_contract` - Check if address is a contract
- `approve_token_spending` - Approve token allowances

### NFTs & Collectibles
- `get_nft_info` - NFT metadata and details
- `check_nft_ownership` - Verify NFT ownership
- `get_erc1155_token_uri` - ERC1155 metadata URI

### Wallet Operations
- `get_address_from_private_key` - Derive wallet address

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with bun
bun test

# Run specific test file
bun test src/tests/core/services/balance.test.ts
```

**Test Coverage:**
- ✅ Core utilities and validation
- ✅ Balance and token operations
- ✅ Transfer functionality
- ✅ MCP tool registration
- ✅ Configuration management

## 🔨 Development

### Project Structure

```
sei-mcp-server/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── http-server.ts        # HTTP server for web integrations
│   ├── core/
│   │   ├── chains.ts         # Network configurations
│   │   ├── config.ts         # Environment variables
│   │   ├── tools.ts          # MCP tool definitions
│   │   ├── resources.ts      # MCP resource handlers
│   │   ├── prompts.ts        # MCP prompt templates
│   │   └── services/         # Blockchain service implementations
│   └── tests/                # Test suites
├── .env                      # Environment variables
├── package.json              # Dependencies and scripts
└── bunfig.toml              # Bun configuration
```

### Development Commands

```bash
# Start development server
npm run dev

# Start HTTP development server
npm run dev:http

# Run tests in watch mode
npm test

# Launch inspector for debugging
npm run inspector

# Lint code (when configured)
npm run lint
```

### Adding New Tools

1. **Define the tool** in `src/core/tools.ts`
2. **Implement the service** in `src/core/services/`
3. **Add tests** in `src/tests/core/services/`
4. **Update documentation**

## 🔒 Security

### Best Practices

- **Private Key Management**: Store private keys in `.env` file only
- **Network Security**: Use HTTPS in production environments
- **Access Control**: Implement authentication for production deployments
- **Rate Limiting**: Consider adding rate limits for public APIs
- **Input Validation**: All inputs are validated using Zod schemas

### Environment Variables

- `PRIVATE_KEY`: Used only for transaction signing, never stored
- Never commit `.env` files to version control
- Use different keys for different environments (dev/staging/prod)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing issues for solutions
- Use the inspector tool for debugging: `npm run inspector`

---

**Built with ❤️ for the Sei ecosystem**