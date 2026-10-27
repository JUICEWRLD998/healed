# Acceptance gates

## Gate 1 findings (spike run 2026-10-27, selfie.jpg, 1040 to 1004 units = 36 spent)

| API | Result | Units | Latency (single run) | Notes |
|---|---|---|---|---|
| File create + PUT | OK | 0 | n/a | `POST /s2s/v2.0/file`, PUT to `files[0].requests[0].url` with its headers. `file_id` is 64 chars. |
| Balance | OK | 0 | n/a | `GET /s2s/v1.0/client/credit` returns `results[].amount_dec`, sums to live balance. Drives the live-mode floor. |
| Facial Color Tones | OK | 20 | 26.7 s | Needs `face_angle_strictness_level: "flexible"` for this photo. Returns skin, lip, eyebrow, hair hex, plus `face_quality`. |
| Fitzpatrick | OK | 10 | 6.6 s | Body needs `version: "1.0"` (docs omit it). Returns `results.fitzpatrick_scale` ("II"). |
| Skin Analysis SD | FAIL | 0 | 3.3 s | `error_large_face_angle` even with strictness flexible. Retry with a straighter photo. |
| Makeup VTO brows | OK | 1 each | about 6.3 s | Pattern `Curved1`, `type: "shape"`. Poll `GET .../makeup-vto/{task_id}`, result at `data.results.url`. |
| Makeup VTO lips | OK | 1 each | 6.1 to 8.8 s | Live API wants `style.blendStrength`, `style.innerColorRatio`, `palettes[].transparencyIntensity`, two palettes; docs list different names. |

Task statuses seen: `running`, `success`, `error`. Errors arrive as HTTP 200 with `data.error`. Poll every 2 s.
Result URLs are signed S3 links that expire in 2 hours.

Open: skin analysis on a straight photo, delete-with-resources endpoint, median of 3 latencies.
