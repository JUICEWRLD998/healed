# Claims

Each README claim and the command that reproduces it.

| Claim | Command |
|---|---|
| Key absent from client bundle | `grep -r YOUCAM_API_KEY .next/static` returns nothing |
| Timeline (engine output) is on screen about 22 s after upload in a live consult. UNVERIFIED beyond two samples | drive the flow in Chrome against `next start` with a key in `.env`, see Gate 5 in `docs/acceptance-gates.md` |
| Whole flow works with no key in replay mode | `HEALED_MODE=replay npm start`, upload any JPEG |

| Five break-it cases return their stated outcome (local only) | `npm test -- src/judges`, then open `/judges` and press Run on each |
| Two-face photo gives "One face per consult". UNVERIFIED: upstream code never captured | none yet; needs a live two-face response |
