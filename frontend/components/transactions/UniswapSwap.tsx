"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import TransactionModal from "@/components/modal/TransactionModal"
import { ethers } from "ethers"

// Uniswap V3 SwapRouter address
const UNISWAP_V3_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"

// ExactInputSingle function signature
const EXACT_INPUT_SINGLE_SIGNATURE = "0x414bf389"

// Predefined tokens (example)
const PREDEFINED_TOKENS = [
  { symbol: "USDC", address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8" },
  { symbol: "USDT", address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0" },
  { symbol: "WETH", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" }
]

interface TransactionData {
  to: string
  data: string
  value: bigint
}

export default function UniswapSwap() {
  const [tokenIn, setTokenIn] = useState(PREDEFINED_TOKENS[0].address)
  const [tokenOut, setTokenOut] = useState(PREDEFINED_TOKENS[1].address)
  const [amount, setAmount] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [transactionData, setTransactionData] = useState<TransactionData | undefined>()
  const [userAddress, setUserAddress] = useState("")

  // Detect user's wallet
  useEffect(() => {
    const getAddress = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        setUserAddress(await signer.getAddress())
      }
    }
    getAddress()
  }, [])

 // In prepareTransactionData
const prepareTransactionData = (): TransactionData => {
    // Note: Uniswap V3 on Mainnet uses 6 or 18 decimals. 
    // Ensure you use the correct decimals for tokenIn, but 18 is common for WETH/ERC-20s.
    // For this example, we'll keep 18 as per your original code.
    const amountWei = ethers.parseUnits(amount, 18) 

    // The single tuple object for exactInputSingle
    const swapParams = {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        fee: 3000,
        recipient: userAddress,
        deadline: Math.floor(Date.now() / 1000) + 120, // 2 minutes
        amountIn: amountWei,
        amountOutMinimum: BigInt(0), // Changed to BigInt(0) for consistency
        sqrtPriceLimitX96: BigInt(0) // Changed to BigInt(0) for consistency
    }

    const swapData = ethers.concat([
        EXACT_INPUT_SINGLE_SIGNATURE,
        ethers.AbiCoder.defaultAbiCoder().encode(
            [
                "tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)"
            ],
            [
                // Pass the tuple's *values* as a single element in the outer array
                [ 
                    swapParams.tokenIn,
                    swapParams.tokenOut,
                    swapParams.fee,
                    swapParams.recipient,
                    swapParams.deadline,
                    swapParams.amountIn,
                    swapParams.amountOutMinimum,
                    swapParams.sqrtPriceLimitX96
                ]
            ]
        )
    ])

    return {
        to: UNISWAP_V3_ROUTER,
        data: swapData,
        value: BigInt(0)
    }
}

  const handleSwap = () => {
    if (!userAddress) {
      alert("Connect your wallet first!")
      return
    }
    try {
      const txData = prepareTransactionData()
      setTransactionData(txData)
      setModalOpen(true)
    } catch (error) {
      console.error("Failed to prepare transaction:", error)
      alert("Failed to prepare transaction. Please check your inputs.")
    }
  }

  const isFormValid = () => {
    return tokenIn &&
           tokenOut &&
           amount &&
           parseFloat(amount) > 0 &&
           ethers.isAddress(tokenIn) &&
           ethers.isAddress(tokenOut) &&
           tokenIn !== tokenOut &&
           userAddress
  }

  return (
    <div className="space-y-6">
      {/* Token selection */}
      <div>
        <Label>Token In</Label>
        <div className="flex gap-2 flex-wrap">
          {PREDEFINED_TOKENS.map((t) => (
            <Button
              key={t.address}
              variant={tokenIn === t.address ? "default" : "outline"}
              onClick={() => setTokenIn(t.address)}
            >
              {t.symbol}
            </Button>
          ))}
          <Input
            placeholder="Custom token address"
            value={ethers.isAddress(tokenIn) ? "" : tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label>Token Out</Label>
        <div className="flex gap-2 flex-wrap">
          {PREDEFINED_TOKENS.map((t) => (
            <Button
              key={t.address}
              variant={tokenOut === t.address ? "default" : "outline"}
              onClick={() => setTokenOut(t.address)}
            >
              {t.symbol}
            </Button>
          ))}
          <Input
            placeholder="Custom token address"
            value={ethers.isAddress(tokenOut) ? "" : tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Amount */}
      <div>
        <Label>Amount</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
        />
      </div>

      <Button
        className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white"
        disabled={!isFormValid()}
        onClick={handleSwap}
      >
        Swap on Uniswap
      </Button>

      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transactionData={transactionData}
      />
    </div>
  )
}
