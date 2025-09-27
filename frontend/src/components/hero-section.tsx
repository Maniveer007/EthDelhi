"use client"

import Link from "next/link"
import { ArrowDown, ExternalLink } from "lucide-react"
import Typewriter from "typewriter-effect"

interface HeroSectionProps {
  onScrollToProblem: () => void
}

export function HeroSection({ onScrollToProblem }: HeroSectionProps) {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-6 md:px-12">
      <div className="intro_sec flex flex-col lg:flex-row items-center justify-between max-w-7xl w-full">
        
        {/* Right Side Logo */}
        <div className="order-1 lg:order-2 flex justify-center items-center h-80">
          <div className="relative flex items-center justify-center">
            <div className="w-72 h-72 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-200 shadow-2xl">
              <span className="text-5xl font-extrabold tracking-widest text-emerald-600">AMU</span>
            </div>

            {/* Floating Accent Circles */}
            <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-emerald-200 opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-teal-200 opacity-60 animate-pulse"></div>
          </div>
        </div>

        {/* Left Text Section */}
        <div className="order-2 lg:order-1 mt-10 lg:mt-0 text-center lg:text-left lg:max-w-xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Introducing <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">AMU Wallet</span>
          </h2>

          {/* Typewriter Animated Text */}
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-600 mb-6">
            <Typewriter
              options={{
                strings: [
                  "Make a transaction but don’t have funds in the chain?",
                  "Want to utilize stablecoins for gas?",
                  "Unlock seamless cross-chain transactions",
                ],
                autoStart: true,
                loop: true,
                deleteSpeed: 20,
                delay: 40,
              }}
            />
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 leading-relaxed mb-10">
            A wallet extension that boosts your potential: make transactions on any chain while holding gas fees in just one chain.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6">
            <button
              onClick={onScrollToProblem}
              className="relative px-6 py-3 rounded-md font-medium text-gray-700 border border-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition"
            >
              About Problem
              <ArrowDown className="ml-2 inline-block w-4 h-4 group-hover:translate-y-1 transition-transform" />
              <div className="ring one"></div>
              <div className="ring two"></div>
              <div className="ring three"></div>
            </button>

            <Link href="/app">
              <div className="relative px-6 py-3 rounded-md font-medium bg-gradient-to-r from-emerald-400 to-teal-400 text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg flex items-center justify-center transition">
                Launch App
                <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <div className="ring one"></div>
                <div className="ring two"></div>
                <div className="ring three"></div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
