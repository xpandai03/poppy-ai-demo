"use client"

import { useEffect, useRef, useState } from "react"

import { ChatShell } from "@/components/chat/chat-shell"
import { LibraryPane } from "@/components/library-pane"
import { cn } from "@/lib/utils"
import { useLibrary } from "@/lib/store"

export default function Home() {
  const phase = useLibrary((s) => s.phase)
  const setPhase = useLibrary((s) => s.setPhase)
  const chatPaneRef = useRef<HTMLElement>(null)

  // Library pane fades in on mount; the carousel waits for the width
  // transition to finish so its ResizeObserver measures a settled pane.
  const [libraryVisible, setLibraryVisible] = useState(false)
  const [carouselReady, setCarouselReady] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  // Reduced motion: no width transition, straight to the workspace.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!mq.matches) return
    setReduceMotion(true)
    setPhase("workspace")
    setLibraryVisible(true)
    setCarouselReady(true)
  }, [setPhase])

  useEffect(() => {
    if (phase !== "workspace" || reduceMotion) return

    const fade = setTimeout(() => setLibraryVisible(true), 200)

    // Primary gate: the chat pane finishing its width/height transition.
    const el = chatPaneRef.current
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el) return
      if (e.propertyName !== "width" && e.propertyName !== "height") return
      setCarouselReady(true)
    }
    el?.addEventListener("transitionend", onEnd)

    // Failsafe only — if the transition never reports (interrupted, or
    // animations disabled), the carousel must still arrive.
    const failsafe = setTimeout(() => setCarouselReady(true), 1200)

    return () => {
      clearTimeout(fade)
      clearTimeout(failsafe)
      el?.removeEventListener("transitionend", onEnd)
    }
  }, [phase, reduceMotion])

  const intro = phase === "intro"

  return (
    <main className="flex h-dvh w-screen flex-col overflow-hidden bg-stone-50 md:flex-row">
      <section
        ref={chatPaneRef}
        id="chat-pane"
        className={cn(
          "relative isolate shrink-0 overflow-hidden bg-stone-50",
          !reduceMotion && "transition-[width,height] duration-[600ms] ease-out",
          intro ? "h-full w-full" : "h-1/2 w-full md:h-full md:w-1/2",
        )}
      >
        <ChatShell />
      </section>

      {!intro && (
        <section
          id="library-pane"
          className={cn(
            "relative isolate h-1/2 overflow-hidden border-stone-200 bg-stone-50 md:h-full md:flex-1",
            "border-t md:border-t-0 md:border-l",
            "transition-opacity duration-[400ms] ease-out",
            libraryVisible ? "opacity-100" : "opacity-0",
          )}
        >
          {carouselReady && <LibraryPane />}
        </section>
      )}
    </main>
  )
}
