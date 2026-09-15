import { streamText, type ModelMessage } from "ai"

/** The demo is public and usually runs without a key, so it must never 500. */
const GATEWAY_KEY = "AI_GATEWAY_API_KEY"

const NO_KEY_REPLY = `I am running in **offline demo mode** — no AI Gateway key is configured on this deployment, so I am not calling a live model.

The **creative library** on the right is fully interactive, and those commands are mocked locally rather than routed to a model. Try one of these:

- \`make variation 3 more aggressive\` — also accepts softer, shorter, punchier, more urgent, funnier
- \`duplicate variation 2\`
- \`delete variation 5\`

You can also click any card to open it and edit the copy. To enable live chat, set \`${GATEWAY_KEY}\` and redeploy.`

const UPSTREAM_REPLY = `I could not reach the model just now, so I am answering from a local fallback rather than showing an error.

The **creative library** still works — try \`make variation 3 more aggressive\`, \`duplicate variation 2\`, or click a card to edit it.`

/** Streams plain text in small chunks, matching `toTextStreamResponse()` so the
 *  client reader and its streaming text animation behave identically. */
function cannedStream(text: string): Response {
  const encoder = new TextEncoder()
  const parts = text.split(/(\s+)/)
  const stream = new ReadableStream({
    async start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part))
        await new Promise((r) => setTimeout(r, 18))
      }
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}

/**
 * POST /api/chat
 *
 * This route handler proxies requests to the Vercel AI Gateway.
 * It receives messages from the frontend and streams the AI response back.
 */
export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid request: messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // No key configured -> canned stream instead of a hard failure.
    if (!process.env[GATEWAY_KEY]) {
      console.warn(`[poppy] ${GATEWAY_KEY} not set — serving the offline demo reply.`)
      return cannedStream(NO_KEY_REPLY)
    }

    const selectedModel = model || "google/gemini-2.0-flash-001"

    const lastIndex = messages.length - 1
    const transformedMessages: ModelMessage[] = messages.map(
      (m: { role: string; content: string; imageData?: string }, index: number): ModelMessage => {
        // Only process image for the last user message
        const isLastUserMessage = index === lastIndex && m.role === "user"

        if (isLastUserMessage && m.imageData && m.imageData.startsWith("data:image/")) {
          // For the current message with an image, use multimodal content format
          return {
            role: "user",
            content: [
              { type: "image", image: m.imageData },
              { type: "text", text: m.content || "Describe this image in detail." },
            ],
          }
        }

        // For all other messages (history), use text only
        // If there was an image, mention it in the text
        let textContent = m.content
        if (m.imageData && !isLastUserMessage) {
          textContent = m.content || "[User shared an image]"
        }

        return m.role === "assistant"
          ? { role: "assistant", content: textContent }
          : { role: "user", content: textContent }
      },
    )

    // Filter out any messages with empty content
    const validMessages = transformedMessages.filter((m) => {
      if (typeof m.content === "string") {
        return m.content.trim().length > 0
      }
      return true // Keep multimodal messages
    })

    if (validMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages to process" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = streamText({
      model: selectedModel,
      messages: validMessages,
      system: `You are a helpful, friendly AI assistant. You provide clear, concise, and accurate responses. 
When explaining code or technical concepts, use markdown formatting with code blocks where appropriate.
Be conversational but professional. If you're unsure about something, say so honestly.
When analyzing images, describe them in detail and answer any questions about them.`,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("[poppy] Chat API error:", error)
    return cannedStream(UPSTREAM_REPLY)
  }
}
