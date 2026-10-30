# Claims

Each README claim and the command that reproduces it.

| Claim | Command |
|---|---|
| Key absent from client bundle | `grep -r YOUCAM_API_KEY .next/static` returns nothing |
| Timeline (engine output) is on screen about 22 s after upload in a live consult. UNVERIFIED beyond two samples | drive the flow in Chrome against `next start` with a key in `.env`, see Gate 5 in `docs/acceptance-gates.md` |
| Whole flow works with no key in replay mode | `HEALED_MODE=replay npm start`, upload any JPEG |

| `/judges` break-it cases return their stated outcome (local, Replay) | `HEALED_MODE=replay npx next start -p 3417`, then `node scripts/gate7-drive.cjs 3417` |
| Two faces returns "One face per consult". UNVERIFIED: `error_multiple_faces` is a guessed code, not seen from the live API | `npx vitest run lib/breakit.test.ts` covers the mapping only |
| Frozen production run. UNVERIFIED: not yet captured, needs a key and a consenting face | none yet |
| Calibration is NOT done: no measured pair set exists, so no accuracy number is claimed | `cat evidence/calibration/pairs.json` returns `[]`; `/calibration` says "No calibration number yet" |
