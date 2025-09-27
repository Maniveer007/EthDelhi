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
import { 
  DELEGATION_CONTRACT_ABI, 
  delegationAddress, 
  sponsorAddress, 
  PYTH_ETH_PRICE_FEED_ID, 
  delegationStorage
} from "@/lib/config"
import AddFundsModal from "@/components/modal/AddFunds"

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
    try {
      const contract = new ethers.Contract(
        delegationAddress,
        [
          {
            inputs: [{ internalType: "address", name: "", type: "address" }],
            name: "userGasAmountInUSD",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        provider
      )
      const amount: bigint = await contract.userGasAmountInUSD(userAddress)
      setUserGasAmount(amount)
    } catch (error) {
      console.error("Failed to fetch gas amount:", error)
    }
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
        if (delegationAddress.toLowerCase() === delegatedAddress.toLowerCase()) {
          setStep(2)
        }
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
    try {
      const authorization = await signer.authorize({
        address: delegationAddress,
        nonce: currentNonce,
      })
      const feeData = await provider.getFeeData()
      const txRequest = {
        type: 4,
        chainId,
        nonce: currentNonce,
        to: null,
        value: 0,
        data: "0x",
        gasLimit: 300000,
        maxFeePerGas: feeData?.maxFeePerGas || ethers.parseUnits("20", "gwei"),
        maxPriorityFeePerGas:
          feeData?.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei"),
        authorizationList: [authorization],
      }
      const txResponse = await signer.sendTransaction(txRequest)
      const receipt = await txResponse.wait()
      if (receipt && receipt.status === 1) {
        setStep(2)
        setCurrentNonce(currentNonce + 1)
      }
    } catch (error) {
      console.error("Setup delegation failed:", error)
    } finally {
      setIsProcessing(false)
    }
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
    if (!provider) return null
    try {
      const gasPrice = 20_000_000 // 20 gwei
      const gasLimit = 3000000
      const feeWei = gasPrice * gasLimit
      const feeEth = ethers.formatEther(BigInt(feeWei))

      let ethUsd: number
      try {
        const response = await fetch(
          `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${PYTH_ETH_PRICE_FEED_ID}`
        )
        const data = await response.json()
        const price = data?.[0]?.price?.price ?? 360000000000
        const expo = data?.[0]?.price?.expo ?? -8
        ethUsd = Number(price) * Math.pow(10, expo)
      } catch {
        ethUsd = 3600
      }

      const feeUsd = (parseFloat(feeEth) * ethUsd).toFixed(2)

      return {
        gasPrice: gasPrice.toString(),
        gasLimit: gasLimit.toString(),
        feeWei: feeWei.toString(),
        feeEth,
        feeUsd,
      }
    } catch (err) {
      console.error("Fee estimation failed:", err)
      return null
    }
  }

  // Step 3
  const handleCheckFees = async () => {
    if (!provider || !signer || !address) return
    setIsProcessing(true)
    try {
      if (!estimatedFee) {
        const feeInfo = await estimateTransactionFee()
        setEstimatedFee(feeInfo)

        const required = feeInfo ? Number(feeInfo.feeUsd) : 0
        const available = Number(ethers.formatUnits(userGasAmount, 6))
        if (required > 0 && available < required) {
          setAddFundsOpen(true)
          return
        }
      }
      if (isFundsInsufficient()) {
        setAddFundsOpen(true)
        return
      }

      const storageContract = new ethers.Contract(
        delegationStorage,
        [
          {
            inputs: [
              { internalType: "address", name: "user", type: "address" },
              { internalType: "uint256", name: "usdAmount", type: "uint256" },
            ],
            name: "deductGas",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        sponsorWallet
      )

      const usdAmount = BigInt(Math.round(Number(estimatedFee!.feeUsd) * 1e6))
      const tx = await storageContract.deductGas(address, usdAmount)
      await tx.wait()
      setStep(4)
    } catch (err) {
      console.error("DeductGas failed:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 4
  const handleSignTransaction = async () => {
    if (!provider || !sponsorWallet || !transactionData || !signature || !address || !chainId) return
    setIsProcessing(true)
    try {
      const eoaContract = new ethers.Contract(address, DELEGATION_CONTRACT_ABI, provider)
      const executeData = eoaContract.interface.encodeFunctionData(
        "execute((bytes,address,uint256),address,uint256,bytes)",
        [
          { data: transactionData.data, to: transactionData.to, value: transactionData.value },
          sponsorWallet.address,
          currentNonce,
          signature,
        ]
      )
      const sponsorNonce = await provider.getTransactionCount(sponsorWallet.address)
      const feeData = await provider.getFeeData()
      const sponsoredTx = {
        type: 2,
        chainId,
        nonce: sponsorNonce,
        maxFeePerGas: feeData.maxFeePerGas || ethers.parseUnits("30", "gwei"),
        gasLimit: 1_000_000,
        to: address,
        value: 0,
        data: executeData,
      }
      const tx = await sponsorWallet.sendTransaction(sponsoredTx)
      const receipt = await tx.wait()
      if (receipt?.status === 1) setIsCompleted(true)
    } catch (error) {
      console.error("Sign transaction failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const signMessage = async (
    to: string,
    data: string,
    value: bigint,
    nonce: number
  ): Promise<string> => {
    const packedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "address", "uint256", "bytes32", "address", "uint256"],
      [chainId, to, value, ethers.keccak256(data), sponsorAddress, nonce]
    )
    const digest = ethers.keccak256(packedData)
    return signer!.signMessage(ethers.getBytes(digest))
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
