"use client"

import { Github, Twitter, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function VerticalNavbar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-16 bg-primary/95 backdrop-blur-sm border-r border-border z-50 flex flex-col items-center py-8">
      {/* Logo/Brand */}
      <div className="mb-8">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <span className="text-accent-foreground font-bold text-sm">A</span>
        </div>
      </div>

      {/* Social Links */}
      <div className="flex flex-col gap-4 mt-auto mb-8">
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-primary-foreground hover:text-accent hover:bg-primary-foreground/10 transition-colors"
          // asChild
        >
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <Twitter className="w-5 h-5" />
            <span className="sr-only">Twitter</span>
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-primary-foreground hover:text-accent hover:bg-primary-foreground/10 transition-colors"
          // asChild
        >
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <Github className="w-5 h-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-primary-foreground hover:text-accent hover:bg-primary-foreground/10 transition-colors"
          // asChild
        >
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-5 h-5" />
            <span className="sr-only">Discord</span>
          </a>
        </Button>
      </div>
    </nav>
  )
}
