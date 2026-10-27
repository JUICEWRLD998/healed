# Acceptance gates

Status values: PASSED, NOT TESTED, FAILED. Update with evidence the day a gate changes.

| Gate | Phase | Pass condition | Status |
|---|---|---|---|
| 0 | Skeleton | App builds, `/api/health` answers, key absent from client bundle. Deployed URL deferred to the end of the build. | PASSED (local) 2026-10-27 |
| 1 | Access spike | All four APIs succeed from server code, raw JSON saved, branch written, units per consult measured. | PASSED 2026-10-27 |
| 2 | Build contract | PRD, repo CLAUDE.md, this file, SUBMISSION.md exist; CI runs typecheck and tests, green. | PARTIAL 2026-10-27: files exist, typecheck and tests green locally; GitHub Actions jobs fail before any step starts (runner_id 0), needs account check |
| 3 | Engine | All engine tests green; `npm test` output pasted here. | PASSED 2026-10-27 (39 tests, see below) |
| 4 | Adapter | Contract test passes on both adapters; units per live consult recorded. | PASSED 2026-10-27 (66 tests; live consult 46 units, see below) |
| 5 | Thin path | A cold visitor gets their own timeline in under 60 s on the live URL; screen-recorded. | NOT TESTED |
| 6 | UI | ui-studio scorer passes on the rendered page; screenshots at 8 widths in `evidence/ui/`. | NOT TESTED |
| 7 | Judge surfaces | All five break-it inputs return their stated outcome on the live URL. | NOT TESTED |
| 8 | Calibration | Numbers, pair list and extractor positive control under `evidence/calibration/`; `/calibration` shows them. | NOT TESTED |
| 9 | Submit | Submitted on Devpost, confirmation saved, live URL answering. | NOT TESTED |

---

## Gate 1 findings (spike run 2026-10-27, selfie.jpg, 1040 to 995 units = 45 spent)

| API | Result | Units | Latency (single run) | Notes |
|---|---|---|---|---|
| File create + PUT | OK | 0 | n/a | `POST /s2s/v2.0/file`, PUT to `files[0].requests[0].url` with its headers. `file_id` is 64 chars. |
| Balance | OK | 0 | n/a | `GET /s2s/v1.0/client/credit` returns `results[].amount_dec`, sums to live balance. Drives the live-mode floor. |
| Facial Color Tones | OK | 20 | 26.7 s | Needs `face_angle_strictness_level: "flexible"` for this photo. Returns skin, lip, eyebrow, hair hex, plus `face_quality`. |
| Fitzpatrick | OK | 10 | 6.6 s | Body needs `version: "1.0"` (docs omit it). Returns `results.fitzpatrick_scale` ("II"). |
| Skin Analysis SD | OK | 9 | 3.4 s | Result is a ZIP (signed URL) holding `score_info.json` plus mask PNGs. Per concern: `raw_score`, `ui_score`. Face must span over 60% of image width (crop tight) and be straight-on; `face_angle_strictness_level` does not relax the angle check here. Scores for the test face: oiliness 76, redness 76, pore 80, skin_type Combination, skin_age 30. |
| Makeup VTO brows | OK | 1 each | about 6.3 s | Pattern `Curved1`, `type: "shape"`. Poll `GET .../makeup-vto/{task_id}`, result at `data.results.url`. |
| Makeup VTO lips | OK | 1 each | 6.1 to 8.8 s | Live API wants `style.blendStrength`, `style.innerColorRatio`, `palettes[].transparencyIntensity`, two palettes; docs list different names. |

Task statuses seen: `running`, `success`, `error`. Errors arrive as HTTP 200 with `data.error`. Poll every 2 s.
Result URLs are signed S3 links that expire in 2 hours.

Delete: `POST /s2s/v2.0/task/delete {task_id}` returns 200. The task then answers `InvalidTaskId`, and a new task on the same `file_id` fails with 403. So it removes the uploaded input too, and the "we store nothing" claim holds (`evidence/spike/07-delete-test.json`).

Latency (median of 3): brows 6.3 s, lips 6.8 s. Tone 26.7 s and Fitzpatrick 6.6 s are single runs.

**Gate 1: PASSED 2026-10-27.** Units per consult in the spike: tone 20 + Fitzpatrick 10 + skin 9 + 1 per render.

## Gate 3 evidence: npm test, 2026-10-27

```
 ✓ src/engine/constants.test.ts > constants.ts sources > planted control: the check flags an unsourced constant and accepts sourced ones 7ms
 ✓ src/engine/constants.test.ts > constants.ts sources > declares constants 1ms
 ✓ src/engine/constants.test.ts > constants.ts sources > every export const carries an E-item or ASSUMED on its line or the line above 1ms
 ✓ src/engine/timeline.test.ts > demo claims > a cool dark-brown pigment drifts cool by year 2 (b* lower than at day 0) 14ms
 ✓ src/engine/timeline.test.ts > demo claims > the cool drift holds for natural brow #a17a63: year 2 is cooler than day 0 2ms
 ✓ src/engine/timeline.test.ts > demo claims > the cool drift holds for natural brow #6b4f3f: year 2 is cooler than day 0 1ms
 ✓ src/engine/timeline.test.ts > demo claims > the cool drift holds for natural brow #c9a58c: year 2 is cooler than day 0 1ms
 ✓ src/engine/timeline.test.ts > demo claims > the cool drift holds for natural brow #3b2e28: year 2 is cooler than day 0 1ms
 ✓ src/engine/timeline.test.ts > demo claims > the same pigment plus a 15% warm modifier gives drift none at year 2 1ms
 ✓ src/engine/timeline.test.ts > demo claims > microblading with oiliness 80 recommends powder brows and blurs faster than oiliness 30 1ms
 ✓ src/engine/timeline.test.ts > invariants > powder cool: retention-driven intensity never rises and the band brackets the midpoint 6ms
 ✓ src/engine/timeline.test.ts > invariants > powder fixed: retention-driven intensity never rises and the band brackets the midpoint 2ms
 ✓ src/engine/timeline.test.ts > invariants > microblading oily: retention-driven intensity never rises and the band brackets the midpoint 1ms
 ✓ src/engine/timeline.test.ts > invariants > lips: retention-driven intensity never rises and the band brackets the midpoint 2ms
 ✓ src/engine/timeline.test.ts > invariants > day0 renders the chosen pigment exactly with no drift 1ms
 ✓ src/engine/timeline.test.ts > invariants > the band lighter bound is lighter than the darker bound in L* once colour has faded 1ms
 ✓ src/engine/timeline.test.ts > invariants > lip renders carry transparencyIntensity and no definition; brow renders the reverse 1ms
 ✓ src/engine/timeline.test.ts > invariants > the same inputs give byte-identical output twice 1ms
 ✓ src/engine/rules.test.ts > rule 1: mixing the modifier > returns the pigment unchanged with no modifier or ratio 0 12ms
 ✓ src/engine/rules.test.ts > rule 1: mixing the modifier > moves b* up when a warm modifier is added 4ms
 ✓ src/engine/rules.test.ts > rule 1: mixing the modifier > clamps ratio to 0-0.3 1ms
 ✓ src/engine/rules.test.ts > rule 2: retention > is 1 at day0 and matches E8 at week6 3ms
 ✓ src/engine/rules.test.ts > rule 2: retention > microblading loses a further 20% after year 1 2ms
 ✓ src/engine/rules.test.ts > rule 2: retention > oily skin multiplies by 0.85 from week6 1ms
 ✓ src/engine/rules.test.ts > rule 3: temperature > classes a cool dark brown as cool, the same brown plus warm modifier as neutral, an orange-brown as warm 1ms
 ✓ src/engine/rules.test.ts > rule 4: drift strength > is negative for cool and zero for neutral pigment 1ms
 ✓ src/engine/rules.test.ts > rule 4: drift strength > cool pigment drifts less on cool skin 1ms
 ✓ src/engine/rules.test.ts > rule 4: drift strength > warm modifier lowers a cool drift smoothly 1ms
 ✓ src/engine/rules.test.ts > rule 5: sharpness > microblading blurs faster on oily skin 1ms
 ✓ src/engine/rules.test.ts > rule 5: sharpness > oily skin does not blur powder brows faster; they start soft 0ms
 ✓ src/engine/rules.test.ts > rule 5: sharpness > never rises over time 1ms
 ✓ src/engine/rules.test.ts > rule 6: lips > transparency rises as colour fades and stays within 0-100 2ms
 ✓ src/engine/rules.test.ts > rule 7: advice > recommends powder brows for microblading on oily skin, with the reason 4ms
 ✓ src/engine/rules.test.ts > rule 7: advice > keeps microblading on dry skin 0ms
 ✓ src/engine/rules.test.ts > rule 7: advice > large pores also trigger the powder recommendation 0ms
 ✓ src/engine/rules.test.ts > rule 7: advice > flags dark natural lips for neutralisation first 3ms
 ✓ src/engine/rules.test.ts > rule 7: advice > flags Fitzpatrick IV-VI for a patch test 1ms
 ✓ lib/config.test.ts > defaults to live 4ms
 ✓ lib/config.test.ts > reads replay 1ms
 Test Files  4 passed (4)
      Tests  39 passed (39)
```

## Gate 4 evidence, 2026-10-27

- Contract suite `src/youcam/contract.test.ts` runs the same assertions on the replay adapter and on the real adapter (fake network answering from the same recorded fixtures). 66 tests pass.
- One live consult through the real adapter (`LIVE_TEST=1 npx vitest run tests/live`, receipt `evidence/live-consult-receipt.json`): upload, 3 analyses in parallel, 5 timeline renders + 2 band renders in parallel, then delete. Ledger tone 20 + Fitzpatrick 10 + skin 9 + renders 7 = **46 units**; the account balance fell 995 to 949, matching.
- Latency of that consult: read 12.9 s, total 50.6 s. The 7 parallel renders take about 38 s together, so Gate 5's 60 s budget is tight. Watch it in Phase 5.
- Skin Analysis scores are higher = healthier (docs; ui_score is deliberately inflated). The adapter maps oiliness, pore and redness to engine severity as 100 - raw_score, and floors oiliness at 70 when the whole-face skin type is Oily.
