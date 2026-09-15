// Mocked library intents. Everything here is local — no model calls.

export type Modifier =
  | "more aggressive"
  | "softer"
  | "shorter"
  | "punchier"
  | "more urgent"
  | "funnier"

export type LibraryIntent =
  | { kind: "modify"; variation: number; modifier: Modifier }
  | { kind: "duplicate"; variation: number }
  | { kind: "delete"; variation: number }

const MODIFIERS: Modifier[] = [
  "more aggressive",
  "softer",
  "shorter",
  "punchier",
  "more urgent",
  "funnier",
]

const VARIATION_RE = /\bvariation\s+(\d+)\b/i
const DUPLICATE_RE = /\b(?:duplicate|copy|clone)\s+variation\s+(\d+)\b/i
const DELETE_RE = /\b(?:delete|remove|drop|kill)\s+variation\s+(\d+)\b/i
const MODIFIER_RE = new RegExp(`\\b(${MODIFIERS.join("|")})\\b`, "i")

/** Returns null when nothing matches, so the caller falls through to the real API. */
export function parseIntent(input: string): LibraryIntent | null {
  const dup = input.match(DUPLICATE_RE)
  if (dup) return { kind: "duplicate", variation: Number(dup[1]) }

  const del = input.match(DELETE_RE)
  if (del) return { kind: "delete", variation: Number(del[1]) }

  const v = input.match(VARIATION_RE)
  const m = input.match(MODIFIER_RE)
  if (v && m) {
    return {
      kind: "modify",
      variation: Number(v[1]),
      modifier: m[1].toLowerCase() as Modifier,
    }
  }

  return null
}

/** Small mocked rewrite map, keyed by modifier. */
export const MOCK_VARIANTS: Record<Modifier, { headline: string; primaryText: string }> = {
  "more aggressive": {
    headline: "Your Competitors Already Switched",
    primaryText:
      "Every week you wait is budget burned on creative that does not convert. Move the pipeline today and stop funding the gap.",
  },
  softer: {
    headline: "A Calmer Way To Build Creative",
    primaryText:
      "No frantic sprints, no last-minute resizes. Just a steady pipeline that gives your team room to think again.",
  },
  shorter: {
    headline: "Better Ads. Less Work.",
    primaryText: "One brief in. Forty on-brand cuts out.",
  },
  punchier: {
    headline: "Forty Ads. Eleven Minutes. Go.",
    primaryText:
      "Drop the brief. Watch it build. Ship the winners before your coffee goes cold.",
  },
  "more urgent": {
    headline: "Q4 Inventory Closes Friday",
    primaryText:
      "Placements are filling now and restock is not guaranteed. Lock your creative this week or sit out the quarter.",
  },
  funnier: {
    headline: "Your Design Team Deserves A Lunch Break",
    primaryText:
      "They have resized the same banner nine times today. Give them their afternoon back and let the robot do the boring half.",
  },
}

export function cannedReply(intent: LibraryIntent, headline: string): string {
  switch (intent.kind) {
    case "modify":
      return `Rewriting **variation ${intent.variation}** to be **${intent.modifier}**. I am keeping the hook type and format fixed and only changing the headline and primary text, so this stays comparable against the rest of the set. Swapping the copy in now.`
    case "duplicate":
      return `Duplicating **variation ${intent.variation}** ("${headline}"). The copy carries over untouched so you can fork the angle without losing the original.`
    case "delete":
      return `Removing **variation ${intent.variation}** ("${headline}") from the library. The remaining variations keep their numbers.`
  }
}

export function missingReply(variation: number): string {
  return `I cannot find **variation ${variation}** in the library. Check the number on the card and try again.`
}
