# Animated Happy Diwali Status & Festive Community Experience

Deliver an interactive **Animated Happy Diwali Video Status** inside the **Admin Status Circle** on the Community page, complete with live particle fireworks, glowing diyas, a JEE motivation message, a one-click **"Wish Happy Diwali"** reaction button for students, and a subtle festive Diwali header glow.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed User Preferences (Phase 1):**
> - **Placement & Format**: Animated Happy Diwali video experience inside the **Admin Status Circle** at the top of the Community feed.
> - **Theme & Copy**: **Happy Diwali wishes paired with a high-energy JEE aspirant motivation quote** (connecting the festival of lights with lighting up their IIT/NIT dream).
> - **Interactive Features**:
>   1. **Glowing Diyas & Fireworks Animation** inside the full-screen story viewer.
>   2. **One-Click "Wish Happy Diwali" Reaction Button** for students with live celebration burst and counter.
>   3. **Festive Diwali Header Glow** on the Community page status bar.
> - **Zero Egress Bandwidth Strategy**: Render the Diwali animated video status using a smooth 60fps HTML5 Canvas + SVG procedural animation (sky lanterns, golden sparklers, multi-burst fireworks, and flickering earthen diyas with optional festive chime audio) so every student gets an instant 0ms-loading HD video status experience with **0 MB of Supabase video egress**.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Displays a pinned, golden-ringed **"Happy Diwali" Admin Status Circle** at the top of the Community page that all students can tap and watch immediately.
  - Opens a full-screen 9:16 vertical animated Diwali video story featuring multi-layered fireworks bursting across a night sky, floating sky lanterns, flickering clay diyas at the base, and an inspiring JEE Main/Advanced motivational message.
  - Lets students tap a dedicated **"Wish Happy Diwali"** button inside the status viewer to trigger an instant golden sparkler burst, increment the community Diwali wishes counter, and send their festive greeting.
  - Migrates Admin Status storage, view counts, and status replies from Firebase Firestore to the **Supabase Hub** (`0 Firebase Quota` impact) with local caching.
- **Target Audience**: JEE 2027/2028 aspirants visiting the Community feed during Diwali.
- **Key Value**: Celebrates Diwali with the student community while keeping motivation high for JEE preparation and using zero media streaming bandwidth.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Community Page Festive Status Bar**:
     - When a student opens the Community page, the status bar features a warm golden-amber ambient glow (`Festive Diwali Header Glow`) with subtle floating spark particles and a festive greeting strip.
     - Inside the status row, the **Admin Diwali Status Circle** features an animated rotating gold-and-saffron ring with a glowing diya preview thumbnail and `"Happy Diwali"` label.
  2. **Full-Screen Animated Diwali Video Status Viewer**:
     - Tapping the circle launches the full-screen 9:16 story viewer with an auto-advancing 15-second video progress bar (with tap-to-pause/hold and mute/unmute festive sound effects).
     - **Scene Choreography**:
       - *Top Layer*: Live HTML5 Canvas fireworks bursting in gold, amber, crimson, and royal indigo across a deep night sky (`#090414` to `#1A0B2E`).
       - *Center Stage*: Animated golden ornamental mandala frame with shimmering typography: **"Happy Diwali to All Future IITians & NITians"** followed by the JEE motivational quote: *"Jis tarah ek chhota sa diya poore andhere ko mita deta hai, waise hi aapki roz ki mehnat JEE ke har dar ko jeet me badal degi. Keep shining & keep studying!"*
       - *Bottom Stage*: Row of 5 animated earthen diyas with realistic flickering dual-tone flames and rising warm embers.
  3. **One-Click "Wish Happy Diwali" Student Interaction**:
     - Prominent golden CTA button at the bottom of the viewer: **"Wish Happy Diwali"** (showing live community wish count).
     - Clicking triggers a celebratory firework burst on screen, records the student's wish in Supabase Hub + `localStorage`, and shows a personalized toast confirmation.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Royal Indian Festive Night — rich deep plum-indigo night canvas contrasted with warm marigold gold (`#F59E0B`), vermilion saffron (`#EA580C`), and radiant ivory typography.
  - *Typography*: `Plus Jakarta Sans` / `Playfair Display` display headline styling with balanced line wrapping (`text-wrap: balance`) and tabular numerals (`tabular-nums`) for live view and wish counters.
  - *Touch Ergonomics*: All interactive story controls (close, mute, wish CTA, quick emoji reactions) maintain $\ge 44 \times 44\text{px}$ touch targets positioned in the natural thumb zone.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural 60fps Canvas Video Reel vs. Heavy MP4 Video File**
  - *Chosen Approach*: Render the animated Diwali video status as a real-time 60fps HTML5 Canvas + SVG + Framer Motion vertical video reel with optional Web Audio festive firework/chime synthesis.
  - *Why*: An MP4 video file of 15MB watched by 300 students would consume 4.5 GB of Supabase Storage Egress. A procedural canvas video loads in **0ms**, looks razor-sharp at retina resolution, supports interactive tap-to-burst fireworks anywhere on screen, and consumes **0 bytes of media bandwidth**.
- **Decision 2: Supabase Hub Persistence for Statuses, Views & Wishes**
  - *Chosen Approach*: Store custom Admin Statuses, view counts, and Diwali wish counts in `supabaseHub.ts` (`admin_status` record type) with instant `localStorage` hydration instead of Firebase Firestore.
  - *Why*: Eliminates Firebase quota errors completely and ensures every student sees the live view count and community Diwali wishes count accurately.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Community Page (Community.tsx)                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │               Festive Diwali Glow Status Bar Header               │  │
│  │  [ + Add Status (Admin) ]  [ 🪔 Happy Diwali Video ]  [ Custom ]  │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Full-Screen Status Viewer (AdminStatusRow.tsx)          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  15s Story Progress Bar  ·  Admin Badge  ·  Views  ·  Audio Toggle│  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │           Interactive 60fps Diwali Video Canvas Stage             │  │
│  │   • Multi-burst particle fireworks (tap anywhere for extra burst) │  │
│  │   • Floating golden sky lanterns & rotating festive mandala       │  │
│  │   • "Happy Diwali" + JEE 2028 Motivation Quote Card               │  │
│  │   • Animated flickering clay diyas along the base                 │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │  [ 🪔 Wish Happy Diwali (Live Counter) ]   [ Quick Emoji Bar ]    │  │
│  │  [ Reply to Admin Input ...                              [Send] ] │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Supabase Hub (supabaseHub.ts)                       │
│  • Built-in Default Diwali Video Status (0 MB Egress, Always Active)    │
│  • Syncs Views Count, Diwali Wishes Count & Admin Replies in Supabase   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interactive Component & State Mapping
- **Diwali Festive Status Bar**:
  - Renders the festive header glow on the Community status row with a toggleable option for Admin to pin/unpin the built-in Diwali Video Status.
- **Interactive Fireworks & Diyas Canvas (`DiwaliVideoStatusStage`)**:
  - Runs a `requestAnimationFrame` loop rendering rising firework rockets, radial spark explosions, floating lanterns, and flickering diya flames while the viewer modal is open, cleaning up automatically on close.
  - Tapping anywhere on the central stage launches an extra firework burst at the tap coordinates.
- **One-Click "Wish Happy Diwali" Handler**:
  - Optimistically increments the wish count in 0ms, marks `hasWishedDiwali` in `localStorage` so each student wishes once, triggers a grand 5-burst firework celebration, and syncs the updated wish count + reply to Supabase Hub.
