# Next.js + LiveKit — Candidate Starter

A minimal starter for a 90-minute exercise to implement a WebRTC room using **LiveKit Cloud** and **Next.js (App Router)**.

## What the candidate will do
- Finish the **`/api/token`** route to generate a LiveKit access token (5–8 lines).
- Implement client-side join flow on `/room`:
  - Fetch token → connect to LiveKit → publish mic/cam → render grid.
  - Handle device selection, mic/cam toggles, basic connection status, and permission errors.

## Quick Start
1. Copy `.env.example` → `.env.local` and fill **LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET** (create a free project in LiveKit Cloud).
2. Install & run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000/join` in two browser tabs, enter the **same room** and different names.
4. Implement the TODOs in `src/app/api/token/route.ts` and adjust the room UI as needed.

## Notes
- Keep the server secret usage **server-side** only. The client must never see API secrets.
- Use the provided styles from `@livekit/components-styles` for a quick, clean UI.
- If the token API isn’t complete, the `/room` page will show a helpful error.

Good luck!
