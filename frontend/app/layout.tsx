
import type React from "react"
import type { Metadata } from "next"
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
// import { BrowserRouter } from "react-router-dom";
import "./globals.css"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export const metadata: Metadata = {
  title: "AMU Wallet - Cross-Chain Made Simple",
  description:
    "A wallet extension that increases your wallet potential to make transactions on any chain by holding gas fees in only a single chain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* <BrowserRouter> */}
          <Suspense fallback={null}>{children}</Suspense>
                  <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />

        {/* </BrowserRouter> */}
        {/* <Analytics /> */}
      </body>
    </html>
  )
}