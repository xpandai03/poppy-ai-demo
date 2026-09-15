"use client"

import { useEffect, useState } from "react"
import { Copy, RefreshCw, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useLibrary } from "@/lib/store"

export function CreativeSheet({ container }: { container: HTMLElement | null }) {
  const selectedId = useLibrary((s) => s.selectedId)
  const items = useLibrary((s) => s.items)
  const setSelected = useLibrary((s) => s.setSelected)
  const removeItem = useLibrary((s) => s.removeItem)
  const duplicateItem = useLibrary((s) => s.duplicateItem)
  const updateItem = useLibrary((s) => s.updateItem)

  const creative = items.find((i) => i.id === selectedId) ?? null

  // Draft copy is local to the sheet, reset whenever a different card opens.
  const [headline, setHeadline] = useState("")
  const [primaryText, setPrimaryText] = useState("")

  useEffect(() => {
    if (!creative) return
    setHeadline(creative.headline)
    setPrimaryText(creative.primaryText)
  }, [creative?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const open = !!creative

  return (
    <Sheet
      open={open}
      modal={false}
      onOpenChange={(next) => {
        if (!next) setSelected(null)
      }}
    >
      <SheetContent
        container={container}
        side="right"
        overlayClassName="absolute z-[8990] bg-black/40"
        className="absolute z-[9000] h-full w-full overflow-y-auto border-l border-stone-200 bg-white p-0 sm:max-w-[380px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {creative ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageSrc}
              alt={creative.headline}
              className="h-56 w-full shrink-0 object-cover"
            />

            <SheetHeader className="gap-1 px-4 pt-3 pb-0">
              <SheetTitle className="text-[0.7rem] font-medium tracking-[0.18em] text-stone-400 uppercase">
                Variation {creative.variation}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Edit the copy for variation {creative.variation}.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-wrap gap-1.5 px-4">
              {[creative.hookType, creative.format, creative.ctaPlacement].map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.06em] text-stone-600 uppercase"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3 px-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-stone-500">Headline</span>
                <Textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-stone-500">Primary text</span>
                <Textarea
                  value={primaryText}
                  onChange={(e) => setPrimaryText(e.target.value)}
                  rows={5}
                  className="resize-none text-sm"
                />
              </label>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast("Regenerating image…", { description: "Mocked for the demo." })}
              >
                <RefreshCw className="size-3.5" />
                Regenerate image
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const copy = duplicateItem(creative.id)
                  if (copy) {
                    setTimeout(() => updateItem(copy.id, { flash: false }), 700)
                    toast.success(`Duplicated as variation ${copy.variation}`)
                  }
                }}
              >
                <Copy className="size-3.5" />
                Duplicate
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast("Pushed to Meta as a paused draft", {
                    description: "Mocked — nothing left this machine.",
                  })
                }
              >
                <Send className="size-3.5" />
                Push to Meta
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  const n = creative.variation
                  removeItem(creative.id)
                  toast.success(`Deleted variation ${n}`)
                }}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
