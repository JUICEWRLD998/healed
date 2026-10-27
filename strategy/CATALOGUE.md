# CATALOGUE: YouCam Skin AI & eCommerce VTO, decide pass 2026-10-27

Inputs gathered here that a rival's model was not given: the full field sweep (I1), the API's real parameters (I2),
the previous panel's five winners read in full (I3), and practitioner pain from a domain nobody in the field touched.

## F1 Evidence bank
| # | Kind | Item | Source |
|---|---|---|---|
| E1 | PAIN | r/microblading, top post: black-brown brows went "a blurry grey-blue" within about six months, despite good reviews | https://t.sudovanilla.org/r/microblading/comments/1gndvjb/lwae2ia |
| E2 | PAIN | Same thread: brows faded grey-blue; removal "has cost over $1,000"; the ink later turned reddish | https://t.sudovanilla.org/r/microblading/comments/1gndvjb/lwfn4aa |
| E3 | PAIN | A woman describes "the exact moment" she regretted her lip tattoo | https://www.aol.com/articles/woman-shares-exact-moment-she-230000698.html |
| E4 | PAIN | PMU artist to CBC: "With oily skin, the strokes will blur and they won't heal crisply" | https://amp.cbc.ca/life/style/a-guide-to-the-popular-eyebrow-treatment-options-available-now-1.5253268 |
| E5 | WARN | A pigment maker's own blog: "Why PMU brows turn orange, ashy or pink"; cool pigments heal ashy/grey, warm ones orange | https://permablend.com/blogs/blog/why-pmu-brows-turn-orange-ashy-or-pink-and-how-to-prevent-unwanted-color-shifts |
| E6 | PAYER | Artists pay for colour knowledge: Tina Davies pigment guide with healed galleries, membership GBP 39/month; Perma Blend Fitzpatrick course EUR 99; SPCP colour book USD 35 | https://tinadavies.com/products/tina-davies-pigment-guide-healed-results-brow-color-volume-1 |
| E7 | FIELD | Nearest incumbent: PMU Pro (free iOS) mixes pigments by skin tone; it has no healed-result simulation; no other simulator found | https://mwm.ai/apps/pmu-pro/6503597523 |
| E8 | DATA | Practitioner sources: colour becomes about 50% lighter over the first four weeks; powder brows last longer than microblading | https://library.peoplespharmacy.com/microblading |
| E9 | NEW | Facial Color Tones returns brow, lip, skin and hair hex; Fitzpatrick I-VI added 2026-05-28; Makeup VTO exposes brow `definition`, lip `sheer` and `ombre` at 1 unit | https://docs.perfectcorp.com/release/changelog |
| E10 | PAIN | Lancome sent a creator with 2.5M followers a too-light PR shade (803k views); Youthforia's darkest shade was the backlash | https://www.glossy.co/beauty/lancome-sparks-50-shades-of-confusion-over-foundation-relaunch |
| E11 | FIELD | Previous panel's picks: Aloud 1st, ShadeSpan 2nd, CASTING, KeepMe, ConfidFit 3rd-5th | https://youcam-api.devpost.com/project-gallery |
| E12 | FIELD | 201 YouCam projects outside last gallery (Devpost search 2026-10-27): 15+ "is my skincare working" trials, 6 store-catalogue skin matches, 6 colour-season apps, 6 salon/hair consults, 3 wedding, 4 hair-loss/wig, 5 merchant content generators, OneDress (bridesmaids x skin tones), 0 permanent makeup | scratchpad `field.json` |
| E13 | L0 | Devpost "microblading": 1 project ever (fleek, stroke design); "lip blush": 17, none simulate healing | judge-memory.mjs, 2026-10-27 |

Sweep notes: Devpost search is keyword, not mechanism, and misses drafts not yet public. Control: "chatbot" = 26,334
(probe works). Outside models: rival-run selftest NOT READY (codex 401 expired key, gemini no auth), so the wall is SEMI-COLD.

## F2 The modal wall (SEMI-COLD, written before cards)
- L1 naive: selfie skin scan to routine to cart; foundation shade match; full look (makeup + outfit + hair) on your photo;
  AI stylist chat; smart mirror.
- L2 contrarian: shop your own wardrobe first; climate- or cycle-aware skincare; VTO for resale listings; influencer look on
  you; ingredient safety checker.
- L3 informed (rubric + last winners): measured "is it working" trial with a noise floor; catalogue x skin-tone audit
  (ShadeSpan clone); accessibility for blind or low-vision shoppers (Aloud clone); identity-drift guard (KeepMe clone);
  Shopify VTO app (ConfidFit clone); store-stock-only skin match.
- Crowded in the live field (E12): salon consults, wedding looks, wigs, merchant content generation, colour seasons.
- Sponsor ships: shade finder, skin analysis kiosk, MCP server, YouCam Skills.

## F3-F4 Cards and fates
```
#1 Healed       cue QUOTE E1/E4 + NEW E9   WANT-2, WANT-3   shape: B2B2C tool
USER   PMU artist and client at the consult, before a $400-800 irreversible procedure (E1: "blurry grey-blue")
DOES   renders the client's brows or lip blush at day 0, healed, year 1, year 3 from her own selfie, then the pigment fix
NOT    PMU Pro mixes colours with no face and no time (E7); healed galleries show other people's faces
ONLY   skin oiliness, Fitzpatrick type and lip/brow hex set the VTO's definition, colour and sheer per time step
PAYER  artists, about $29/month; they already pay GBP 39/month for pigment guides (E6)
WOW    year-3 brows turn grey-blue on her face; tap "+ warm modifier"; they re-render soft brown
```
Fate: FINALIST.

#2 Regrowth (NEW: Hair Style VTO hair_color, 09-24): bleach job at week 0/4/8/12 with roots and brassy fade.
Fate: PARKED. Same time-axis mechanism as #1; kept as the company's second product, not a second finalist.

```
#3 Seedright    cue QUOTE E10   WANT-1   shape: B2B tool
USER   brand PR team about to ship 200 foundation PR boxes (E10: Lancome sent a creator a too-light shade)
DOES   sends each creator a consent link; their selfie gives tone, picks the shade, renders it on them; outputs the ship list
NOT    seeding platforms (GRIN, CreatorIQ) pick shades by hand; the sponsor's shade finder is a shopper widget
ONLY   Facial Color Tones + Makeup VTO foundation is the proof each creator sees before the box ships
PAYER  brand influencer teams, who already pay for seeding platforms and products that never get posted
WOW    a 12-creator list; three rows flip red: "you were about to send 220N to a 450W creator"
```
Fate: FINALIST (runner-up).

#4 Tint (COLLIDE: paint-store tinting) custom-blend foundation formula from skin hex. KILL WALL: the demo is an L1 shade match.
#5 Proposal (INVERT: try-on for the wearer, here for the buyer): engagement ring on the partner's hand from a photo.
   Survivor; scored low. The hand-photo pose is friction, jewellers already run 3D viewers, and consent is awkward.
#6 Mirror Draft (ASK WANT-3): gender-affirming presentation studio (clothes + makeup + hair as one self-image).
   Survivor; best theme fit. FLAG G4-personal: Nigeria's SSMPA 2014 and the blog/exit-interview obligation put his
   name on it publicly. His call; not a finalist by default.
#7 Open Day (PAYER: cabin-crew coaching): rehearse an airline-style grooming standard (bun, regulation lip, uniform).
   Survivor; weak commerce value, and trademark care is needed in the video.
#8 Shade-range gap audit (DATA: foundation shade datasets). KILL WALL: ShadeSpan, CASTING and OneDress own it (E11, E12).
#9 Purge Map (QUOTE: "purging or breaking out?"): acne mask zones vs your usual zones. KILL WALL: 15+ trial trackers, same demo.
#10 Bridal party colour across bridesmaids. KILL L0: OneDress already in the field (E12).
#11 Graft (hair-transplant graft estimate from Hair Density). KILL G0: surgery, no WANT points there.

Count rules: verifier family 0 of 2 finalists; locale 0; security 0. Cue families used: QUOTE, NEW, COLLIDE, INVERT, ASK,
PAYER, DATA. Shapes: B2B tool, consumer app, B2B2C.

## F5 Score (equal weights, as published; 1-5)
| # | Tech | Design | Impact | Idea | Total | RETELL | SHOWCASE | PAYER | SPIKE |
|---|---|---|---|---|---|---|---|---|---|
| 1 Healed | 5 | 4 | 4 | 5 | 18 | Y | Y | Y | Idea: nobody renders healing over time |
| 6 Mirror Draft | 4 | 4 | 4 | 4 | 16 | Y | ? | N | theme fit |
| 3 Seedright | 4 | 4 | 4 | 3 | 15 | Y | Y | Y | none |
| 2 Regrowth | 4 | 4 | 3 | 4 | 15 | Y | Y | Y | (same mechanism as #1) |
| 5 Proposal | 3 | 4 | 3 | 4 | 14 | Y | Y | Y | none |
| 7 Open Day | 3 | 4 | 3 | 3 | 13 | Y | N | Y | none |

#1 leads #6 by 12.5%, and #6 fails PAYER and carries a personal risk, so no round 2 trigger fired.
The table is a filter, not an oracle: an LLM ranker agrees with experts about as often as experts agree with each other.
