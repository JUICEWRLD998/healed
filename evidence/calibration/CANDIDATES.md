# Calibration candidates (search pass 2026-10-30)

Source URLs and stage labels only. No image is stored or republished, and nothing here is measured.
Result of the pass: about 8 same-procedure fresh and healed pairs, all from ONE publisher, so no number is reported.
`pairs.json` stays empty. See Gate 8 in `docs/acceptance-gates.md`.

## Why this set cannot calibrate the engine

- One publisher (a pigment brand's own case studies, Tina Davies). Cases are chosen to show success, and one filename says "Facetune", so some photos are retouched.
- Healing time is stated for only one pair (Jasmine, 6 weeks). The rest say "healed" with no age, so the engine step to compare against (week 6, year 1, ...) cannot be fixed without guessing.
- Fresh and healed photos differ in camera, angle and light. A raw colour difference mostly measures that, so a skin-referenced measurement would be needed.
- Five of the eight are lips. The product leads with brows, and only two brow pairs exist here.
- The pairs share one pigment line, so they cannot test the "cool pigment on warm skin" drift rule.

## Pairs found (fresh and healed of the same procedure)

| Client label | Service | Fitzpatrick | Healed age | Page |
|---|---|---|---|---|
| Bryanna, Toffee | combination brows | 1 | not stated | https://uk.tinadavies.com/blogs/case-studies/case-study-super-fair-skin-colour-selection |
| Megan | combo brows (microblading + shading) | 2 | day 30 | https://uk.tinadavies.com/blogs/news/microblading-my-healing-journey |
| Jasmine | lip blush | 3 | 6 weeks | https://uk.tinadavies.com/blogs/case-studies/case-study-lip-blushing-with-magnums |
| Paula | lip blush | 2/3 | not stated | https://uk.tinadavies.com/blogs/case-studies/case-study-achieving-maximum-lip-colour-retention |
| Sara (Fitzpatrick 4 case) | lip blush | 4 | not stated; a 1.5-year photo also exists | https://uk.tinadavies.com/blogs/case-studies/case-study-healed-lips-on-fitzpatrick-4-client |
| Ramona | lip blush (scar contour) | 1 | not stated | https://uk.tinadavies.com/blogs/case-studies/challenging-lips-case-studies |
| Mei | lip blush | 3 | not stated | same page |
| Stephanie | lip blush | 1-2 | not stated | same page |

## Not usable

- Case study 9 (18-month microblading refresh): the "fresh" photos come after the refresh and the "healed" ones before it, so the order is reversed.
- Areola case studies: out of scope.
- RealSelf reviews: the fetch returned 403.
- Studio healing guides (Reverie, Isa Skin Care, Brow Clinic NY): no paired fresh and healed photos of one named client.
- Unchecked leads on the same publisher: Men's Lip Blushing, Ashy Brow Colour Correction, Boy Brows (`https://uk.tinadavies.com/blogs/case-studies?page=2`).

## What would make it usable

At least 10 pairs from 3 or more independent sources, each with a stated healed age, plus a skin-referenced extractor. The extractor, scorer, split rule and positive control are ready in `src/calibration/`.
