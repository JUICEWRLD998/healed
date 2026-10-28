# Claims

Each README claim and the command that reproduces it.

| Claim | Command |
|---|---|
| Key absent from client bundle | `grep -r YOUCAM_API_KEY .next/static` returns nothing |
| Timeline (engine output) is on screen about 22 s after upload in a live consult. UNVERIFIED beyond two samples | drive the flow in Chrome against `next start` with a key in `.env`, see Gate 5 in `docs/acceptance-gates.md` |
| Whole flow works with no key in replay mode | `HEALED_MODE=replay npm start`, upload any JPEG |

