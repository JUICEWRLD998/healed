# Healed: repo instructions

`HEALED_PRD.md` is the source of truth. `implementation.md` holds the phases. Do not re-derive requirements from memory.

## Resolved decisions
- Branch A: brows lead, lip blush second (Phase 1, `DECISIONS.md`).
- Stack: Next 16.4.3, React 19.3.1, TypeScript 7, CSS Modules + tokens in `src/styles/tokens.css`, `motion` imported
  from `motion/react`, `culori` for colour maths, `vitest`. No Tailwind. Exact versions are pinned; do not bump.
- Vercel deploy happens at the end of the build, not before.
- Work on a branch per phase (`phase-N/name`), commit in small steps, merge to `main` with `--no-ff`, push both.

## Invariants
- The API key lives only on the server. Every YouCam call goes through `src/youcam/` and nowhere else.
- The healed model is deterministic: same inputs, same output, no model and no randomness. Every constant in
  `src/engine/constants.ts` carries an E-item or the label `ASSUMED`.
- Every estimate shows a band (lighter and darker bounds), never one confident answer.
- Every screen shows whether its renders are Live or Replay.
- No face image is stored on our server and none is committed. `evidence/spike/*.jpg` and `selfie*` are git-ignored.
  Uploaded files are deleted from YouCam after the consult with `POST /s2s/v2.0/task/delete {task_id}`.
- Cosmetic language only. No medical claims. Fitzpatrick drives pigment choice and a patch-test prompt.
- No brand names for pigments or products in code, UI, README or video.

## Honesty rules
- Use LIVE / NEXT / NOT LIVE everywhere. Every number in README, UI and video comes from `evidence/`.
- Our own tests are feedback, not traction.
- A claim without a reproducing command goes in `CLAIMS.md` as UNVERIFIED or does not ship.

## YouCam API facts measured in Phase 1 (docs disagree with the live API in places)
- Base `https://yce-api-01.makeupar.com`, Bearer key. Upload: `POST /s2s/v2.0/file`, then PUT the bytes to `requests[0].url` with its headers.
- Errors arrive as HTTP 200 with `data.error`. Poll every 2 s until `task_status` is `success` or `error`.
- Tone: `face_angle_strictness_level: "flexible"` helps. Fitzpatrick body needs `version: "1.0"`.
- Skin Analysis: the face must span over 60% of the image width and be straight-on. The result is a ZIP with `score_info.json`.
- Lip VTO needs `style.blendStrength`, `style.innerColorRatio`, `palettes[].transparencyIntensity`, two palettes.
- Brow intensity and definition change the render only a little: carry AGE in the `color` hex.
- Renders smooth skin. Result URLs are signed and expire in 2 hours.
- Measured units: tone 20, Fitzpatrick 10, skin 9, render 1. One full consult is 46 (7 renders), about 51 s wall-clock.
- Skin scores are higher = healthier. Engine severity = 100 - raw_score (use raw_score, not the inflated ui_score).

## Framework and shell gotchas
- `next build` rewrites `tsconfig.json`. Commit the normalised version.
- App Router: `params` and `searchParams` are Promises in Next 16; await them.
- Never put the key in `NEXT_PUBLIC_*`. Gate 0 check: `grep -r YOUCAM_API_KEY .next/static` returns nothing.
- Git Bash on Windows rewrites a leading `/` in arguments. Test regexes without a leading slash.
- A stale `next start` can hold a port and serve dead asset hashes. Use a fresh port when a built page looks unstyled.
- Never add a stray `cat >> /dev/null` to a shell command: it waits on stdin forever.
