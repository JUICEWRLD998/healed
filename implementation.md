# Healed: implementation plan

*See your brows healed before the needle.*

A consult tool for permanent-makeup (PMU) artists. From one client selfie it renders her own brows or lip blush at
day 0, healed, year 1, year 2 and year 3, and shows the pigment correction that stops a grey-blue or orange drift.

- Event: YouCam API Skin AI & eCommerce VTO Hackathon (Perfect Corp, Devpost).
- **Deadline: 2026-11-02 11:45 ET = 16:45 UTC (17:45 WAT).** Internal cutoff: **2026-11-02 08:00 UTC**. After the
  cutoff, only packaging and outage fixes.
- Last day to switch to the runner-up (Seedright) if Phase 1 fails: **2026-10-29**.
- Strategy and evidence: `strategy/PICK.md`, `strategy/CATALOGUE.md` (E1-E13), `strategy/INTAKE.md`.
- Judged on four equal criteria: Technological Implementation, Design, Potential Impact, Quality of Idea.

Phases run in order. Each ends on a gate you can check. When a gate passes, record it in
`docs/acceptance-gates.md` with the UTC time and the raw evidence, and screen-record the demo act it unlocks
straight away. A later phase never blocks the recording of an earlier one.

---

## Phase 0: Accounts, repo, skeleton — DONE 2026-10-27

**Goal:** a deployed empty app that holds the API key server-side.

1. Find the Devpost redeem-code email. Sign up at https://yce.makeupar.com/ai-api, then go to Account > Redeem Code
   (+1,000 units). Create an API key in the console. Note which console you used (makeupar.com or perfectcorp.com),
   because the API host follows it.
2. Create the repo `healed` (Next.js App Router + TypeScript). House stack: CSS Modules + design tokens,
   `motion` imported from `motion/react`, no Tailwind. Add `vitest` for the engine and `culori` for colour maths.
   Pin exact versions.
3. Set the environment variables (server only, never `NEXT_PUBLIC_`):
   ```
   YOUCAM_API_KEY=...
   YOUCAM_BASE_URL=https://yce-api-01.makeupar.com   # verify in Phase 1
   HEALED_MODE=live            # live | replay
   LIVE_UNIT_FLOOR=150         # below this, live pauses and Replay takes over
   LIVE_CAP_PER_IP_PER_DAY=3
   ```
4. Deploy to Vercel. Add a `/api/health` route returning `{ mode, version }`.
5. Day-one files, written before feature code:
   - `README.md` skeleton: thesis, why YouCam, how it works, live URL, verify in 60 s, what this is NOT.
   - `CLAIMS.md`: each README claim and the command that reproduces it.
   - `DECISIONS.md`: newest first; each entry has a measurement, the rejected alternative and the file.

**Gate 0 (revised 2026-10-27: Vercel deploy deferred to the end of the build; key verified live via GET /s2s/v1.0/client/credit, 1040 units; local build clean):** the deployed URL loads, `/api/health` answers, and the key is absent from the client bundle.
Check: `grep -r YOUCAM_API_KEY .next/static` returns nothing.

---

## Phase 1: Access spike (the decisive unknown) — DONE 2026-10-27, branch A

**Goal:** prove the four load-bearing APIs work from our stack, pin their real response shapes, and decide
branch A or B. Use one front-facing selfie of a real, consenting face with bare brows and no makeup, in even
light. Spend about 60 units in total.

Run these as a throwaway script (`scripts/spike.mjs`) and save every raw response under `evidence/spike/`:

| # | Call | Docs path (VERIFIED in docs, confirm live) | What to record |
|---|---|---|---|
| 1 | File upload | File API returns `file_id` and an upload URL (`requests.url`); then PUT the bytes to that URL | exact request body, required PUT headers |
| 2 | Facial Color Tones | `POST /s2s/v2.0/task/skin-tone-analysis`, then poll | `skin_color`, `lip_color`, `eyebrow_color`, `hair_color` hex; units used (docs: 20) |
| 3 | Fitzpatrick | `POST /s2s/v2.0/task/fitzpatrick-scale-analyzer`, then `GET .../{task_id}` | the field name holding the type, the I-VI value; units (docs: 10). JPG only |
| 4 | Skin Analysis (SD) | `POST /s2s/v2.0/task/skin-analysis` with oiliness, pore, redness, skin_type | `ui_score` and `raw_score` per concern; units for this tier |
| 5 | Makeup VTO, brows | `POST /s2s/v2.0/task/makeup-vto`, `effects: [{ category: "eyebrows", ... }]` | renders at colorIntensity 80/50/25 and definition 90/50/20 (6 renders, 1 unit each) |
| 6 | Makeup VTO, lips | `effects: [{ category: "lip_color", texture: "sheer", style: { type: "ombre" } ... }]` | renders at 3 intensities; whether it looks like lip blush |

Also find out, and write into `docs/acceptance-gates.md`:
- The task status values while running, and a sensible poll interval.
- Whether the Unit System API returns the account balance (it drives the live-mode floor).
- Whether the "delete with resources" endpoint (changelog v1.13) deletes uploaded files. That supports the privacy
  claim of storing nothing.
- The real latency of each call (median of 3).

**Decide the branch from the renders. Look at them; don't infer.**
- **Branch A:** the brow renders at low intensity and low definition read as faded, softened PMU brows. Brows lead
  the demo and lips come second.
- **Branch B:** the brows look like stylised makeup at every setting. Lip blush leads the demo, and brows appear as
  powder brows only.
- **Both fail:** stop. Switch to Seedright by 2026-10-29 (see `strategy/PICK.md`).

**Gate 1:** all four APIs return success from our server code. Raw JSON is saved, the branch is written in
`DECISIONS.md` with the render images as evidence, and the units per consult are measured.

---

## Phase 2: Build contract

**Goal:** the coding agent builds against a written contract and never re-derives requirements from memory.
Write these four files in the repo from `strategy/PICK.md` and the Phase 1 results:

1. `HEALED_PRD.md`, with numbered sections:
   - §1 definition, tagline, and the verb chain used everywhere: **SNAP → READ → CHOOSE → AGE → CORRECT → CONSENT**.
   - §2 the five-act story (the video's spine): act 1, a grey-blue brow from a real complaint (E1); act 2, snap
     and read; act 3, the timeline ages her brows; act 4, the warm modifier corrects them; act 5, the consult card
     she consents to.
   - §3 problem, citing E1-E8; §4 goals and non-goals; §5 the flow; §6 architecture; §7 the healed model (Phase 3
     below); §8 surfaces (5 screens, no sprawl); §9 judge surfaces; §10 the timed demo; §11 tests; §12 judge Q&A;
     §13 scope P0/P1/never; §14 build order; §15 definition of finished; §16 Devpost field mapping.
2. Repo `CLAUDE.md`: PRD is the source of truth; resolved decisions (branch A/B, stack); invariants (below);
   honesty rules; framework gotchas for the pinned versions.
3. `docs/acceptance-gates.md`: Gates 0-9 from this plan, pre-filled as NOT TESTED.
4. `docs/SUBMISSION.md`: started now, finished in Phase 9.

Invariants that go into `CLAUDE.md`:
- The API key lives only on the server. Every YouCam call goes through `src/youcam/` and nowhere else.
- The healed model is deterministic: the same inputs always give the same output, and no model or random input is
  involved. Every constant in it carries a source (E-item) or the label `ASSUMED`.
- Every estimate shows a band (lighter and darker bounds), never a single confident answer.
- A screen always shows whether its renders are Live or Replay.
- No face image is stored on our server. Uploaded files are deleted from YouCam after the consult when the delete
  endpoint works.
- Cosmetic language only. No medical claims; Fitzpatrick type is used for pigment choice and a patch-test prompt,
  never for a diagnosis.

**Gate 2:** the four files exist; CI runs typecheck and tests on push and is green.

---

## Phase 3: The healed engine (deterministic core, test-first) — DONE 2026-10-27

**Goal:** pure TypeScript in `src/engine/` that turns analysis results plus the artist's choices into render
parameters for each time step. No network calls. Write the tests first (`test-driven-development`).

### Inputs
```ts
type Client = {
  skinHex: string; browHex: string; lipHex: string; hairHex: string;  // Facial Color Tones
  fitzpatrick: 1 | 2 | 3 | 4 | 5 | 6;                                // Fitzpatrick
  oiliness: number; pore: number; redness: number;                   // Skin Analysis ui_score 0-100
};
type Service = "powder_brow" | "microblading" | "lip_blush";
type Choice = { service: Service; pigmentHex: string; modifier?: { hex: string; ratio: number } }; // ratio 0-0.3
type Step = "day0" | "week6" | "year1" | "year2" | "year3";
```

### Outputs
```ts
type StepRender = {
  step: Step;
  hex: string;                       // colour passed to Makeup VTO
  colorIntensity: number;            // 0-100
  definition?: number;               // brows only, 0-100
  transparencyIntensity?: number;    // lips only, 0-100
  band: { lighterHex: string; darkerHex: string; lighterIntensity: number; darkerIntensity: number };
  drift: "none" | "cool" | "warm";   // the warning chip
};
type Advice = { technique: Service; reasons: string[]; flags: string[] };   // e.g. "neutralise lips first"
```

### Rules (each rule is a function with its own tests)
1. **Mixing the modifier.** Mix the pigment and the modifier in linear RGB by ratio. Label it as an approximation of
   subtractive pigment mixing (`ASSUMED`).
2. **Retention** is the share of fresh colour strength left at each step. It is a band:
   day0 1.0 | week6 0.5-0.7 | year1 0.4-0.6 | year2 0.3-0.5 | year3 0.2-0.4.
   The week-6 value comes from E8 ("about 50% lighter over four weeks"). The rest is `ASSUMED` until the Phase 8
   calibration. Microblading multiplies retention by 0.8 after year 1, because powder brows outlast microblading
   (E8). Oily skin (oiliness 70 or more) multiplies it by 0.85 (E4).
3. **Temperature.** Classify the pigment as cool, neutral or warm from its CIELAB values (low or negative b* and
   low chroma means cool and ashy; high a* and b* means warm).
4. **Drift** grows as retention falls (E5):
   - cool pigment: move b* toward blue and cut chroma (the grey-blue heal in E1/E2);
   - warm pigment on warm skin: raise a* and b* (the orange heal);
   - red-based lip pigment: lean pink as the other components fade (E5).
   Drift scales continuously with how cool or warm the pigment is, so a warm modifier lowers a cool drift smoothly.
   Magnitudes are `ASSUMED` constants in one file, `src/engine/constants.ts`.
5. **Sharpness (brows).** Definition falls over time. It falls faster for microblading on oily skin or large pores
   (oiliness or pore 70 or more: strokes blur within a year, E4). Powder brows start soft by design.
6. **Lips.** Blend the pigment with the natural `lipHex` by retention. Use `texture: "sheer"`, with
   `transparencyIntensity` rising as colour fades, and an ombré style option.
7. **Advice.** Microblading on oily or large-pore skin recommends powder brows, with the reason. Dark natural lips
   (`lipHex` L* below a threshold, `ASSUMED`) add the flag "neutralisation session first". Fitzpatrick IV-VI adds
   "patch test first". Find a citation for both flags in this phase, or label them practitioner guidance.

### Tests that mirror the demo's claims
- A cool dark-brown pigment drifts cool by year 2 (drift = "cool", b* lower than at day 0).
- The same pigment plus a 15% warm modifier gives drift "none" at year 2.
- Microblading with oiliness 80 recommends powder brows and blurs faster than with oiliness 30.
- Retention never rises over time, and the band always brackets the midpoint.
- The same inputs give byte-identical output twice (determinism).
- Every constant in `constants.ts` has a source or `ASSUMED` comment (a test reads the file).

**Gate 3:** all engine tests are green, and `npm test` output is pasted into the gate.

---

## Phase 4: The YouCam adapter (real + replay)

**Goal:** one interface, two adapters, in `src/youcam/`.

```ts
interface YouCam {
  upload(img: Buffer): Promise<FileRef>;
  faceTones(f: FileRef): Promise<Tones>;
  fitzpatrick(f: FileRef): Promise<1|2|3|4|5|6>;
  skin(f: FileRef): Promise<SkinScores>;
  render(f: FileRef, effects: MakeupEffect[]): Promise<RenderResult>;   // Makeup VTO
  remove?(f: FileRef): Promise<void>;
  balance?(): Promise<number>;
}
```

- **Real adapter:** Bearer auth; upload then PUT; create the task; poll with backoff and a hard timeout; map every
  YouCam error code to one plain sentence for the client (no face, face too small, several faces, bad pose, bad
  lighting, NSFW). Validate response shapes with `zod` against the Phase 1 fixtures.
- **Replay adapter:** reads recorded responses and render images from `fixtures/replay/`. It never touches the
  network and needs no key. It drives the scripted demo and the `/judges` route.
- **Cache:** the key is the image hash + feature + parameter JSON. A timeline scrub never pays twice.
- **Unit ledger:** log the units each call spends. Live mode pauses when the balance falls below `LIVE_UNIT_FLOOR`,
  with the message "Live paused to protect the demo budget; showing a recorded consult". Cap per IP per day.
- Run the three analyses in parallel, then fire the 5 timeline renders plus 2 band renders in parallel.

**Gate 4:** an adapter contract test passes against both adapters with the same fixtures. One live consult end to
end costs the number of units measured in Phase 1, recorded in the gate.

---

## Phase 5: Thin path, end to end (ugly is fine)

**Goal:** a stranger can go from selfie to timeline on the deployed URL.

Flow: capture, then 3 analyses, then choose the service and pigment, then the engine, then renders, then the
timeline, then the consult card.

- Capture: `getUserMedia` with a face-size and brightness check, plus file upload as a fallback. If the YouCam
  JS Camera Kit offers guided capture (alignment, lighting, face size), try it here. It adds another YouCam surface
  to the integration story.
- A starter pigment library of generic names and hex values, no brand names. Brows: soft black, cool dark brown,
  neutral medium brown, warm light brown. Lips: nude rose, coral, berry, peach neutraliser. Modifiers: warm (orange),
  cool. The artist can type their own hex.

**Gate 5:** a cold visitor on the live URL gets their own timeline in under 60 s. Screen-record it at once: this
is demo act 2-3, raw.

---

## Phase 6: UI (run `ui-studio`)

**Goal:** a complete, coherent product (the Design criterion), built around one signature moment.

- **Signature moment:** the timeline scrub. Her brows age from day 0 to year 3 on her own face. A chip warns of
  cool drift. One tap on "+ warm modifier" re-renders year 3 soft brown. The video, thumbnail and gallery card are
  cut from this screen, so design it first.
- **Five screens, no sprawl:** capture guide; reading (the three analyses in plain words); choose (service +
  pigment); timeline (the wow); consult card (technique, pigment recipe, timeline strip, consent tick, share or
  print).
- **Visual vocabulary from the PMU studio, not from tech.** Brow-mapping string lines and measured guides, pigment
  bottle labels, healed-results charts, consent paperwork. No terminal or neon looks, no glass. Let `ui-studio`
  explore three directions before committing.
- His floors apply: a measured OKLCH palette with 2-3 support hues and tinted surfaces; the real imagery is the
  client's own renders; feedback motion on every state change; screenshots checked at 320, 375, 414, 768, 1024,
  1280, 1440 and 1920 px.
- Verify in a real browser (headless Chrome over CDP or Playwright): click the real flow, take screenshots, measure
  contrast. A grep of class names is not verification.

**Gate 6:** `ui-studio`'s quality bar and scorer pass on the rendered page, and screenshots at all eight widths are
saved under `evidence/ui/`.

---

## Phase 7: Judge surfaces and hardening

**Goal:** the unscripted path (a judge's own face) works, and a judge can see the product refuse bad input.

- `/judges`: the 60-90 second case on the real engine (Replay), numbered steps, no login, phone-sized, then a
  "try it with your own face" button (Live).
- **Try-to-break-it panel**, each input running through production code:
  1. a photo with no face or a tiny face: a plain sentence on what to retake;
  2. a photo with two faces: "one face per consult";
  3. microblading requested on oily skin: the tool recommends powder brows and says why;
  4. a cool black pigment: the drift warning plus the modifier that fixes it;
  5. unit budget below the floor: Live pauses and Replay takes over, with the reason.
- A Live/Replay label on every screen, and `/api/health` reports the mode.
- A **frozen production run**: one real consult (consenting face) saved under `evidence/frozen-run/` with the raw
  JSON and renders, linked from the top of the README.
- Privacy: no image is written to our disk or logs; uploaded files are deleted after the consult (if Phase 1
  confirmed the endpoint). The capture screen says so in one sentence before the camera opens.
- Run `product-hardening` and `ecc:security-review` on the key handling and the upload route.

**Gate 7:** all five break-it inputs return their stated outcome on the live URL from a clean browser.

---

## Phase 8: Calibration (the one hard number)

**Goal:** a measured number for the README and video, the way ShadeSpan led with 14.3%.

- Collect public fresh-vs-healed PMU photo pairs (artist posts, pigment makers' healed galleries). Record the
  source URL of every pair. Do not republish the images; publish only the numbers.
- Measure the brow or lip region colour in each pair (CIELAB, a fixed sampling rule), and compare the observed
  healed colour with (a) our healed estimate and (b) the naive "fresh = final" assumption.
- Report it with its denominator: "On N public pairs, our healed estimate landed within ΔE X of the real healed
  colour; assuming fresh = final missed by ΔE Y."
- Put any constant the data moves back into `constants.ts` with its new source. Never tune on the same pairs you
  report on: hold out a test set.
- Give the extractor a planted positive control: a pair with a known colour difference that it must reproduce.

**Gate 8:** the calibration numbers, the pair list and the extractor's positive control are under
`evidence/calibration/`, and `/calibration` shows them.

---

## Phase 9: Package and submit

1. **Real-user signal (G14):** DM 5-10 PMU artists (Instagram accounts that post healed results, PMU Facebook
   groups) with the live link. Quote any real reply in the README only with permission. Our own tests count as
   feedback, not traction, and the README says so.
2. **README:** a scoring map, criterion by criterion, to the shipped feature and its evidence.
   "How Healed uses YouCam" has one bullet per API call and its file, plus the hard problems where the docs and the
   live API disagreed. Use LIVE / NEXT / NOT LIVE everywhere.
3. **Video (`demo-video` from the deployed URL):** 1-3 min on public YouTube. Open on the grey-blue brow complaint,
   land the wow by 0:30, name every YouCam API used, show the app running on the phone. Use your own face or a
   consenting volunteer's, with no pigment brand names and no third-party music.
4. **Devpost form:** name, tagline, story, screenshots, built-with tags (youcam-skin-analysis, makeup-vto,
   fitzpatrick, facial-color-tones), repo URL (public with a licence), live URL, video URL, and testing
   instructions ("no login; /judges for the 90-second case; 'try it with your own face' runs live").
5. **Social bonus:** post the video on up to 2 platforms tagging @YouCam API, naming the APIs, with the line
   "Received API credits for sharing". The account must predate 2026-09-29. Submit the form before the deadline.
   The units arrive after the submission period and keep the live demo running through judging (2026-11-03 to 11-20).
6. **Pre-submit checks:** grep for `mock|fake|dummy|lorem|picsum|randomuser|example.com` and justify or fix every
   hit; run the judge's path live from a clean browser; no default favicon or title; every number in the README,
   UI and video read from `evidence/`. Run `humanizer` on all copy.
7. **You press submit.** After the deadline, keep the demo live and fix outages only; push no feature commits.

**Gate 9:** submitted on Devpost, the confirmation saved, and the live URL answering.

---

## Scope

| P0 (the recorded demo; nothing else starts until it is deployed and recorded) | P1 (after P0) | Never in this event |
|---|---|---|
| Phases 0-7; powder brows + lip blush (or lips first on branch B); timeline + modifier; consult card | Phase 8 calibration; microblading stroke patterns; the artist's own pigment library; an agent copilot via YouCam MCP or Skills that drafts aftercare and the 6-week touch-up plan (AI proposes, code decides) | booking, payments, accounts, removal simulation, medical claims, a marketplace |

## Judge Q&A (prepared answers, refined as gates pass)

- *How do you know it heals like that?* It doesn't promise one result. It shows a band built from practitioner
  rules (each one cited) and, after Phase 8, measured against N real healed photos. The artist can override any value.
- *Who pays?* PMU artists already pay for colour knowledge (a GBP 39/month pigment-guide membership, E6). Healed is
  that knowledge applied to the client in the chair, plus a consent record when a client disputes a colour.
- *How is this different from a pigment app or a healed gallery?* Those show colours or strangers. This shows her
  face, over time.
- *Why YouCam?* Four APIs feed one decision. Skin Analysis sets the blur, Fitzpatrick sets the drift, Facial Color
  Tones gives her natural brow and lip colour, and Makeup VTO's `definition`, `sheer` and `ombre` controls render
  each step at 1 unit.
- *Isn't this medical?* No. It is cosmetic only, with no diagnosis. Fitzpatrick type picks pigment and prompts a
  patch test.
- *What's real?* Every render is a live YouCam call or a labelled recording of one; the frozen run's raw JSON is in
  the repo.
