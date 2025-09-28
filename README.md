# AMU 7702 – Cross-Chain Gas Payments with Your Existing Wallet  

## 🚀 Project Description  
The multi-chain ecosystem is growing rapidly with Bitcoin L2s (Rootstock), Hyperliquid, ENS Chain, World Chain, and more. While this unlocks innovation, it also creates a major **user experience challenge**:  
- Most users don’t have funds on every chain.  
- To transact on a chain where they have no gas, they must **bridge, swap, and bridge back** — an expensive, time-consuming process.  

Existing solutions like **embedded wallets** and **ERC-4337 smart wallets** attempt to solve this via cross-chain gas sponsorship, but adoption remains **low** because users don’t want to migrate away from their trusted wallets. Migration means losing:  
- ENS names  
- POAPs & NFTs  
- On-chain history & reputation  

👉 **AMU 7702 changes this.**  
Powered by Ethereum’s **Pectra Upgrade (EIP-7702)**, AMU turns any EOA into an **omni-wallet** for gas.  
- Pay for transactions on *any* chain with funds from *any other* chain.  
- No migration. No lost history. No new wallet.  
- Just seamless, chain-agnostic transactions from the wallet you already trust.  

**Example:**  
- You want to transact on **Ethereum Mainnet**.  
- Your funds are on **Hedera**.  
- With AMU, you can pay Ethereum gas **directly using Hedera funds** — without bridging.  

---

## 🛠 How It’s Made  

We built AMU by leveraging **EIP-7702 delegation** and combining it with a **cross-chain gas accounting system**:  

### 🔑 Core Flow  
1. **Delegation Contract**  
   - The user temporarily delegates their EOA to the **Delegation Contract**.  
   - This allows AMU to act as a “wallet wrapper” without requiring migration.  

2. **Prepaid Gas Accounts**  
   - Users prepay gas on *any chain* by sending funds to **Gas Sponsor Contracts**.  
   - These contracts update the Delegation Contract’s storage, maintaining a **universal ledger of balances**.  

3. **Paymasters Across Chains**  
   - When a transaction is initiated on another chain, the **Paymaster** deducts from the user’s prepaid balance.  
   - Gas is covered seamlessly, regardless of where the user’s funds are.  

4. **User Experience**  
   - From the user’s perspective, they just use their **same EOA wallet**
