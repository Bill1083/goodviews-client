export interface TutorialStep {
  title: string
  body: string
}

export interface Tutorial {
  /** Stable id, never reused — this is what's appended to seen_tutorials. */
  key: string
  /** ISO date this feature shipped. Accounts created before this date are
   * eligible to see the tutorial pop up on its own; accounts created after
   * it skip it automatically, since the feature was just always there for
   * them — see features/tutorials/TutorialManager.tsx. */
  shippedAt: string
  /** Short label used in the "Features & Tutorials" list in Profile. */
  title: string
  steps: TutorialStep[]
}

/** Every feature tutorial, oldest first. Adding a new one is just adding an
 * entry here — no database migration, no new column, no new endpoint. */
export const TUTORIALS: Tutorial[] = [
  {
    key: 'hover_highlight',
    shippedAt: '2026-10-07',
    title: 'Personal Hover Highlight',
    steps: [
      {
        title: '✨ Films can light up when you hover',
        body: "Hovering over a film in Discover, My Movies, or a friend's profile can now glow in a colour of your choice.",
      },
      {
        title: 'Turn it on in Settings',
        body: 'Head to Settings → Appearance → "Highlight Films on Hover", flip it on, and pick a neon colour. Leave it off and hover looks exactly as it always has.',
      },
    ],
  },
]
