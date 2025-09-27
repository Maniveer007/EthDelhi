"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ethers } from "ethers"

// Example token addresses (Sepolia)
const TOKENS = {
  USDT: "0xf0a06899c786c04166F0e7983D67E5Db29724766",
  AAVE: "0x0DD7e86373Ba91aD8F3A1aB623708F8C7B39D4e9",
  WETH: "0x23b22BFcD708cc450cD8AC5EbeA598168E949D5c",
}

// Token decimals (you might want to fetch this dynamically)
const TOKEN_DECIMALS = {
  USDT: 6,  // USDT typically uses 6 decimals
  AAVE: 18,
  WETH: 18,
}

// ERC20 transfer function signature
const ERC20_TRANSFER_SIGNATURE = "0xa9059cbb"

// ERC20 ABI for balance and decimals
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
]

interface TransactionData {
  to: string
  data: string
  value: bigint
}

interface TokenBalance {
  balance: string
  symbol: string
  decimals: number
}

export default function ERC20Transfer() {
  const [recipient, setRecipient] = useState("")
  const [tokenChoice, setTokenChoice] = useState<"USDT" | "AAVE" | "WETH" | "CUSTOM">("USDT")
  const [customToken, setCustomToken] = useState("")
  const [amount, setAmount] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [transactionData, setTransactionData] = useState<TransactionData | undefined>()
  const [userAddress, setUserAddress] = useState<string>("")
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)

  // Initialize web3 provider and get user address
  useEffect(() => {
    const initializeProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum)
          setProvider(web3Provider)
          
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          if (accounts.length > 0) {
            setUserAddress(accounts[0])
          }
        } catch (error) {
          console.error("Failed to initialize provider:", error)
        }
      }
    }

    initializeProvider()
  }, [])

  // Fetch token balance when token choice or user address changes
  useEffect(() => {
    if (userAddress && provider) {
      fetchTokenBalance()
    }
  }, [tokenChoice, customToken, userAddress, provider])

  const getSelectedToken = () => {
    if (tokenChoice === "CUSTOM") return customToken
    return TOKENS[tokenChoice]
  }

  const fetchTokenBalance = async () => {
    if (!provider || !userAddress) return

    const tokenAddress = getSelectedToken()
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      setTokenBalance(null)
      return
    }

    setIsLoadingBalance(true)
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      
      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
        contract.symbol()
      ])

      const formattedBalance = ethers.formatUnits(balance, decimals)
      
      setTokenBalance({
        balance: parseFloat(formattedBalance).toFixed(6),
        symbol: symbol,
        decimals: Number(decimals)
      })
    } catch (error) {
      console.error("Failed to fetch token balance:", error)
      setTokenBalance(null)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const prepareTransactionData = (): TransactionData => {
    const tokenAddress = getSelectedToken()
    
    // Use fetched decimals or fallback to default
    const decimals = tokenBalance?.decimals || TOKEN_DECIMALS[tokenChoice] || 18
    const amountWei = ethers.parseUnits(amount, decimals)
    
    // Encode ERC20 transfer function call
    // transfer(address to, uint256 amount)
    const transferData = ethers.concat([
      ERC20_TRANSFER_SIGNATURE,
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [recipient, amountWei]
      )
    ])

    return {
      to: tokenAddress,
      data: transferData,
      value: BigInt(0) // ERC20 transfers don't send ETH
    }
  }

  const handleSendERC20 = () => {
    try {
      const txData = prepareTransactionData()
      setTransactionData(txData)
      setModalOpen(true)
      
      console.log("Prepared ERC20 transfer transaction:", {
        tokenAddress: txData.to,
        recipient,
        amount,
        data: txData.data
      })
    } catch (error) {
      console.error("Failed to prepare transaction:", error)
      alert("Failed to prepare transaction. Please check your inputs.")
    }
  }

  const handleMaxAmount = () => {
    if (tokenBalance) {
      setAmount(tokenBalance.balance)
    }
  }

  const isFormValid = () => {
    return recipient && 
           getSelectedToken() && 
           amount && 
           parseFloat(amount) > 0 &&
           ethers.isAddress(recipient) &&
           ethers.isAddress(getSelectedToken())
  }

  const hasInsufficientBalance = () => {
    if (!tokenBalance || !amount) return false
    return parseFloat(amount) > parseFloat(tokenBalance.balance)
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!userAddress && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Please connect your wallet to see token balances
          </p>
        </div>
      )}

      {/* Recipient */}
      <div>
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className={!recipient ? "" : ethers.isAddress(recipient) ? "border-green-500" : "border-red-500"}
        />
        {recipient && !ethers.isAddress(recipient) && (
          <p className="text-sm text-red-500 mt-1">Invalid address format</p>
        )}
      </div>

      {/* Token Choice */}
      <div>
        <Label className="block mb-2">Choose Token</Label>
        <div className="grid grid-cols-4 gap-3">
          {(["USDT", "AAVE", "WETH"] as const).map((token) => (
            <Card
              key={token}
              onClick={() => setTokenChoice(token)}
              className={`cursor-pointer p-4 text-center border transition-all ${
                tokenChoice === token ? "border-emerald-500 shadow-md bg-emerald-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                {token === "USDT" && <span className="text-green-500 font-bold">$</span>}
                {token === "AAVE" && <span className="text-purple-500 font-bold">A</span>}
                {token === "WETH" && <span className="text-blue-500 font-bold">Ξ</span>}
              </div>
              <div className="text-sm font-medium">{token}</div>
            </Card>
          ))}

          {/* Custom token button */}
          <Card
            onClick={() => setTokenChoice("CUSTOM")}
            className={`cursor-pointer p-4 text-center border transition-all ${
              tokenChoice === "CUSTOM" ? "border-emerald-500 shadow-md bg-emerald-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 font-bold">+</span>
            </div>
            <div className="text-sm font-medium">Custom</div>
          </Card>
        </div>
      </div>

      {/* Custom token input */}
      {tokenChoice === "CUSTOM" && (
        <div>
          <Label htmlFor="customToken">Custom Token Address</Label>
          <Input
            id="customToken"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            placeholder="0x..."
            className={!customToken ? "" : ethers.isAddress(customToken) ? "border-green-500" : "border-red-500"}
          />
          {customToken && !ethers.isAddress(customToken) && (
            <p className="text-sm text-red-500 mt-1">Invalid token address format</p>
          )}
        </div>
      )}

      {/* Balance Display */}
      {userAddress && getSelectedToken() && ethers.isAddress(getSelectedToken()) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Your Balance:</span>
            {isLoadingBalance ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : tokenBalance ? (
              <div className="text-right">
                <span className="font-medium text-gray-900">
                  {tokenBalance.balance} {tokenBalance.symbol}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-6 text-xs"
                  onClick={handleMaxAmount}
                >
                  Max
                </Button>
              </div>
            ) : (
              <span className="text-sm text-red-500">Unable to load</span>
            )}
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.000000000000000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="100"
          className={
            !amount ? "" : 
            parseFloat(amount) <= 0 ? "border-red-500" :
            hasInsufficientBalance() ? "border-red-500" :
            "border-green-500"
          }
        />
        {amount && parseFloat(amount) <= 0 && (
          <p className="text-sm text-red-500 mt-1">Amount must be greater than 0</p>
        )}
        {hasInsufficientBalance() && (
          <p className="text-sm text-red-500 mt-1">Insufficient balance</p>
        )}
      </div>

      {/* Submit */}
      <Button
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all"
        disabled={!isFormValid() || hasInsufficientBalance()}
        onClick={handleSendERC20}
      >
        Send ERC20 Token
      </Button>

    </div>
  )
}