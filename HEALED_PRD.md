# Healed: product requirements (source of truth)

Mustapha Fadhlullah — independent security researcher
Event: YouCam API Skin AI & eCommerce VTO Hackathon (Devpost). Deadline 2026-11-02 16:45 UTC.
Branch decided in Phase 1: **A** (brows lead, lip blush second). Evidence: `DECISIONS.md`, `docs/acceptance-gates.md`.

## §1 Definition

**Healed** is a consult tool for permanent-makeup (PMU) artists. From one selfie it shows a client her own brows or
lip blush at day 0, week 6, year 1, year 2 and year 3, and the pigment fix that stops a grey-blue or orange drift.

- Tagline: *See your brows healed before the needle.*
- Verb chain, used in code, UI and copy: **SNAP → READ → CHOOSE → AGE → CORRECT → CONSENT**.
  - SNAP: guided selfie. READ: three YouCam analyses. CHOOSE: service and pigment. AGE: the timeline renders.
    CORRECT: add a modifier, year 2 re-renders. CONSENT: the consult card with the client's tick.
- YouCam does the seeing and the drawing. Our code decides every colour. The AI never chooses a colour.

## §2 The five-act story (the video's spine)

1. A grey-blue brow from a real complaint (E1): "a blurry grey-blue" within six months; removal "over $1,000" (E2).
2. SNAP and READ: the client's selfie; skin, Fitzpatrick and natural brow/lip colour named on screen.
3. AGE: the timeline scrubs her brows from day 0 to year 3. At year 2 the cool pigment has gone ashy.
4. CORRECT: the chip "cool pigment on warm skin: grey-blue risk". One tap on "+ warm modifier 15%". Year 2 re-renders soft brown.
5. CONSENT: the consult card: technique, pigment recipe, timeline strip, consent tick.

## §3 Problem (evidence)

PMU is permanent and a bad heal costs more to remove than it cost to apply. Artists cannot show the client the heal.
- E1/E2 grey-blue and reddish heals, removal over $1,000. E3 regret at the moment of the lip tattoo.
- E4 "with oily skin, the strokes will blur and they won't heal crisply".
- E5 a pigment maker: cool pigments heal ashy or grey, warm ones orange.
- E6 artists pay for colour knowledge (GBP 39/month pigment guide). E7 the nearest tool mixes colour with no face and no time.
- E8 about 50% lighter over the first four weeks; powder brows outlast microblading.
- E12/E13 no PMU entry among 201 YouCam projects; Devpost "microblading" has one project ever.

Source URLs for E1-E13 are in `strategy/CATALOGUE.md`.

## §4 Goals and non-goals

Goals: a judge gets the idea in 20 s; the engine is deterministic, tested and cited; every estimate shows a band;
the product works on a stranger's selfie (Live) and on a recorded consult (Replay).
Non-goals: booking, payments, accounts beyond a local artist profile, medical claims, removal simulation,
brand pigment names.

## §5 The flow

capture → upload once (one `file_id`) → faceTones + fitzpatrick + skin in parallel → choose service + pigment →
engine returns 5 step renders + band → renders (5 + 2 band) in parallel → timeline → modifier re-renders only
the affected steps → consult card → consent → optional save.

## §6 Architecture

- Next.js 16 App Router, TypeScript, CSS Modules + tokens, `motion/react`. No Tailwind.
- `src/youcam/`: the only code that calls YouCam. Interface `YouCam`, two adapters: `real`, `replay`. Server only.
- `src/engine/`: pure functions, no I/O. `constants.ts` holds every tunable number with a source.
- `app/api/*`: thin routes that call the adapter and the engine. `app/` pages are the five screens.
- `fixtures/replay/`: recorded real responses and renders. `evidence/`: spike, frozen run, calibration.
- Hosting: Vercel, deployed at the end of the build (decision 2026-10-27).

## §7 The healed model

Defined in `implementation.md` Phase 3 and implemented in `src/engine/`. Seven rules: modifier mix in linear RGB,
retention band, temperature class, drift, brow sharpness, lip blend, advice. Spike finding that shapes it:
Makeup VTO's brow `colorIntensity` and `definition` change the render only slightly, so **AGE is carried by the
render `color` hex (drift and fade), not by intensity alone**. Intensity and definition still move, within a
range the Phase 1 renders showed is visible.

Every constant carries an E-item or `ASSUMED`. Phase 8 calibration replaces `ASSUMED` where data allows.

## §8 Surfaces (five screens)

Capture guide · Reading · Choose · Timeline (signature moment) · Consult card. Plus `/judges`, `/calibration`,
`/api/health`. Every screen shows a Live or Replay label.

## §9 Judge surfaces

`/judges` 90-second case on Replay, then "try it with your own face" on Live. Try-to-break-it panel (Phase 7).
Frozen production run under `evidence/frozen-run/`. README scoring map. Calibration page with one hard number.

## §10 The timed demo (90 s)

0-10 grey-blue brow and the removal cost · 10-25 guided selfie, three analyses named · 25-55 timeline, drift, modifier
fix · 55-70 lip blush: dark natural lips flagged for neutralisation, sheer ombre healed preview · 70-85 consult card
and consent · 85-90 "a judge can try it with their own face" and the URL.

## §11 Tests

Engine: unit tests per rule plus the demo-claim tests in Phase 3, determinism, constants-have-sources.
Adapter: one contract test run against both adapters on the same fixtures (Phase 4).
UI: rendered-page checks in a real browser at eight widths (Phase 6). Break-it inputs on the live URL (Phase 7).

## §12 Judge Q&A

- *How do you know it heals like that?* A band, each rule cited, calibration published, artist override.
- *Is this medical?* No. Cosmetic preview. Fitzpatrick sets pigment choice and a patch-test prompt only.
- *Where do the images go?* Nothing is stored. Uploaded files and tasks are deleted from YouCam after the consult
  (`POST /s2s/v2.0/task/delete` verified in Phase 1).
- *Why does the render look smoother than my photo?* The engine retouches skin in every render. We say so, and the
  consult card shows the original beside it.
- *Cost?* About 46 units per live consult (20 + 10 + 9 + 7 renders). 995 units now, so about 21 live consults.

## §13 Scope

P0: powder brows + lip blush; guided selfie; three analyses; engine with tests; 5-step timeline; modifier control;
consult card + consent; Live and Replay; deployed.
P1: microblading stroke patterns; calibration page; artist pigment library; agent copilot for aftercare plan.
Never: booking, payments, accounts, medical claims, removal simulation, brand names.

## §14 Build order

Phase 3 engine (test-first) → Phase 4 adapter → Phase 5 thin path → Phase 6 UI → Phase 7 judge surfaces →
Phase 8 calibration → Phase 9 package. Nothing in P1 starts until P0 is deployed and recorded.

## §15 Definition of finished

All of Gates 0-9 in `docs/acceptance-gates.md` are PASSED with evidence; the live URL answers; the video is public;
the Devpost form is submitted by Mustapha.

## §16 Devpost field mapping

Name Healed · tagline §1 · story §2-3 · built with youcam-skin-analysis, makeup-vto, fitzpatrick, facial-color-tones ·
repo public with licence · live URL · YouTube 1-3 min naming each API · testing instructions: no login, `/judges`,
"try it with your own face". Full mapping in `docs/SUBMISSION.md`.
