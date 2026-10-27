# PICK: YouCam Skin AI & eCommerce VTO (deadline 2026-11-02 11:45 ET = 16:45 UTC)

## Blind cards (choose cold before reading the verdict)

```
X   USER   a PMU artist and her client at the consult, before a $400-800 procedure that cannot be undone
    DOES   one selfie; renders the client's own brows or lip blush at day 0, healed, year 1 and year 3, then shows the
           pigment correction that stops a grey-blue or orange drift
    NOT    pigment apps mix colours with no face and no time; healed galleries show strangers
    ONLY   skin oiliness, Fitzpatrick type and her natural brow/lip colour set the try-on's colour, intensity and
           sharpness at each time step
    PAYER  artists (about $29/month), who already pay GBP 39/month for pigment guides
    WOW    her year-3 brows go grey-blue on her own face; one tap adds a warm modifier; they come back soft brown

Y   USER   a brand PR team about to ship 200 foundation PR boxes to creators
    DOES   sends each creator a consent link; the selfie picks the shade and shows it on them; outputs the ship list
    NOT    seeding platforms pick shades by hand; the sponsor's shade finder is a shopper widget
    ONLY   Facial Color Tones + Makeup VTO foundation give each creator a proof before the box ships
    PAYER  brand influencer teams, who already pay for seeding platforms and for boxes that never get posted
    WOW    a 12-creator list; three rows turn red: a 220N about to go to a 450W creator
```

## Verdict: clear winner X, "Healed"

X leads by more than 10% on the equal-weight table, holds RETELL, SHOWCASE and PAYER, and has a spike (no entry in this
field or in Devpost's archive renders healing over time). Y came second: a real pain, but the demo is a shade match with
a workflow around it, and the sponsor already ships a shade finder.

**On "90% to win": no idea gets there.** About 250-300 entries are likely (238 last time), and last edition's winner had 22
prior wins. An honest estimate for X is about 15% for 1st (decomposition below), higher for a top-3 place. Execution and
the video decide the rest.

## The pick

**Healed**. Tagline: *See your brows healed before the needle.*
One-liner: a consult tool for permanent-makeup artists that shows a client her own brows or lip blush at day 0, healed,
year 1 and year 3, from one selfie, and the pigment fix that keeps them from turning grey.

### 20-second wow, beat by beat
1. Bare-brow selfie. The artist picks "powder brows" and a cool dark-brown pigment.
2. A timeline scrubber renders on her face: day 0 (dark and crisp), week 6 (about half as strong), year 2 (ashy grey-blue,
   softer edges, because her T-zone oiliness is high).
3. A chip reads: "cool pigment on warm skin: grey-blue risk". The artist taps "+ warm modifier 15%". Year 2 re-renders soft brown.
4. The consult card: technique (powder, not microblading: oily skin blurs strokes), pigment recipe, the timeline and the
   client's consent tick.

### 90-second demo outline
0-10 s the grey-blue brow photo (E1) and the line "removal cost over $1,000" | 10-25 s guided selfie, three analyses
named on screen | 25-55 s timeline, the drift, the modifier fix | 55-70 s lip blush: dark natural lips flagged for
neutralisation first, sheer ombré healed preview | 70-85 s consult card and consent | 85-90 s "a judge can try it with
their own face" plus the URL.

### How it works (the load-bearing YouCam calls, VERIFIED in the docs)
1. One upload (`/s2s/v2.0/file`), one `file_id` reused by every task.
2. **Skin Analysis** (oiliness, pore, redness, skin_type) decides technique and how fast stroke sharpness decays.
   **Fitzpatrick Skin Type** (I-VI) sets the colour-shift rule and a patch-test prompt. **Facial Color Tones** returns
   the natural `eyebrow_color`, `lip_color`, `skin_color` and `hair_color` hex.
3. A deterministic healed model in CIELAB (our code, tested): retention band per time step (about 50% lighter by week 4,
   E8), warm or cool drift by pigment temperature and skin type (E5), sharpness decay scaled by oiliness (E4). It outputs
   a low and a high estimate, never one confident answer. The AI never chooses colours; code does.
4. **Makeup VTO** (1 unit each) renders each time step: eyebrows `color` with hex, `colorIntensity`, `definition`; lips
   `lip_color` with `sheer`, `transparencyIntensity`, `ombre`.
5. Nothing is stored server-side by default. The artist saves a consult only with the client's consent tick.
Cost per live consult: about 12 (skin, SD tier, per Aloud's write-up, UNVERIFIED) + 10 + 20 + about 8 renders = 50 units,
so 1,000 free units cover about 20 live consults. Cache by content hash, and ship a labelled Replay of real recorded runs.

### Moats (two a rival's model cannot produce from the event page)
- **Domain depth from real practitioners** (E1-E8): healed-true-to-tone, warm modifiers, oily-skin blur, lip neutralisation.
  The live field (E12) shows where a model fed only the event page lands: trackers, routines, shade matches.
- **Skin AI drives the try-on's parameters causally.** It answers WANT-3 ("both capabilities work as one") literally, and
  the parameters exist (E9).
- Empty cell verified: 0 PMU entries among 201 YouCam projects; Devpost "microblading" has 1 project ever (E12, E13).
- To build: a calibration page comparing our healed estimates with public fresh-vs-healed photo pairs. That gives the one
  hard number ShadeSpan proved this panel rewards.

### The company
- Payer: PMU artists and studios, $29/month. Anchor: they pay GBP 39/month for a pigment-guide membership (E6).
  Second payer: pigment brands, as a white-label "healed preview" for their own lines.
- First 10 users: PMU artist Facebook groups, Instagram DMs to artists who post healed results, r/microblading.
  He has no warm channel here; this is cold outreach. Market size is UNVERIFIED (2-minute check: "permanent makeup market size").
- Competitor: PMU Pro (free, colour mixing, no face, no time) and static healed galleries. Edge: her face, over time.
- Why now: Fitzpatrick (May 2026), colour-tone hex outputs and Makeup VTO's definition, sheer and ombré controls are now
  all in one API at 1 unit per render.
- 10x lever: every saved consult with a later healed photo becomes calibration data, so the estimates sharpen per pigment.

### Build contract
- MVP: powder brows + lip blush; guided selfie; 3 analyses; healed model with tests; 5-step timeline; modifier control;
  consult card + consent; live mode (judge's own selfie) and labelled Replay; mobile-first web, deployed.
- Stretch: microblading stroke patterns; calibration page; the artist's own pigment library; an agent copilot via
  YouCam MCP or Skills that drafts aftercare and the 6-week touch-up plan (AI proposes, code decides; WANT-5).
- NOT BUILDING: booking, payments, accounts beyond a local artist profile, medical claims, removal simulation.
- Thin path first: selfie, then Facial Color Tones, then one brow render at the healed hex.

### Top 5 risks and fallbacks
1. A try-on brow looks like makeup, not a tattoo. Fallback: lead with lip blush (sheer + ombré reads naturally) and powder brows.
2. "How do you know it heals like that?" Show a band, cite each rule, publish the calibration, let the artist override.
3. Unit budget. Cache, Replay, the social bonus (+500 x 2), and no re-analysis on a timeline scrub.
4. A judge's selfie has filled-in brows or glasses. The capture guide asks for bare brows; the analysis flags filled brows.
5. Video rules: own face or a consenting volunteer, no pigment brand names or third-party music.

### Decisive unknown and both branches
Does Makeup VTO's brow `definition` and low `colorIntensity` look like healed PMU on a real face? (Access spike: three
calls on his own selfie after the redeem code arrives.)
- Looks right: brows lead the demo, lips second.
- Looks stylised: lip blush leads, brows shown as powder only. If both fail, switch to Y.

### Side tracks (G15)
None worth adding. One prize per team; Women in Tech and Rising Star do not apply to him. The social bonus is units only.

### P(1st)
P(eligible) 0.95 x P(core runs end to end) 0.85 x P(a judge gets it in 20 s) 0.8 x P(beats the strongest rival on
idea + impact) 0.3 x P(survives the judge's own selfie) 0.8 = **about 0.15**.
Weakest factor: beating the strongest rival. The field is full of evidence-heavy entries, so polish and the video carry it.

### Runner-up and switch
Y, Seedright. Switch trigger: the access spike shows neither brows nor lips can pass as healed PMU.
Last day to switch: 2026-10-29.

## After GO
1. Redeem code, API key, access spike (3 calls). 2. Build contract files (PRD, repo CLAUDE.md, acceptance gates).
3. Thin path, then the healed model with tests, then UI (ui-studio), then the video (demo-video). He presses submit.
