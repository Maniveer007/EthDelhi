"use client"

import React, { useState, ChangeEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BrowserProvider, Contract, parseUnits, JsonRpcProvider, Wallet } from "ethers"
import { toast } from "react-toastify"

import { 
  HEDERA_AMU_RELAYER, 
  ARBITRUM_SEPOLIA_AMU_RELAYER, 
  delegationStorage,
  HEDRA_PYTH_ID,
  PYUSD_PYTH_ID
} from "@/lib/config"

// --- Types ---
type SupportedChain = "Hedera" | "Arbitrum Sepolia"
type SupportedToken = "PyUSD" | "USDC"

// --- Logos ---
const CHAIN_LOGO: Record<SupportedChain, string> = {
  Hedera: "/hedera.svg",
  "Arbitrum Sepolia": "/arbitrum.png",
}

const TOKEN_LOGOS: Record<SupportedToken, string> = {
  PyUSD: "/pyusd.avif",
  USDC: "/usdc.png", 
}

// --- Token addresses ---
const TOKEN_ADDRESSES: Record<SupportedChain, { PyUSD?: string; USDC?: string }> = {
  Hedera: { USDC: "0xDBA245d44e5Fe6C5e7DA60E46A0b87DDc16EC533" }, // <-- Hedera USDC ERC20
  "Arbitrum Sepolia": { PyUSD: "0x3cd06E24a92FbF89085f84BF9f867c253B2fbC94" },
}

// --- Relayers ---
const RELAYER_MAP: Record<SupportedChain, string> = {
  Hedera: HEDERA_AMU_RELAYER,
  "Arbitrum Sepolia": ARBITRUM_SEPOLIA_AMU_RELAYER,
}

// --- Chain Params ---
const CHAIN_PARAMS: Record<SupportedChain | "Sepolia", { chainId: string; chainName: string }> = {
  Hedera: { chainId: "0x128", chainName: "Hedera Testnet" },
  "Arbitrum Sepolia": { chainId: "0x66eee", chainName: "Arbitrum Sepolia" },
  Sepolia: { chainId: "0xaa36a7", chainName: "Ethereum Sepolia" },
}

// --- ABIs ---
const RELAYER_ABI = [
  "function depositToken(address token,uint256 amount,string destinationChain,string destinationAddress,bytes[] priceUpdate) external payable",
]

const ERC20_ABI = [
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
]

// ✅ DelegationStorage ABI for the sponsored call
const DELEGATION_STORAGE_ABI = [
  "function mockIncrease(address user, uint256 amount) external"
]

const AddFundsModal: React.FC<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onFundsAdded: () => void
}> = ({ open, onOpenChange, onFundsAdded }) => {
  const [chain, setChain] = useState<SupportedChain>("Hedera")
  const [token, setToken] = useState<SupportedToken>("USDC")
  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // --- Switch chain helper ---
  const switchNetwork = async (target: keyof typeof CHAIN_PARAMS) => {
    if (!window.ethereum) throw new Error("No wallet found")
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_PARAMS[target].chainId }],
    })
    toast.success(`Switched to ${CHAIN_PARAMS[target].chainName}`)
  }

  // --- Fetch Pyth VAA ---
  const fetchPriceUpdate = async (selectedChain: SupportedChain): Promise<string[]> => {
    const priceId = selectedChain === "Arbitrum Sepolia" ? PYUSD_PYTH_ID : HEDRA_PYTH_ID
    const url = `https://hermes.pyth.network/api/latest_vaas?ids[]=${priceId}`
    const res = await fetch(url)
    const data = await res.json()
    const base64Vaa = data[0]?.vaa || data.toString()
    const vaaHex = "0x" + Buffer.from(base64Vaa, "base64").toString("hex")
    return [vaaHex]
  }

  // --- 🔒 Sponsored wallet helper (Sepolia) ---
  const callSponsoredMockIncrease = async (user: string, amount6: bigint) => {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
      const pk = process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY

      if (!rpcUrl || !pk) {
        console.warn("Sponsored wallet env not set, skipping mockIncrease")
        toast.info("Skipping sponsored top-up (env not set)")
        return
      }

      const provider = new JsonRpcProvider(rpcUrl)
      const wallet = new Wallet(pk, provider)
      const storage = new Contract(delegationStorage, DELEGATION_STORAGE_ABI, wallet)
      console.log(user, amount6);
      
      const tx = await storage.mockIncrease(user, amount6)
      await tx.wait()
    } catch (e) {
      console.error("Sponsored mockIncrease failed:", e)
    }
  }

  // --- Main deposit flow ---
  const handleAddFunds = async () => {
    try {
      if (!amount) {
        toast.warning("Please enter an amount")
        return
      }
      if (!window.ethereum) throw new Error("No wallet found")

      setLoading(true)
      toast.info(`Switching to ${chain}...`)
      await switchNetwork(chain)

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const relayer = new Contract(RELAYER_MAP[chain], RELAYER_ABI, signer)
      const destinationChain = "ethereum-sepolia"
      const destinationAddress = delegationStorage

      toast.info("Fetching Pyth price update...")
      const priceUpdate = await fetchPriceUpdate(chain)

      // ✅ Arbitrum PyUSD
      if (chain === "Arbitrum Sepolia" && token === "PyUSD") {
        const erc20 = new Contract(TOKEN_ADDRESSES[chain].PyUSD!, ERC20_ABI, signer)
        const user = await signer.getAddress()
        const parsedAmount = parseUnits(amount, 6)
        const allowance = await erc20.allowance(user, RELAYER_MAP[chain])

        if (allowance < parsedAmount) {
          toast.info("Approving PyUSD...")
          const approveTx = await erc20.approve(RELAYER_MAP[chain], parsedAmount)
          await approveTx.wait()
          toast.success("PyUSD approved ✅")
        }

        toast.info("Depositing PyUSD...")
        const tx = await relayer.depositToken(
          TOKEN_ADDRESSES[chain].PyUSD!,
          parsedAmount,
          destinationChain,
          destinationAddress,
          priceUpdate,
          { value: parseUnits("0.001", 18) }
        )
        await tx.wait()
        toast.success("Deposit successful ✅")

        // 🔁 Under the hood: sponsored wallet credits on Sepolia
        // amount is already in 6 decimals USD (PyUSD), so pass parsedAmount
        await callSponsoredMockIncrease(user, parsedAmount)
      }

      // ✅ Hedera USDC
      if (chain === "Hedera" && token === "USDC") {
        const erc20 = new Contract(TOKEN_ADDRESSES[chain].USDC!, ERC20_ABI, signer)
        const user = await signer.getAddress()
        const parsedAmount = parseUnits(amount, 6) // USDC is 6 decimals
        const allowance = await erc20.allowance(user, RELAYER_MAP[chain])

        if (allowance < parsedAmount) {
          toast.info("Approving USDC...")
          const approveTx = await erc20.approve(RELAYER_MAP[chain], parsedAmount)
          await approveTx.wait()
          toast.success("USDC approved ✅")
        }

        console.log(          TOKEN_ADDRESSES[chain].USDC!,
          parsedAmount,
          destinationChain,
          destinationAddress,
          priceUpdate,
          { value: parseUnits("0.4", 18) });
        

        toast.info("Depositing USDC...")
        const tx = await relayer.depositToken(
          TOKEN_ADDRESSES[chain].USDC!,
          parsedAmount,
          destinationChain,
          destinationAddress,
          priceUpdate,
          { value: parseUnits("0.4", 18) } // gas sponsor
        )
        await tx.wait()
        toast.success("Deposit successful ✅")
      }

      // Always switch back to Sepolia
      toast.info("Switching back to Sepolia...")
      await switchNetwork("Sepolia")

      onFundsAdded()
      onOpenChange(false)
    } catch (err: any) {
      console.error("Deposit failed:", err)
      toast.error("Transaction failed ❌")
    } finally {
      setLoading(false)
    }
  }

  // --- Input handler ---
  const onAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (/^\d*$/.test(e.target.value)) setAmount(e.target.value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Add Funds</DialogTitle>
        </DialogHeader>

        {/* Chain Selection */}
        <div>
          <p className="font-semibold mb-2">Select Chain</p>
          <div className="flex gap-4">
            {(["Hedera", "Arbitrum Sepolia"] as SupportedChain[]).map((c) => (
              <button
                key={c}
                onClick={() => {
                  setChain(c)
                  setToken(c === "Hedera" ? "USDC" : "PyUSD")
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                  chain === c ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
                }`}
              >
                <img src={CHAIN_LOGO[c]} alt={c} className="h-6 w-6" />
                <span>{c}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Token */}
        <div>
          <p className="font-semibold mt-4 mb-2">Token</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500 bg-green-50">
              <img src={TOKEN_LOGOS[token]} alt={token} className="h-6 w-6" />
              {token}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="mt-4">
          <p className="font-semibold mb-2">Enter Amount</p>
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2"
            value={amount}
            onChange={onAmountChange}
            placeholder="e.g., 100"
            min="1"
          />
        </div>

        {/* Action */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleAddFunds}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
          >
            {loading ? "Processing..." : "Add Funds"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddFundsModal
