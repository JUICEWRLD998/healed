# Decisions

Newest first. Each entry: measurement, rejected alternative, file.

## 2026-10-28 Progressive render: engine plan first, one request per render
- Measurement: live consult read 36 s plus 7 renders 38 s was 74 s, over the 60 s Gate 5 budget. Showing the engine timeline right after the read puts it on screen at about 22 s.
- Rejected: one request that returns all 7 renders (blocks the whole timeline on the slowest render and risks the serverless time limit); speculative pre-rendering before the artist chooses (spends units on choices never made).
- File: `app/api/render/route.ts`, `app/api/frame/route.ts`, `app/flow.tsx`.

## 2026-10-27 Stack pinned
- Measurement: versions from `npm view` on 2026-10-27.
- Rejected: Tailwind (house rule), create-next-app (non-empty dir, unpinned).
- File: `package.json`.
