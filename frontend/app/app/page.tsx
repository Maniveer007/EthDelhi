"use client"

declare global {
  interface Window {
    ethereum?: any
  }
}

import { useState, useEffect } from "react"
import { BrowserProvider } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

import ERC20Transfer from "@/components/transactions/ERC20Transfer"
import NormalTransfer from "@/components/transactions/NormalTransfer"

// 🌐 Ethereum Sepolia config
const SEPOLIA_TESTNET = {
  chainId: "0xaa36a7",
  chainName: "Ethereum Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://ethereum-sepolia.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
}

const SEPOLIA_CHAIN_ID = parseInt(SEPOLIA_TESTNET.chainId, 16)

type TransactionType = "erc20" | "normal" | null

export default function Page() {
  // Wallet state
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState("")
  const [chainId, setChainId] = useState(1)

  // App state
  const [status, setStatus] = useState("")
  const [transactionType, setTransactionType] = useState<TransactionType>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          const network = await provider.getNetwork()
          setIsConnected(true)
          setAccount(accounts[0].address)
          setChainId(Number(network.chainId))

          if (Number(network.chainId) === SEPOLIA_CHAIN_ID) {
            setStatus(`Connected to ${SEPOLIA_TESTNET.chainName}`)
          } else {
            setStatus(
              `Connected to network ${network.chainId} - Please switch to ${SEPOLIA_TESTNET.chainName}`
            )
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setStatus("Please install MetaMask or another Web3 wallet")
      return
    }

    setIsConnecting(true)
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      setAccount(address)
      setChainId(Number(network.chainId))
      setIsConnected(true)

      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia()
      } else {
        setStatus(`Successfully connected to ${SEPOLIA_TESTNET.chainName}!`)
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setStatus(`Connection failed: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_TESTNET.chainId }],
      })
      setChainId(SEPOLIA_CHAIN_ID)
      setStatus(`Successfully switched to ${SEPOLIA_TESTNET.chainName}!`)
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SEPOLIA_TESTNET],
          })
          setChainId(SEPOLIA_CHAIN_ID)
          setStatus(`${SEPOLIA_TESTNET.chainName} added and connected!`)
        } catch (addError) {
          console.error(`Error adding ${SEPOLIA_TESTNET.chainName}:`, addError)
          setStatus(`Failed to add ${SEPOLIA_TESTNET.chainName}. Please add it manually.`)
        }
      } else {
        console.error(`Error switching to ${SEPOLIA_TESTNET.chainName}:`, switchError)
        setStatus(`Failed to switch to ${SEPOLIA_TESTNET.chainName}`)
      }
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAccount("")
    setChainId(1)
    setStatus("Wallet disconnected")
  }

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case SEPOLIA_CHAIN_ID:
        return SEPOLIA_TESTNET.chainName
      default:
        return `Network ${chainId}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Top bar */}
      <div className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center">
        <Link href="/" passHref>
          <Button className="px-6 py-2 rounded-full shadow-md bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-black">
            ← Back to Main Page
          </Button>
        </Link>

        <div>
          {!isConnected ? (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-emerald-800 font-medium bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      chainId === SEPOLIA_CHAIN_ID ? "bg-green-500" : "bg-orange-500"
                    }`}
                  ></div>
                  <span>{formatAddress(account)}</span>
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {getNetworkName(chainId)}
                </div>
              </div>
              {chainId !== SEPOLIA_CHAIN_ID && (
                <Button
                  onClick={switchToSepolia}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Switch to {SEPOLIA_TESTNET.chainName}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={disconnectWallet}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Leverage your account&apos;s true potential with EIP-7702
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mt-4">
              Make your account chain-agnostic and unlock seamless cross-chain
              functionality.
            </p>
          </div>

          {/* Network Warning */}
          {isConnected && chainId !== SEPOLIA_CHAIN_ID && (
            <Alert className="mb-6 bg-orange-50 border-orange-200">
              <AlertDescription className="text-orange-800">
                ⚠️ You're connected to {getNetworkName(chainId)}. Please switch to{" "}
                {SEPOLIA_TESTNET.chainName} to use this application.
              </AlertDescription>
            </Alert>
          )}

          {/* Main Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-center">
                Action to be done by your wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">Please connect your wallet to continue</div>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg"
                  >
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                </div>
              ) : chainId !== SEPOLIA_CHAIN_ID ? (
                <div className="text-center py-12">
                  <div className="text-orange-600 mb-4">
                    Please switch to {SEPOLIA_TESTNET.chainName} to continue
                  </div>
                  <Button
                    onClick={switchToSepolia}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg"
                  >
                    Switch to {SEPOLIA_TESTNET.chainName}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Transaction Type */}
                  <div>
                    <Label className="text-lg font-semibold text-gray-800 mb-4 block">
                      Transaction Type
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ERC20 */}
                      <Card
                        className={`p-6 cursor-pointer text-center transition-all hover:shadow-lg ${
                          transactionType === "erc20"
                            ? "border-emerald-500 bg-emerald-50 shadow-lg"
                            : "border-gray-200"
                        }`}
                        onClick={() => setTransactionType("erc20")}
                      >
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-xl">
                          T
                        </div>
                        <div className="font-semibold text-gray-800 mb-2">ERC20 Transfer</div>
                        <div className="text-sm text-gray-600">Transfer tokens</div>
                      </Card>

                      {/* Normal */}
                      <Card
                        className={`p-6 cursor-pointer text-center transition-all hover:shadow-lg ${
                          transactionType === "normal"
                            ? "border-emerald-500 bg-emerald-50 shadow-lg"
                            : "border-gray-200"
                        }`}
                        onClick={() => setTransactionType("normal")}
                      >
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gradient-to-br from-gray-500 to-gray-700 text-white flex items-center justify-center font-bold text-xl">
                          Ξ
                        </div>
                        <div className="font-semibold text-gray-800 mb-2">ETH Transfer</div>
                        <div className="text-sm text-gray-600">Send native ETH</div>
                      </Card>
                    </div>
                  </div>

                  {/* Render Forms */}
                  {transactionType === "erc20" && <ERC20Transfer />}
                  {transactionType === "normal" && <NormalTransfer />}
                </>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          {status && (
            <Alert
              className={`mt-6 shadow-sm ${
                status.includes("Failed") || status.includes("Error")
                  ? "bg-red-50 border-red-200"
                  : status.includes("Sepolia")
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <AlertDescription
                className={
                  status.includes("Failed") || status.includes("Error")
                    ? "text-red-800 font-medium"
                    : status.includes("Sepolia")
                    ? "text-emerald-800 font-medium"
                    : "text-orange-800 font-medium"
                }
              >
                {status}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
