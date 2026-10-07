# Implementation Plan - Collaborative Whiteboard & Screen Share Improvements

We will enhance the **Digital Library** (`src/pages/DigitalLibrary.tsx`) with:
1. **Real-Time Collaborative Whiteboard**: Sync drawing strokes across all connected room participants using Firestore so everyone at the study table sees drawings instantly.
2. **Improved Screen Sharing Error Handling**: Provide a clear, friendly helper notice for mobile users or when screen sharing is cancelled/unsupported by the browser.

## Proposed Changes

### 1. Collaborative Whiteboard via Firestore
- Save canvas drawing actions (paths/strokes) to Firestore collection `metadata/digital_library_whiteboard`.
- Listen for real-time updates via `onSnapshot` so all users connected to the digital library see strokes drawn by any participant.
- Clear canvas syncs across all users.

### 2. Screen Share Guide & Error Handling
- Catch screen capture errors gracefully.
- Show an informative toast/alert explaining that mobile browsers have hardware limitations for screen sharing, while desktop Chrome/Edge/Firefox support it fully.

## Verification Plan

### Automated Tests
- Run `compile_applet` to ensure zero TypeScript and build errors.

### Manual Verification
- Open Digital Library in two browser tabs. Draw on the whiteboard in Tab 1 and verify that Tab 2 renders the strokes in real time.
- Test screen sharing button and verify friendly error messaging on mobile or cancellation.
