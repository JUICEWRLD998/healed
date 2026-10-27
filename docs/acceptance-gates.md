# Acceptance gates

Status values: PASSED, NOT TESTED, FAILED. Update with evidence the day a gate changes.

| Gate | Phase | Pass condition | Status |
|---|---|---|---|
| 0 | Skeleton | App builds, `/api/health` answers, key absent from client bundle. Deployed URL deferred to the end of the build. | PASSED (local) 2026-10-27 |
| 1 | Access spike | All four APIs succeed from server code, raw JSON saved, branch written, units per consult measured. | PASSED 2026-10-27 |
| 2 | Build contract | PRD, repo CLAUDE.md, this file, SUBMISSION.md exist; CI runs typecheck and tests, green. | NOT TESTED (CI run pending) |
| 3 | Engine | All engine tests green; `npm test` output pasted here. | NOT TESTED |
| 4 | Adapter | Contract test passes on both adapters; units per live consult recorded. | NOT TESTED |
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
