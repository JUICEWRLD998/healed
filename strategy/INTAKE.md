# INTAKE: YouCam API Skin AI & eCommerce VTO Hackathon (Perfect Corp, Devpost)

Read 2026-10-27 from the event page, `/rules` and `/resources` via curl (Devpost blocks WebFetch, 403).
https://youcam-api-skin-ai-ecommerce.devpost.com/

## Facts (VERIFIED, rules page)
- Submission deadline: **2026-11-02 11:45 ET** (16:45 UTC, 17:45 WAT). Judging 11-03 to 11-20. Winners around 11-24.
- Registered: 1,328. The previous edition (youcam-api.devpost.com, Jul-Aug 2026) had 1,273 registered and **238 submissions**.
- Eligibility: age of majority. Nigeria is NOT on the excluded list (Italy, Brazil, Vietnam, Quebec and others are).
- Must: integrate at least one YouCam API into a working web or mobile prototype with consumer or retail value; public repo
  (or private and shared with the address on the page); text description; screenshots; a **1-3 min** YouTube video that
  names the YouCam API used and shows the app running on its device; free test access until judging ends.
- Winners must do an exit interview and agree to a blog article. A team can win at most one prize.
- Existing projects are allowed only if significantly updated after 2026-09-29.
- Units: 1,000 free on signup (redeem code by email), plus 500 per qualifying social video, at most 2 platforms.

## Rubric (VERIFIED): stage 1 pass/fail on theme and API use, then 4 criteria weighted EQUALLY
1. Technological Implementation: "How thoroughly and skillfully does the project integrate at least one ... YouCam API ...
   Does the code reflect genuine effort and a working, non-trivial implementation?" (first tie-breaker)
2. Design: "a complete, coherent product experience, not just a technical proof of concept"
3. Potential Impact: "a credible, specific case for solving a real problem for a real audience"
4. Quality of Idea: "a creative, non-obvious use ... genuine understanding of the problem space"

## Prize map
1st $2,500 | 2nd $1,000 | 3rd $500 | Women in Tech $1,000 | Rising Star (student, .edu email) $1,000.
For him: placements only. He is in national service, so Rising Star is likely ineligible (confirm).

## Panel
Listed judge: Wendy Yen (Perfect Corp). Sponsor panel; the rules allow more unlisted judges. Panel type: sponsor devrel/marketing.

## WANT map (quoted)
- WANT-1 "fresh, unexpected solutions to real-world pain points in beauty, fashion, or eCommerce, not surface-level wrappers"
- WANT-2 Skin AI: "they wonder right before a purchase, right after a bad breakout, or right when they're standing in front of
  a mirror ... Build something that meets that moment ... know exactly what to do next"
- WANT-3 VTO: "what someone wears and how their looks are part of the same self-image ... what's possible when both
  capabilities work as one"
- WANT-4 "intuitive enough that a first-time user instantly grasps its value"
- WANT-5 "real-world, scalable products, including cutting-edge Agentic AI workflows"

## Winner DNA (previous edition, VERIFIED project pages)
- 1st **Aloud**: skin AI a blind shopper can use with the screen off. Legal grounding (ADA suits, EU Accessibility Act), names
  a sponsor gap (no accessibility statement), uses YouCam MCP and Skin Tone Analysis, a kill experiment on a real iPhone.
  The builder lists 22 hackathon wins.
- 2nd **ShadeSpan**: points Apparel VTO at the merchant's catalogue, grades each garment on its worst skin tone with
  CIEDE2000 and WCAG maths, and leads with one number (14.3% of garments pass on all six tones).
- 3rd-5th **CASTING** (catalogue representation score), **KeepMe** (identity drift in VTO), **ConfidFit** (Shopify VTO).
- Pattern: a specific, real audience; the API used as an instrument and not a filter; published science; one hard number;
  honest limits. Three of the five are merchant-side.

## API surface (VERIFIED docs.perfectcorp.com, v1.16, 2026-09-24)
60+ endpoints across skin, makeup, hair, fashion, jewellery, image and video. Load-bearing for the pick:
- Facial Color Tones Analyzer: `skin_color`, `lip_color`, `eyebrow_color`, `hair_color` as hex, plus eye colour. 20 units.
- Fitzpatrick Skin Type Analysis (added 2026-05-28): type I-VI. 10 units.
- Skin Analysis v2.1: oiliness, pore, redness, skin_type (t_zone/u_zone in HD), with masks and ui_score/raw_score.
- Makeup VTO, 1 unit: eyebrows (hex, colorIntensity 0-100, pattern, thickness, curvature, **definition 0-100**);
  lip_color (hex, colorIntensity, texture incl. **sheer**, transparencyIntensity, style full/**ombre**/twoTone). Several
  effects in one call.
- Changelog (last 90 days): YouCam Skills (09-04), MCP Capabilities (08-11), Hair Style VTO hair_color (09-24),
  Shoes VTO V3, Nail Transfer. AI Clothes "multi-person detection" is an error filter, not group try-on.

## Open questions
- Has he received the redeem code, and does the API key work? The access spike needs it.
- Age of majority: yes. Student status: probably no (affects only Rising Star).
