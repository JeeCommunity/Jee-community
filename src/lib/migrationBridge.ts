import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const NEW_WEBSITE_COMMUNITY_URL = 'https://jee-community.netlify.app/community';
export const NEW_WEBSITE_BASE_URL = 'https://jee-community.netlify.app';
export const OLD_WEBSITE_URL = 'https://jee-11-community.ai.studio/community';

export interface MigrationHubState {
  isActive: boolean;
  pinnedPostId?: string | null;
  statusStoryId?: string | null;
  targetUrl: string;
  postText: string;
  notificationText: string;
  autoKeepAtTop: boolean;
  lastBoostedAt?: number;
  lastLaunchedAt?: string;
  notificationsSentCount?: number;
}

export const DEFAULT_MIGRATION_POST_TEXT = `🚨 IMPORTANT UPDATE: HUM NAYI WEBSITE PAR SHIFT HO CHUKE HAIN! 🚀

Puraani website (ai.studio) par naye features update nahi ho rahe hain. Humne apni nayi, 10x Superfast Official Website launch kar di hai jahan aapka SAME LOGIN ACCOUNT aur saare purane posts pehle se maujood hain!

✨ Nayi Website Par Kya-Kya Naya Hai?
✅ 📚 Notes Hub: Toppers ke Handwritten Notes & Formula Sheets
✅ 🤖 AI Doubt Solver: Step-by-step Physics, Chemistry & Maths solutions
✅ 🔥 Live Study Rooms: Friends ke sath live timer lagakar padhai
✅ 🏛️ IIT Campus Map & Rank/Percentile Calculator
✅ ⚡ 10x Faster App + Home Screen Install (No Lag!)

👇 NAYI WEBSITE OPEN KARने KE LIYE:
1️⃣ Neeche diye gaye "Open ↗" button par click karein, YA
2️⃣ Is link ko copy karke Chrome/Browser me kholein:
👉 https://jee-community.netlify.app/community

(Apne dosto ko bhi bata dein—ab saari community nayi website par hi active hai! 🎯)`;

export const DEFAULT_MIGRATION_NOTIFICATION_TEXT =
  '🚀 Nayi Website Live Hai! 👉 https://jee-community.netlify.app/community — Click karein aur Pinned Post me "Open ↗" dabayein!';

/**
 * Generates a high-contrast 1200x675 landscape banner (JPEG data URL) for the Pinned Post
 * so that users on the old website immediately notice the new URL.
 */
export function generateMigrationPostBannerDataUrl(targetUrl: string = NEW_WEBSITE_COMMUNITY_URL): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Deep indigo/slate background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e1b4b');
  bgGrad.addColorStop(1, '#31104b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 675);

  // Subtle decorative glow circles
  ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
  ctx.beginPath();
  ctx.arc(1050, 120, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.beginPath();
  ctx.arc(160, 560, 220, 0, Math.PI * 2);
  ctx.fill();

  // Top Alert Badge
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(60, 48, 430, 50, 25);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('🚨 OFFICIAL WEBSITE SHIFT NOTICE', 86, 81);

  // Main Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 52px system-ui, -apple-system, sans-serif';
  ctx.fillText('WE HAVE MOVED TO OUR NEW', 60, 165);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('SUPERFAST WEBSITE! 🚀', 60, 230);

  // Highlighted URL Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(60, 265, 1080, 110, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText('NEW OFFICIAL LINK (TAP "OPEN ↗" BELOW OR TYPE IN BROWSER):', 90, 303);

  ctx.fillStyle = '#fde047';
  ctx.font = '900 38px monospace, system-ui, sans-serif';
  ctx.fillText(targetUrl.replace(/^https?:\/\//, ''), 90, 353);

  // Features Grid
  const features = [
    '📚 Notes Hub & Toppers PDFs',
    '🤖 Instant AI Doubt Solver',
    '🔥 Live Group Study Rooms',
    '⚡ Same Login & 10x Faster',
  ];

  ctx.font = 'bold 25px system-ui, -apple-system, sans-serif';
  features.forEach((feat, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 60 + col * 550;
    const y = 415 + row * 72;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, 520, 56, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(feat, x + 22, y + 37);
  });

  // Bottom CTA Bar
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(60, 575, 1080, 62, 16);
  ctx.fill();

  ctx.fillStyle = '#052e16';
  ctx.font = '900 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('👇 Click the "Open ↗" button right below this image to open the new app!', 115, 615);

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Generates a high-contrast 1080x1920 vertical story graphic (JPEG data URL) for AdminStatusRow
 */
export function generateMigrationStatusStoryDataUrl(targetUrl: string = NEW_WEBSITE_COMMUNITY_URL): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 900, 1600);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.45, '#1e1b4b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 900, 1600);

  // Decorative glow
  ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.beginPath();
  ctx.arc(450, 320, 320, 0, Math.PI * 2);
  ctx.fill();

  // Top Pill
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(170, 140, 560, 68, 34);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚨 IMPORTANT ADMIN NOTICE', 450, 185);

  // Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 58px system-ui, -apple-system, sans-serif';
  ctx.fillText('NAYI WEBSITE', 450, 310);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('LIVE HO CHUKI HAI! 🚀', 450, 385);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('Purani website (ai.studio) ab band ho rahi hai.', 450, 455);
  ctx.fillText('Saare naye features ab nayi website par hain:', 450, 495);

  // Big URL Box
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(55, 545, 790, 195, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('🌐 NEW OFFICIAL WEBSITE LINK:', 450, 598);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px monospace, system-ui, sans-serif';
  ctx.fillText('jee-community.netlify.app', 450, 658);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 26px monospace, system-ui, sans-serif';
  ctx.fillText('/community', 450, 705);

  // Features List
  const items = [
    '📚 Notes Hub & Free Toppers PDFs',
    '🤖 AI Doubt Solver (Step-by-Step)',
    '🔥 Live Group Study Rooms & Timer',
    '🏛️ IIT Campus Map & Rank Predictor',
    '🔐 Same Account Login (Data Safe!)',
  ];

  ctx.textAlign = 'left';
  items.forEach((item, index) => {
    const y = 790 + index * 96;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(75, y, 750, 76, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(item, 110, y + 49);
  });

  // Bottom Instruction Card
  ctx.textAlign = 'center';
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(65, 1300, 770, 155, 24);
  ctx.fill();

  ctx.fillStyle = '#052e16';
  ctx.font = '900 31px system-ui, -apple-system, sans-serif';
  ctx.fillText('📌 KAISE KHOLEIN?', 450, 1352);
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText('Community ke TOP PINNED POST me jaakar', 450, 1395);
  ctx.fillText('"Open ↗" button par click karein!', 450, 1432);

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Fetches the current Migration Hub state from metadata/migration_hub
 */
export async function getMigrationHubState(): Promise<MigrationHubState> {
  try {
    const snap = await getDoc(doc(db, 'metadata', 'migration_hub'));
    if (snap.exists()) {
      const data = snap.data();
      return {
        isActive: !!data.isActive,
        pinnedPostId: data.pinnedPostId || null,
        statusStoryId: data.statusStoryId || null,
        targetUrl: data.targetUrl || NEW_WEBSITE_COMMUNITY_URL,
        postText: data.postText || DEFAULT_MIGRATION_POST_TEXT,
        notificationText: data.notificationText || DEFAULT_MIGRATION_NOTIFICATION_TEXT,
        autoKeepAtTop: data.autoKeepAtTop !== false,
        lastBoostedAt: data.lastBoostedAt || 0,
        lastLaunchedAt: data.lastLaunchedAt || '',
        notificationsSentCount: data.notificationsSentCount || 0,
      };
    }
  } catch (err) {
    console.error('Failed to read migration_hub state:', err);
  }
  return {
    isActive: false,
    pinnedPostId: null,
    statusStoryId: null,
    targetUrl: NEW_WEBSITE_COMMUNITY_URL,
    postText: DEFAULT_MIGRATION_POST_TEXT,
    notificationText: DEFAULT_MIGRATION_NOTIFICATION_TEXT,
    autoKeepAtTop: true,
    lastBoostedAt: 0,
    notificationsSentCount: 0,
  };
}

/**
 * Publishes or updates the Pinned Migration Post in `posts`.
 * Uses `pdfUrl: targetUrl` so the old website renders a native clickable "Open ↗" button!
 */
export async function publishMigrationPinnedPost(params: {
  adminUid: string;
  targetUrl: string;
  postText: string;
  existingPostId?: string | null;
}): Promise<string> {
  const bannerDataUrl = generateMigrationPostBannerDataUrl(params.targetUrl);
  const postPayload = {
    authorId: params.adminUid,
    text: params.postText.trim(),
    tag: 'General',
    communityType: 'Both',
    isPinned: true,
    isMigrationNotice: true,
    images: bannerDataUrl ? [bannerDataUrl] : [],
    // Clever compatibility trick: on the old site, pdfUrl without '.pdf' renders a direct clickable <a href={pdfUrl} target="_blank">Open ↗</a> button!
    pdfUrl: params.targetUrl.trim(),
    likesCount: 99,
    likedBy: [],
    commentsCount: 0,
    viewsCount: 500,
    reportCount: 0,
    reportedBy: [],
    createdAt: serverTimestamp(),
  };

  let finalPostId = params.existingPostId || null;

  if (finalPostId) {
    try {
      const existingSnap = await getDoc(doc(db, 'posts', finalPostId));
      if (existingSnap.exists()) {
        await updateDoc(doc(db, 'posts', finalPostId), postPayload);
        return finalPostId;
      }
    } catch {
      // If not found, create a fresh document below
    }
  }

  const createdRef = await addDoc(collection(db, 'posts'), postPayload);
  finalPostId = createdRef.id;
  return finalPostId;
}

/**
 * Publishes or updates the Admin Status Story in `admin_statuses`.
 */
export async function publishMigrationStatusStory(params: {
  adminUid: string;
  targetUrl: string;
  existingStatusId?: string | null;
}): Promise<string> {
  const storyDataUrl = generateMigrationStatusStoryDataUrl(params.targetUrl);
  const cleanUrl = params.targetUrl.trim();
  const statusPayload = {
    imageUrl: storyDataUrl,
    type: 'image',
    linkUrl: cleanUrl,
    linkLabel: 'Open New Website ↗',
    caption: `🚀 Nayi Website Live Hai! Click karein: ${cleanUrl}`,
    isMigrationNotice: true,
    authorId: params.adminUid,
    createdAt: serverTimestamp(),
  };

  let finalStatusId = params.existingStatusId || null;
  if (finalStatusId) {
    try {
      const existingSnap = await getDoc(doc(db, 'admin_statuses', finalStatusId));
      if (existingSnap.exists()) {
        await updateDoc(doc(db, 'admin_statuses', finalStatusId), statusPayload);
        return finalStatusId;
      }
    } catch {
      // Create new status below
    }
  }

  const createdRef = await addDoc(collection(db, 'admin_statuses'), statusPayload);
  finalStatusId = createdRef.id;
  return finalStatusId;
}

/**
 * Broadcasts an In-App Bell Notification to all users in `users` collection.
 * Clicking this notification on the old website navigates to `/community?postId={pinnedPostId}`.
 */
export async function broadcastMigrationNotifications(params: {
  adminUid: string;
  adminAvatar?: string;
  pinnedPostId: string;
  notificationText: string;
}): Promise<number> {
  const usersSnap = await getDocs(collection(db, 'users'));
  const recipientIds = usersSnap.docs
    .map((d) => d.id)
    .filter((uid) => Boolean(uid));

  let sentCount = 0;
  const chunkSize = 400;

  for (let i = 0; i < recipientIds.length; i += chunkSize) {
    const chunk = recipientIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((recipientId) => {
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        recipientId,
        senderId: params.adminUid,
        senderName: '🚨 Admin (New Website Link)',
        senderAvatar: params.adminAvatar || '',
        type: 'comment',
        postId: params.pinnedPostId,
        commentContent: params.notificationText,
        postContent: 'Tap to open the New JEE Community Website 🚀',
        isRead: false,
        isMigrationNotice: true,
        createdAt: serverTimestamp(),
      });
      sentCount++;
    });
    await batch.commit();
  }

  return sentCount;
}

/**
 * Boosts both the Pinned Post and Status Story `createdAt` timestamp to `serverTimestamp()`
 * so they never fall out of the old website's `orderBy('createdAt', 'desc'), limit(20)` query.
 */
export async function boostMigrationToTop(): Promise<boolean> {
  try {
    const state = await getMigrationHubState();
    if (!state.isActive) return false;

    const updates: Promise<any>[] = [];
    if (state.pinnedPostId) {
      updates.push(
        updateDoc(doc(db, 'posts', state.pinnedPostId), {
          createdAt: serverTimestamp(),
          isPinned: true,
          isMigrationNotice: true,
        }).catch(() => {})
      );
    }
    if (state.statusStoryId) {
      updates.push(
        updateDoc(doc(db, 'admin_statuses', state.statusStoryId), {
          createdAt: serverTimestamp(),
          isMigrationNotice: true,
        }).catch(() => {})
      );
    }

    updates.push(
      setDoc(
        doc(db, 'metadata', 'migration_hub'),
        { lastBoostedAt: Date.now() },
        { merge: true }
      )
    );

    await Promise.all(updates);
    return true;
  } catch (err) {
    console.error('Failed to boost migration notice:', err);
    return false;
  }
}

/**
 * Automatically called when users visit the Community page:
 * If the Migration Bridge is active and hasn't been boosted in the last 25 minutes,
 * refreshes `createdAt` so the Pinned Post stays in the top 20 on the old website forever.
 */
export async function ensureMigrationPinnedAtTop(): Promise<void> {
  try {
    const state = await getMigrationHubState();
    if (!state.isActive || !state.autoKeepAtTop) return;
    const twentyFiveMins = 25 * 60 * 1000;
    if (!state.lastBoostedAt || Date.now() - state.lastBoostedAt > twentyFiveMins) {
      await boostMigrationToTop();
    }
  } catch {
    // Ignore background errors silently
  }
}

/**
 * Removes all migration posts/stories from the database if the Admin chooses to deactivate.
 */
export async function deactivateMigrationBridge(): Promise<void> {
  const state = await getMigrationHubState();

  if (state.pinnedPostId) {
    await deleteDoc(doc(db, 'posts', state.pinnedPostId)).catch(() => {});
  }
  if (state.statusStoryId) {
    await deleteDoc(doc(db, 'admin_statuses', state.statusStoryId)).catch(() => {});
  }

  // Also clean up any leftover migration posts or status stories by flag
  try {
    const pSnap = await getDocs(query(collection(db, 'posts'), where('isMigrationNotice', '==', true), limit(20)));
    await Promise.all(pSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  } catch {}

  try {
    const sSnap = await getDocs(query(collection(db, 'admin_statuses'), where('isMigrationNotice', '==', true), limit(20)));
    await Promise.all(sSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  } catch {}

  await setDoc(
    doc(db, 'metadata', 'migration_hub'),
    {
      isActive: false,
      pinnedPostId: null,
      statusStoryId: null,
      lastBoostedAt: Date.now(),
    },
    { merge: true }
  );
}
