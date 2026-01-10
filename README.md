# 🤖 AxiosChat: The First Agentic Wallet on MNEE

> **"Don't just chat about crypto. Use an AI agent that can actually pay."**

![MNEE Hackathon](https://img.shields.io/badge/Built%20For-MNEE%20Hackathon%202025-blueviolet?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge) ![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Vite%20%7C%20MNEE%20SDK-blue?style=for-the-badge)

AxiosChat transforms the crypto experience by integrating a **native MNEE wallet directly into the AI Agent's persona**. It bridges the gap between natural language and blockchain execution, enabling "Agentic Commerce" where AI doesn't just assist—it transacts.

---

## 🚀 The Vision: Why This Matters

Current crypto tools force users to context-switch: copy addresses, open wallet apps, sign, switch back. **AxiosChat eliminates this friction.**

- **🗣️ Natural Language Payments:** "Send 5 MNEE to @Alice for coffee." → **Done.**
- **🧠 Autonomous Management:** Your agent monitors your balance and alerts you to low funds.
- **💡 Smart Context:** "Tip the author of this article." → Agent resolves the address and prepares the tx.

**This is not just a chatbot. It's an autonomous financial agent.**

---

## ✨ Key Capabilities

| Feature | Description | MNEE Tech Used |
| :--- | :--- | :--- |
| **Text-to-Pay** | Execute transfers using conversational English. No more hex addresses. | `mnee.transfer`, `mnee.transferMulti` |
| **Agent Wallet** | A dedicated HD sub-account derived specifically for the agent. | `Mnee.HDWallet`, `deriveAddress` |
| **Smart Tipping** | Instantly tip creators or service providers based on context. | `mnee.getUtxos`, `validateMneeTx` |
| **Balance Watch** | Proactive monitoring of your financial state. | `mnee.balance` |

---

## 🛠️ Technical Architecture

AxiosChat is built for speed and security, leveraging the full power of the **MNEE SDK** and **Google Gemini**.

```mermaid
graph TD
    User[User] -->|Chat: "Send 5 MNEE..."| UI[AxiosChat UI]
    UI -->|Prompt| AI[Gemini AI]
    AI -->|Function Call: prepare_transfer| Service[MNEE Service]
    Service -->|1. Check Balance| Chain[MNEE Blockchain]
    Service -->|2. Get UTXOs| Chain
    Service -->|3. Construct Raw Tx| SDK[MNEE SDK]
    SDK -->|Unsigned Tx| UI
    UI -->|Review & Sign| User
    User -->|Signed Tx| UI
    UI -->|Broadcast| Chain
```

---

## 🏁 Developer Quickstart

Ready to build the future of payments? Follow these steps to get AxiosChat running locally.

### 1. Prerequisites

- **Node.js** v18+ & `pnpm`
- **MNEE CLI**: `npm i -g @mnee/cli`
- **MNEE Developer Account**: [developer.mnee.net](https://developer.mnee.net/)
- **Gemini API Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 2. Wallet Setup (Sandbox)

Create a secure environment for testing:

```bash
# Create a new MNEE sandbox wallet
mnee create --network sandbox

# Fund it (Free tokens!)
mnee faucet --address <YOUR_NEW_ADDRESS>

# Export your WIF key (Save this!)
mnee export
```

### 3. Installation

```bash
git clone https://github.com/your-username/axioschat-sensay.git
cd axioschat-sensay
pnpm install
```

### 4. Configuration

Create a `.env` file in the root directory:

```env
# AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# MNEE Blockchain Configuration
VITE_MNEE_NETWORK=sandbox
VITE_MNEE_API_KEY=your_mnee_api_key
# Your Sandbox WIF Key (From Step 2)
MNEE_WIF_KEY=your_wif_key_here 
```

### 5. Launch 🚀

```bash
pnpm dev
```

Visit `http://localhost:8080` and start chatting with your financial agent!

---

## 🧪 Try These Commands

Once running, try these prompts to see the agent in action:

1.  **Check Balance:** *"How much MNEE do I have left?"*
2.  **Simple Transfer:** *"Send 1 MNEE to 1FQ6..."* (Use a real sandbox address)
3.  **Complex Request:** *"Split 5 MNEE between Alice (1Address...) and Bob (1Address...)"*

---

## 🏆 Hackathon Tracks

This project targets the following MNEE Hackathon tracks:

- **✅ AI & Agent Payments:** Core functionality. Autonomous financial agents.
- **✅ Commerce & Creator Tools:** "Smart Tipping" enables frictionless creator support.
- **✅ Financial Automation:** Programmable logic for asset management.

---

## 🔐 Security & Disclaimer

> [!WARNING]
> **Hackathon Prototype**: This project stores the WIF private key in client-side environment variables for demonstration purposes. In a production environment, use a secure enclave, HSM, or a browser extension wallet (like MNEE Connect) for signing.

---

**Built with ❤️ for the MNEE Hackathon 2025**
