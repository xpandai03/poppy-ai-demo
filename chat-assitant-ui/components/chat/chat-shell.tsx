"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquareDashed } from "lucide-react"
import { MessageList } from "./message-list"
import { Composer } from "./composer"
import { Button } from "@/components/ui/button"
import { useLibrary } from "@/lib/store"
import { cannedReply, missingReply, MOCK_VARIANTS, parseIntent } from "@/lib/intents"

// Data model for messages
export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
  imageData?: string
}

// localStorage key for persisting messages
const STORAGE_KEY = "chat-messages"

// Q6: single pinned model for the demo; the picker was removed.
const MODEL_ID = "google/gemini-2.0-flash-001"

// Generates a unique ID for messages
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function ChatShell() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const setGenerating = useLibrary((s) => s.setGenerating)
  const requestFocus = useLibrary((s) => s.requestFocus)
  const updateItem = useLibrary((s) => s.updateItem)
  const removeItem = useLibrary((s) => s.removeItem)
  const duplicateItem = useLibrary((s) => s.duplicateItem)

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const messagesWithDates = parsed.map((msg: Message) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
        }))
        setMessages(messagesWithDates)
      }
    } catch (e) {
      console.error("Failed to load from localStorage:", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch (e) {
      console.error("Failed to save messages to localStorage:", e)
    }
  }, [messages])

  /** Types a canned assistant reply out word by word so the streaming text
   *  animation runs exactly as it does for a real response. */
  const streamCanned = useCallback(async (assistantId: string, text: string) => {
    const parts = text.split(/(\s+)/)
    let acc = ""
    for (const part of parts) {
      acc += part
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)))
      await new Promise((r) => setTimeout(r, 26))
    }
  }, [])

  /**
   * Mocked library actions. Runs entirely against the store — no model call.
   * Returns false when the text is not a library command, so the caller falls
   * through to the real API route.
   */
  const handleLibraryIntent = useCallback(
    async (content: string): Promise<boolean> => {
      const intent = parseIntent(content)
      if (!intent) return false

      const { items } = useLibrary.getState()
      const target = items.find((i) => i.variation === intent.variation)

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      }
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      if (!target) {
        await streamCanned(assistantMessage.id, missingReply(intent.variation))
        setIsStreaming(false)
        return true
      }

      const index = items.findIndex((i) => i.id === target.id)
      const reply = cannedReply(intent, target.headline)

      if (intent.kind === "duplicate") {
        const copy = duplicateItem(target.id)
        if (copy) {
          requestFocus(useLibrary.getState().items.findIndex((i) => i.id === copy.id))
          setTimeout(() => updateItem(copy.id, { flash: false }), 700)
        }
        await streamCanned(assistantMessage.id, reply)
        setIsStreaming(false)
        return true
      }

      if (intent.kind === "delete") {
        removeItem(target.id)
        await streamCanned(assistantMessage.id, reply)
        setIsStreaming(false)
        return true
      }

      // modify
      setGenerating(true)
      updateItem(target.id, { status: "generating" })
      // Bring it forward straight away so the generating state is watchable.
      requestFocus(index)

      setTimeout(() => {
        const next = MOCK_VARIANTS[intent.modifier]
        updateItem(target.id, {
          headline: next.headline,
          primaryText: next.primaryText,
          status: "ready",
          flash: true,
        })
        setGenerating(false)
        requestFocus(index)
        setTimeout(() => updateItem(target.id, { flash: false }), 700)
      }, 1800)

      await streamCanned(assistantMessage.id, reply)
      setIsStreaming(false)
      return true
    },
    [duplicateItem, removeItem, requestFocus, setGenerating, streamCanned, updateItem],
  )

  // Send a message to the AI
  const sendMessage = useCallback(
    async (content: string, imageData?: string) => {
      if ((!content.trim() && !imageData) || isStreaming) return

      setError(null)

      // Mocked library commands never reach the API route.
      if (!imageData && (await handleLibraryIntent(content))) return

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim() || "Describe this image",
        createdAt: new Date(),
        imageData,
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      }

      const newMessages = [...messages, userMessage, assistantMessage]
      setMessages(newMessages)
      setIsStreaming(true)
      setGenerating(true)

      const controller = new AbortController()
      setAbortController(controller)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
              imageData: m.imageData,
            })),
            model: MODEL_ID,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        let accumulatedContent = ""

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          accumulatedContent += chunk

          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg)),
          )
        }
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, content: msg.content || "[Cancelled]" } : msg,
            ),
          )
        } else {
          console.error("Error sending message:", e)
          setError(e instanceof Error ? e.message : "An error occurred")
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
        }
      } finally {
        setIsStreaming(false)
        setGenerating(false)
        setAbortController(null)
      }
    },
    [messages, isStreaming, setGenerating, handleLibraryIntent],
  )

  const retry = useCallback(() => {
    if (messages.length === 0) return
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMessage) {
      const index = messages.findIndex((m) => m.id === lastUserMessage.id)
      setMessages(messages.slice(0, index))
      setError(null)
      setTimeout(() => sendMessage(lastUserMessage.content, lastUserMessage.imageData), 100)
    }
  }, [messages, sendMessage])

  const stopStreaming = useCallback(() => {
    if (abortController) {
      abortController.abort()
    }
  }, [abortController])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <div
      className="relative h-full bg-stone-50"
      style={{
        boxShadow:
          "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px",
      }}
    >
      <Button
        onClick={clearChat}
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-zinc-100 hover:bg-zinc-200 text-stone-600"
        aria-label="Reset chat"
      >
        <MessageSquareDashed className="w-5 h-5" />
      </Button>

      <MessageList messages={messages} isStreaming={isStreaming} error={error} onRetry={retry} isLoaded={isLoaded} />

      <Composer
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isStreaming}
        disabled={!!error}
      />
    </div>
  )
}
