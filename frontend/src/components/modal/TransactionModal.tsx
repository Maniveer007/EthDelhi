"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, Loader2, RefreshCw } from "lucide-react"
import { ethers } from "ethers"


// Types
interface TransactionData {
  to: string
  data: string
  value: bigint
}

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactionData?: TransactionData
}

const steps = [
  { id: 1, title: "Authorize Delegation", buttonText: "Authorize" },
  { id: 2, title: "Sign Signature", buttonText: "Sign Signature" },
  { id: 3, title: "Review Fees", buttonText: "Pay Fees" },
  { id: 4, title: "Submit Transaction", buttonText: "Submit" },
]

export default function TransactionModal({
  open,
  onOpenChange,
  transactionData,
}: TransactionModalProps) {
  // State
  const [step, setStep] = useState(1)
  const [isCompleted, setIsCompleted] = useState(false)
  const [provider, setProvider] = useState<ethers.BrowserProvider>()
  const [signer, setSigner] = useState<ethers.Signer>()
  const [address, setAddress] = useState<string>("")
  const [chainId, setChainId] = useState<number>()
  const [signature, setSignature] = useState<string>("")
  const [sponsorWallet, setSponsorWallet] = useState<ethers.Wallet>()
  const [userGasAmount, setUserGasAmount] = useState<bigint>(BigInt(0))
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [currentNonce, setCurrentNonce] = useState<number>(0)

  const [estimatedFee, setEstimatedFee] = useState<{
    gasPrice: string
    gasLimit: string
    feeWei: string
    feeEth: string
    feeUsd: string
  } | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)

  // ===== helpers =====
  const getUserUsd = () => Number(ethers.formatUnits(userGasAmount, 6))
  const getRequiredUsd = () => (estimatedFee ? Number(estimatedFee.feeUsd) : 0)
  const isFundsInsufficient = () => getUserUsd() < getRequiredUsd()

  // Initialize wallet
  const initializeWallet = async () => {
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      const walletSigner = await browserProvider.getSigner()
      const userAddress = await walletSigner.getAddress()
      const network = await browserProvider.getNetwork()

      setChainId(Number(network.chainId))
      setAddress(userAddress)
      setProvider(browserProvider)
      setSigner(walletSigner)

      const nonce = await browserProvider.getTransactionCount(userAddress)
      setCurrentNonce(nonce)

      await checkDelegationStatus(browserProvider, userAddress)
      await fetchUserGasAmount(browserProvider, userAddress)
    } catch (error) {
      console.error("Failed to initialize wallet:", error)
    }
  }

  const fetchUserGasAmount = async (
    provider: ethers.BrowserProvider,
    userAddress: string
  ) => {
  
  }

  const checkDelegationStatus = async (
    provider: ethers.BrowserProvider,
    address: string
  ) => {
    try {
      const code = await provider.getCode(address)
      if (code === "0x") return
      if (code.startsWith("0xef0100")) {
        const delegatedAddress = "0x" + code.slice(8, 48)
        
      }
    } catch (error) {
      console.error("Failed to check delegation status:", error)
    }
  }

  useEffect(() => {
    if (provider && process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY) {
      const wallet = new ethers.Wallet(
        process.env.NEXT_PUBLIC_SPONSOR_PRIVATE_KEY,
        provider
      )
      setSponsorWallet(wallet)
    }
  }, [provider])

  useEffect(() => {
    if (open) {
      initializeWallet()
      setStep(1)
      setIsCompleted(false)
      setSignature("")
      setEstimatedFee(null)
      setIsProcessing(false)
    }
  }, [open])

  // Step 1
  const handleSetupDelegation = async () => {
    if (!signer || !provider || !address) return
    setIsProcessing(true)

  }

  // Step 2
  const handleSignDelegation = async () => {
    if (!transactionData || !signer || !address || !chainId) return
    setIsProcessing(true)
    try {
      const delegationSignature = await signMessage(
        transactionData.to,
        transactionData.data,
        transactionData.value,
        currentNonce
      )
      setSignature(delegationSignature)
      setStep(3)
    } catch (error) {
      console.error("Sign signature failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Fee Estimation
  const estimateTransactionFee = async () => {
   
  }

  // Step 3
  const handleCheckFees = async () => {

  }

  // Step 4
  const handleSignTransaction = async () => {

  }

  const signMessage = async (
    to: string,
    data: string,
    value: bigint,
    nonce: number
  ): Promise<string> => {

  }

  const handleCloseModal = () => {
    onOpenChange(false)
    setStep(1)
    setIsCompleted(false)
    setSignature("")
    setEstimatedFee(null)
    setIsProcessing(false)
  }

  const handleStepAction = () => {
    switch (step) {
      case 1: handleSetupDelegation(); break
      case 2: handleSignDelegation(); break
      case 3: handleCheckFees(); break
      case 4: handleSignTransaction(); break
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Process</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex justify-between items-center mb-6">
            {steps.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center w-1/4">
                {i + 1 < step || isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : i + 1 === step ? (
                  isProcessing ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500" />
                  )
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-400" />
                )}
                <p className="text-xs mt-1 text-center">{s.title}</p>
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="h-40 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={isCompleted ? "success" : step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center w-full"
              >
                {isCompleted ? (
                  <div className="flex flex-col items-center space-y-3">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="text-lg font-medium text-green-600">
                      Transaction Completed Successfully!
                    </h3>
                  </div>
                ) : step === 3 ? (
                  <div className="flex flex-col items-center space-y-3">
                    <p className="text-lg font-medium">Fee Review</p>
                    <div className="bg-gray-50 p-4 rounded-md w-full max-w-xs">
                      <p className="text-sm text-gray-700">
                        <strong>Available Balance:</strong> {ethers.formatUnits(userGasAmount, 6)} USD
                      </p>
                      {estimatedFee && (
                        <>
                          <p className="text-xl font-semibold text-emerald-600 mt-2">
                            Required: {estimatedFee.feeEth} ETH (~${estimatedFee.feeUsd})
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ℹ️ Gas Price: {ethers.formatUnits(BigInt(estimatedFee.gasPrice), "gwei")} gwei | Gas Limit: {estimatedFee.gasLimit}
                          </p>
                        </>
                      )}
                      {isFundsInsufficient() && (
                        <p className="text-red-600 text-sm mt-2">
                          Insufficient funds. Please add gas fees.
                        </p>
                      )}
                    </div>
                  </div>
                ) : step === 4 && isProcessing ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                    <p className="text-gray-700 font-medium">
                      Processing transaction… please wait
                    </p>
                  </div>
                ) : (
                  <div className="text-lg font-medium">{steps[step - 1]?.title}</div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            {step === 3 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAddFundsOpen(true)}
              >
                Add Gas Fees
              </Button>
            )}
            {isCompleted ? (
              <Button
                onClick={handleCloseModal}
                className="bg-green-600 hover:bg-green-700"
              >
                Close
              </Button>
            ) : (
              <Button
                onClick={handleStepAction}
                disabled={isProcessing || (!transactionData && step > 1)}
              >
                {steps[step - 1].buttonText}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Funds Modal */}
      <AddFundsModal
        open={addFundsOpen}
        onOpenChange={setAddFundsOpen}
        onFundsAdded={async () => {
          if (provider && address) {
            await fetchUserGasAmount(provider, address)
          }
        }}
      />
    </>
  )
}
