"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
// import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

type TransactionType = "erc20" | "normal" | null

export default function Page() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState("")
  const [chainId, setChainId] = useState(0)
  const [status, setStatus] = useState("")
  const [transactionType, setTransactionType] = useState<TransactionType>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setAccount("0x1234...ABCD")
      setChainId(11155111) // fake Sepolia chainId
      setIsConnected(true)
      setStatus("Successfully connected (mock) to Sepolia!")
      setIsConnecting(false)
    }, 800)
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAccount("")
    setChainId(0)
    setStatus("Wallet disconnected (mock)")
  }

  const formatAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 11155111:
        return "Ethereum Sepolia (mock)"
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
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg shadow-lg"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-emerald-800 font-medium bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>{formatAddress(account)}</span>
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  {getNetworkName(chainId)}
                </div>
              </div>
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
              Demo Wallet 
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mt-4">
              This template mimics connection, switching and transaction flows —
              without any blockchain calls.
            </p>
          </div>

          {/* Main Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold text-center">
                Select Transaction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {!isConnected ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    Please connect your wallet to continue
                  </div>
                  <Button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg"
                  >
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
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
                        <div className="font-semibold text-gray-800 mb-2">
                          ERC20 Transfer
                        </div>
                        <div className="text-sm text-gray-600">
                          Transfer tokens 
                        </div>
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
                        <div className="font-semibold text-gray-800 mb-2">
                          ETH Transfer
                        </div>
                        <div className="text-sm text-gray-600">
                          Send native ETH 
                        </div>
                      </Card>
                    </div>
                  </div>

                </>
              )}
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  )
}
