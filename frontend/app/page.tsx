"use client"

import { useRef } from "react"
import { VerticalNavbar } from "@/components/vertical-navbar"
import { HeroSection } from "@/components/hero-section"
import { ProblemSolutionSection } from "@/components/problem-solution-section"

export default function HomePage() {
  const problemSectionRef = useRef<HTMLElement>(null)

  const scrollToProblem = () => {
    problemSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <main className="relative">
      <VerticalNavbar />

      <HeroSection onScrollToProblem={scrollToProblem} />

      <ProblemSolutionSection ref={problemSectionRef} />
    </main>
  )
}
