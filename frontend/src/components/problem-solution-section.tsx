"use client"

import { forwardRef } from "react"
import { AlertTriangle, CheckCircle } from "lucide-react"

export const ProblemSolutionSection = forwardRef<HTMLElement>((props, ref) => {
  return (
    <section ref={ref} className="min-h-screen px-6 md:px-12 py-20">
      <div className="max-w-6xl mx-auto">
        
        {/* Problem Section */}
        <div className="mb-32">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="lg:w-5/12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <AlertTriangle className="w-10 h-10 text-red-500" />
                The Problem
              </h2>
              <hr className="w-20 border-t-4 border-red-400 rounded mb-6" />
            </div>
            <div className="lg:w-7/12">
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Current multi-chain transactions are complex, expensive, and 
                require managing gas fees across multiple networks.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Users face unnecessary friction: switching networks, bridging assets, 
                and juggling multiple wallets, which makes adoption harder for 
                everyday users.
              </p>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div>
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="lg:w-5/12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                The Solution
              </h2>
              <hr className="w-20 border-t-4 border-emerald-400 rounded mb-6" />
            </div>
            <div className="lg:w-7/12">
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                AMU Wallet revolutionizes cross-chain transactions with a unified 
                gas management system and seamless multi-chain operations.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                With one wallet, you can transact across all chains without 
                switching networks or holding multiple native tokens for gas. 
                A smooth, simple UX for Web3 users everywhere.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
})

ProblemSolutionSection.displayName = "ProblemSolutionSection"
