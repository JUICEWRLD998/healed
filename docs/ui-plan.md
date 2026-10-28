# Phase 6 UI plan: Healed

Subject: a consult tool for permanent-makeup artists, used with the client in the chair. One job per screen.
Audience: the artist (drives) and the client (looks, ticks consent). Byline and copy rules: `CLAUDE.md`.

## Vocabulary sheet (from the PMU studio, not from tech)

- **Brow mapping:** the three-point string line (nose wing to inner corner, to arch, to tail), drawn as a thin
  measured guide over the face. Used on the capture guide and as the timeline's scrub rail.
- **Pigment bottle label:** a swatch disc, a generic name, a hex, a lot-style line. Used for pigment choice.
- **Healed-results chart:** a strip of five tiles (day 0 to year 3) with a drift tick under each. Used for the
  consult card.
- **Consent paperwork:** a ruled form with a tick box and a signature line. Used for the consult card.
- Ground is treatment-room porcelain (cool, clinical, slightly green-grey), ink is brow-pigment brown-black.
  No terminal, no neon, no glass, no glow.

## Palette (OKLCH, measured by a culori script, numbers below)

| Role | Light | Dark |
|---|---|---|
| ground | oklch(0.962 0.009 205) | oklch(0.19 0.012 205) |
| raised | oklch(0.985 0.005 205) | oklch(0.23 0.014 205) |
| ink | oklch(0.25 0.02 45) | oklch(0.94 0.012 60) |
| muted | oklch(0.47 0.02 45) | oklch(0.72 0.02 60) |
| accent (the one CTA colour) | oklch(0.48 0.09 178) | oklch(0.78 0.1 178) |
| warm (orange drift, warm modifier) | oklch(0.55 0.13 55) | oklch(0.76 0.12 58) |
| cool (grey-blue drift, cool modifier) | oklch(0.5 0.1 245) | oklch(0.74 0.09 245) |
| caution (flags) | oklch(0.5 0.11 85) | oklch(0.8 0.11 88) |
| rose (lip data) | oklch(0.52 0.12 15) | oklch(0.74 0.11 15) |

Measured: text pairs on raised 4.3 to 15.4 in light (warm was 4.29, lowered to L 0.55 after the first run), 6.9 to
14.1 in dark. Lowest role-hue ΔE76 is 21.1 (warm/caution, dark) and 23.4 (light), above the 20 floor. Accent chroma
is 8 to 10 times ground chroma. Re-measured on the rendered page in the verify pass.

**Collision, stated once:** accent hue 178 sits near his SIGNAL DECK mint, and a dark ground with one teal accent
is in the "near-black + one accent" cluster. Here the default theme is LIGHT porcelain, the accent is a deep
clinical teal used only for the primary action, and four support hues have jobs. Dark is a designed second theme.

## Type

One family, Schibsted Grotesk (400 to 800), via `next/font/google`. Weight and size carry the voice: heavy tight
display for the year and the verdict, regular for reading. `tabular-nums` on every changing number. Headings
`text-wrap: balance`. No eyebrows, no monospace labels, no gradient text.

## Screens, hierarchy contract (first viewport)

| Screen | Where am I | Matters most | Can do | Just happened | Next |
|---|---|---|---|---|---|
| Capture | step 1 of 5, Live/Replay chip | the face guide with brow string-lines | Use camera, Upload | photo warnings | Take photo |
| Reading | step 2 | the three analyses naming themselves | wait | the read is running | Choose |
| Choose | step 3 | service, then pigment bottles | pick service, pigment, modifier | her read results | Show me healed |
| Timeline | step 4 | HER face at the chosen age, big | scrub, +warm modifier | renders landing | Make consult card |
| Consult card | step 5 | the five-tile healed strip + recipe | tick consent, print | consent state | Start over |

## Image plan (R1 first)

Every key route shows the client's own render, the product's output. Capture: the live camera, plus an R2
string-line SVG guide. Reading: her own photo with the analyses named beside it. Choose: her photo. Timeline and
card: her renders (R1). Replay renders show a real face and stay git-ignored.

## Signature moment beat sheet

```
Signature moment: The scrub (her brows age)
Trigger:        the timeline appearing, or the scrub thumb moving
Beats:          t=0      day-0 render fills the stage; the string-line guide is drawn over the brows
                t=200ms  scrub thumb travels to week 6; the render cross-dissolves (opacity only)
                t=600ms  the year readout counts up; the drift tick under the thumb takes its hue
                t=900ms  at year 2 on cool pigment, the cool-drift chip rises (transform + opacity)
                settle by <= 1200ms
The eye follows: scrub thumb -> face render -> drift chip
End state:      text "Year 2: drifts cool, grey or blue cast" plus the band, in an aria-live region
Reduced motion: instant jumps, crossfade only, same text
Thumbnail frame: year 2 with the drift chip visible, then the modifier fix beside it
```

Tapping "+ warm modifier" re-renders the affected steps and cross-dissolves the year-2 frame to the corrected one.
The chip changes to "corrected" with a hue change as feedback.

## Three directions (explored in `docs/ui-explore/`)

- **A. Mapping sheet:** the face large, the string-line guide drawn on it, the scrub rail a measured ruler below.
- **B. Pigment ledger:** split view, face left, bottle-label stack and healed strip right.
- **C. Consent form:** a document layout, the strip as a form row, the face inline.

The pick and the reason go in `docs/ui-explore/PICK.md`.
