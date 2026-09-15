"use client"

import type React from "react"

import { useState, useRef, useCallback, type KeyboardEvent, useEffect } from "react"
import { Square, Mic, MicOff, Paperclip, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLibrary } from "@/lib/store"
import Image from "next/image"
import { AnimatedOrb } from "./animated-orb"
import { AudioWaveform } from "./audio-waveform"

interface ComposerProps {
  onSend: (content: string, imageData?: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function Composer({ onSend, onStop, isStreaming, disabled }: ComposerProps) {
  const [value, setValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showImageBounce, setShowImageBounce] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef("")
  const setPhase = useLibrary((s) => s.setPhase)
  const introDoneRef = useRef(false)
  const finalTranscriptsRef = useRef("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          let newFinalText = ""

          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript
              newFinalText += transcript + " "
            }
          }

          if (newFinalText) {
            finalTranscriptsRef.current += newFinalText
            setValue(baseTextRef.current + finalTranscriptsRef.current)
            setTimeout(() => handleInput(), 0)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("[poppy] Speech recognition error:", event.error)
          setIsRecording(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    // Trigger intro animation after mount
    setHasAnimated(true)
  }, [])

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
        setMediaStream(null)
      }
    } else {
      baseTextRef.current = value
      finalTranscriptsRef.current = ""
      recognitionRef.current.start()
      setIsRecording(true)

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setMediaStream(stream)
        })
        .catch((err) => {
          console.error("[poppy] Error getting microphone stream:", err)
        })
    }
  }, [isRecording, value, mediaStream])

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  const handleSend = useCallback(() => {
    if ((!value.trim() && !uploadedImage) || isStreaming || disabled) return

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
    onSend(value || "Describe this image", uploadedImage || undefined)
    setValue("")
    setUploadedImage(null)
    baseTextRef.current = ""
    finalTranscriptsRef.current = ""
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, uploadedImage, isStreaming, disabled, onSend, isRecording])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setUploadedImage(event.target?.result as string)
          setShowImageBounce(true)
          setTimeout(() => setShowImageBounce(false), 400)
        }
        reader.readAsDataURL(file)
      }
      e.target.value = ""
    },
    [],
  )

  const removeImage = useCallback(() => {
    setUploadedImage(null)
  }, [])

  return (
    <div
      className={cn("absolute bottom-4 left-0 right-0 px-4 pointer-events-none z-10", hasAnimated && "composer-intro")}
      // composer-intro is the last intro animation to finish (1s delay + 4s vs
      // orb-intro's 4s), so its end is the cue to resolve into the split layout.
      onAnimationEnd={(e) => {
        if (e.animationName !== "composer-intro" || introDoneRef.current) return
        introDoneRef.current = true
        setPhase("workspace")
      }}
    >
      <div className="relative max-w-xl mx-auto pointer-events-auto">
        <div
          className={cn(
            "flex flex-col gap-3 p-4 bg-white border-stone-200 transition-all duration-200 border-none border-0 overflow-hidden relative rounded-3xl",
            "focus-within:border-stone-300 focus-within:ring-2 focus-within:ring-stone-200",
          )}
          style={{
            boxShadow:
              "rgba(14, 63, 126, 0.06) 0px 0px 0px 1px, rgba(42, 51, 69, 0.06) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.06) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.06) 0px 6px 6px -3px, rgba(14, 63, 126, 0.06) 0px 12px 12px -6px, rgba(14, 63, 126, 0.06) 0px 24px 24px -12px",
          }}
        >
          <div className="flex gap-2 items-center">
            {uploadedImage && (
              <div className={cn("relative shrink-0", showImageBounce && "image-bounce")}>
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200">
                  <Image
                    src={uploadedImage || "/placeholder.svg"}
                    alt="Uploaded image"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-800 hover:bg-stone-900 text-white rounded-full flex items-center justify-center transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                handleInput()
              }}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening..." : "Try: make variation 3 more aggressive"}
              disabled={isStreaming || disabled}
              rows={1}
              className={cn(
                "flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-stone-800 placeholder:text-stone-400",
                "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                "max-h-[56px] overflow-y-auto",
              )}
              aria-label="Message input"
            />

            {isRecording && (
              <div className="shrink-0 w-24">
                <AudioWaveform isRecording={isRecording} stream={mediaStream} />
              </div>
            )}

            {isStreaming ? (
              <button
                onClick={onStop}
                className="relative h-9 w-9 shrink-0 transition-all rounded-full flex items-center justify-center cursor-pointer hover:scale-105"
                aria-label="Stop generating"
              >
                <AnimatedOrb size={36} variant="red" />
                <Square
                  className="w-4 h-4 absolute drop-shadow-md text-red-700"
                  fill="currentColor"
                  aria-hidden="true"
                />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={(!value.trim() && !uploadedImage) || disabled}
                className={cn(
                  "relative h-9 w-9 shrink-0 transition-all rounded-full flex items-center justify-center",
                  (!value.trim() && !uploadedImage) || disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:scale-105",
                )}
                aria-label="Send message"
              >
                <AnimatedOrb size={36} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload image"
            />

            <div className="relative">
              <Button
                onClick={toggleRecording}
                disabled={isStreaming || disabled}
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 transition-all rounded-full relative z-10",
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-zinc-100 hover:bg-zinc-200 text-stone-700",
                )}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || disabled}
              size="icon"
              className="h-9 w-9 shrink-0 bg-zinc-100 hover:bg-zinc-200 text-stone-700 rounded-full"
              aria-label="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

          </div>
        </div>
      </div>
    </div>
  )
}
