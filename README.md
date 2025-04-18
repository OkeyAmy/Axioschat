# NovachatV2

![NovachatV2 Title](https://sjc.microlink.io/1vRgADpCEWNh4TMR1VGylSUFVbYgtGFDhmbQIr9Hg56YlPwwXzGQO3dwwKmpCC5jVlo-NOd9CuQqr1PYOedWuQ.jpeg)

## Overview

NovachatV2 is an AI-powered chat interface that makes blockchain interactions accessible through natural language. By combining advanced language models with specialized Web3 knowledge, NovachatV2 allows users to perform blockchain operations, check balances, and learn about crypto concepts through simple conversation.

## Demo & Pitch Video

[Watch the NovachatV2 Demo & Pitch Video](www.youtube.com/watch?v=ieW3SK8Y0UM)
[See platform live (without AI functionality due to API limitations](novachat-v2.vercel.app)

## Key Features

![NovachatV2 Features](https://lh3.googleusercontent.com/d/17ghTS-zolKynlOFlkS3z5yDC5CtkoMBF)

![Additional Features](https://lh3.googleusercontent.com/d/1kbE2-1lZsu3zG_dwKn7sh44_V_q1Ke-L)

- **Natural Language Blockchain Interactions**: Execute blockchain operations using conversational language
- **Educational Responses**: Learn about blockchain concepts while performing actions
- **Multi-Chain Support**: Interact with multiple blockchain networks
- **Secure Transaction Approval**: Two-step verification for all transactions that modify blockchain state
- **Balance Checking**: Easily check wallet balances across chains
- **Token Transfers**: Send tokens through simple conversation
- **DEX Exploration**: Interact with, trade and stake by talking to your wallet

## Impact

![Project Impact](https://lh3.googleusercontent.com/d/1XzyyXk7Vgo2eiGJqS1CjemR4fqqzkeFB)

NovachatV2 bridges the gap between complex blockchain technology and everyday users by:

- Removing technical barriers to blockchain interaction
- Providing educational context with every operation
- Making Web3 accessible to non-technical users
- Streamlining common blockchain tasks through conversation

## Architecture

NovachatV2 uses a dual-model approach:

1. **Primary LLM (Llama 3.2)**: Handles general conversation and intent classification
2. **Specialized Web3 Model (Flock)**: Processes blockchain-specific requests and extracts function parameters

The system distinguishes between read-only operations (automatically executed) and state-changing operations (requiring user approval).

## Roadmap

![Project Roadmap](https://lh3.googleusercontent.com/d/1dXQKMOqwf8TpTnOQwsdb1AV56-e-S9Nj)

- **Phase 1**: Core functionality with Ethereum support
- **Phase 2**: Multi-chain expansion (Solana, Polygon, etc.)
- **Phase 3**: Advanced features (DEX interactions, yield farming)
- **Phase 4**: Mobile app and browser extension


## Information Flow

\`\`\`mermaid
graph TD;
    User["User Input"] --> LLM["Llama 3.2 Model"];
    LLM -- "Intent Classification" --> Decision{"Requires Web3\nFunction?"};
    Decision -- "No" --> DirectResponse["Generate Direct Response"];
    Decision -- "Yes" --> FlockModel["Flock Web3 Foundation Model"];
    FlockModel -- "Function Extraction" --> FunctionCall["Extract Function + Parameters"];
    FunctionCall --> FunctionType{"Function Type"};
    FunctionType -- "Read-Only\n(e.g., balance check)" --> AutoExecute["Auto-Execute Function"];
    FunctionType -- "Write\n(e.g., send tokens)" --> ApprovalQueue["User Approval Queue"];
    ApprovalQueue -- "User Approves" --> Execute["Execute Blockchain Function"];
    ApprovalQueue -- "User Rejects" --> Reject["Cancel Operation"];
    AutoExecute --> Web3["Web3.js / Blockchain"];
    Execute --> Web3;
    Web3 -- "Result Data" --> ResultInterpreter["AI Result Interpreter"];
    ResultInterpreter --> ContextEnrichment["Add Educational Context"];
    DirectResponse --> UserResponse["Response to User"];
    ContextEnrichment --> UserResponse;
    Reject --> RejectionMessage["Inform User of Cancellation"];
    RejectionMessage --> UserResponse;
\`\`\`

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Configure your environment variables
4. Run the development server with `npm run dev`

## License

[MIT License](LICENSE)
