"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import TransactionModal from "@/components/modal/TransactionModal"
import { ethers } from "ethers"

interface TransactionData {
  to: string
  data: string
  value: bigint
}

export default function NormalTransfer() {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [transactionData, setTransactionData] = useState<TransactionData | undefined>()

  const prepareTransactionData = (): TransactionData => {
    // Convert ETH amount to wei
    const amountWei = ethers.parseEther(amount)
    
    return {
      to: recipient,
      data: "0x", // Empty data for simple ETH transfer
      value: amountWei
    }
  }

  const handleSendETH = () => {
    try {
      const txData = prepareTransactionData()
      setTransactionData(txData)
      setModalOpen(true)
      
      console.log("Prepared ETH transfer transaction:", {
        recipient,
        amount: amount + " ETH",
        value: txData.value.toString(),
        data: txData.data
      })
    } catch (error) {
      console.error("Failed to prepare transaction:", error)
      alert("Failed to prepare transaction. Please check your inputs.")
    }
  }

  const isFormValid = () => {
    return recipient && 
           amount && 
           parseFloat(amount) > 0 &&
           ethers.isAddress(recipient)
  }

  return (
    <div className="space-y-6">
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

      {/* Amount */}
      <div>
        <Label htmlFor="amount">Amount (ETH)</Label>
        <Input
          id="amount"
          type="number"
          step="0.000000000000000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.1"
          className={!amount ? "" : parseFloat(amount) > 0 ? "border-green-500" : "border-red-500"}
        />
        {amount && parseFloat(amount) <= 0 && (
          <p className="text-sm text-red-500 mt-1">Amount must be greater than 0</p>
        )}
      </div>

      {/* Submit */}
      <Button
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all"
        disabled={!isFormValid()}
        onClick={handleSendETH}
      >
        Send ETH
      </Button>

      {/* Transaction modal */}
      <TransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        transactionData={transactionData}
      />
    </div>
  )
}