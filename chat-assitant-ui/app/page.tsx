import { ChatShell } from "@/components/chat/chat-shell"
import { LibraryPane } from "@/components/library-pane"

export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden flex flex-col md:flex-row">
      <section
        id="chat-pane"
        className="relative h-1/2 md:h-full md:w-1/2 shrink-0 overflow-hidden isolate bg-stone-50"
      >
        <ChatShell />
      </section>

      <section
        id="library-pane"
        className="relative h-1/2 md:h-full md:flex-1 overflow-hidden isolate bg-black"
      >
        <LibraryPane />
      </section>
    </main>
  )
}
