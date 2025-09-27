"use client"

import { useState, useEffect } from "react"

const messages = [
  "Make a transaction but don't have funds in the chain",
  "Want to utilize stablecoin and do transaction on any chain ",
  "Want to make your EOA omni account",
]

export function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % messages.length)
        setIsVisible(true)
      }, 500)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-24 flex items-center">
      <p
        className={`text-xl md:text-2xl text-muted-foreground max-w-2xl transition-all duration-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {messages[currentIndex]}
      </p>
    </div>
  )
}
