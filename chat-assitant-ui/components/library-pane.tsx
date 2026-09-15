"use client"

import { useEffect, useRef, useState } from "react"

import ArcFlowCarousel, { type ArcFlowCarouselHandle } from "@/components/ui/arc-flow-carousel"
import { useLibrary } from "@/lib/store"
import { CreativeSheet } from "@/components/creative-sheet"

/**
 * Right pane. Reads the shared store with selectors, so the chat's per-token
 * streaming updates never reach the GSAP ticker driving the carousel.
 */
export function LibraryPane() {
  const items = useLibrary((s) => s.items)
  const isGenerating = useLibrary((s) => s.isGenerating)
  const focusRequest = useLibrary((s) => s.focusRequest)
  const carouselRef = useRef<ArcFlowCarouselHandle>(null)
  const setSelected = useLibrary((s) => s.setSelected)

  // The sheet portals into the pane, not the viewport, so it slides in from the
  // library pane's own right edge.
  const [paneEl, setPaneEl] = useState<HTMLElement | null>(null)
  useEffect(() => {
    setPaneEl(document.getElementById("library-pane"))
  }, [])

  // Chat asks for a card to be brought forward; the carousel eases there on
  // its existing target/lerp path.
  useEffect(() => {
    if (!focusRequest) return
    carouselRef.current?.focusItem(focusRequest.index)
  }, [focusRequest])

  return (
    <>
      <ArcFlowCarousel
        ref={carouselRef}
        onCardClick={(item) => setSelected(item.id)}
        items={items}
        radiusRatio={0.85}
        cardRatio={0.34}
        maxCardWidth={240}
        cardAspect={0.62}
        overlap={-0.04}
        arcOffset={0.5}
        smoothing={5.5}
        dragSensitivity={1.2}
        momentum={1}
        snap={false}
        wheelControl="horizontal"
        // Hold the idle drift while the assistant is generating.
        autoRotateSpeed={isGenerating ? 0 : 0.12}
        pauseOnHover
        surfaceColor="#fafaf9"
      />

      <CreativeSheet container={paneEl} />
    </>
  )
}
