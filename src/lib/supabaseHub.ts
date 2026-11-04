import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, getCloudConfig } from './edutube';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

export type HubRecordType =
  | 'study_session'
  | 'study_group'
  | 'notes_hub'
  | 'community_post'
  | 'post_comment'
  | 'hub_notification'
  | 'user_profile';

const HUB_EVENT_NAME = 'jee-supabase-hub-sync';
const READ_NOTIFS_STORAGE_KEY = 'jee_hub_read_notif_ids_v1';
const CLEARED_NOTIFS_TS_KEY = 'jee_hub_cleared_notifs_before_v1';
const SEEN_LIVE_TOAST_IDS_KEY = 'jee_hub_seen_live_toasts_v1';

// In-memory caches to eliminate duplicate network/Firebase requests
const profileMemoryCache = new Map<string, any>();
const firebaseSeededFlags = new Set<string>();

function getSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  const cfg = getCloudConfig();
  const key = cfg.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

function getSupabaseRestUrl(): string {
  const cfg = getCloudConfig();
  const baseUrl = (cfg.supabaseUrl || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
  return `${baseUrl}/rest/v1/edutube_videos`;
}

function emitHubSync(recordType: HubRecordType, id?: string) {
  try {
    window.dispatchEvent(
      new CustomEvent(HUB_EVENT_NAME, { detail: { recordType, id, ts: Date.now() } })
    );
  } catch {
    // ignore
  }
}

/**
 * Encodes any structured Hub record into a row compatible with `public.edutube_videos`.
 * Uses `video_url: 'blob://...'` so even older cached EduTube tabs ignore non-video records.
 */
function encodeHubRow(params: {
  id: string;
  recordType: HubRecordType;
  title: string;
  description?: string;
  subject?: string;
  chapter?: string;
  author_uid: string;
  author_name: string;
  author_username?: string;
  author_photo?: string;
  views?: number;
  likes?: number;
  liked_by?: any[];
  payload: any;
  created_at?: string;
}) {
  return {
    id: params.id,
    title: params.title || 'Record',
    description: params.description || '',
    video_url: `blob://${params.recordType}`,
    thumbnail_url: params.author_photo || '',
    duration: '00:00',
    video_type: params.recordType,
    subject: params.subject || params.recordType,
    chapter: params.chapter || 'general',
    author_uid: params.author_uid || 'system',
    author_name: params.author_name || 'User',
    author_username: params.author_username || 'user',
    author_photo: params.author_photo || '',
    views: Number(params.views) || 0,
    likes: Number(params.likes) || 0,
    liked_by: Array.isArray(params.liked_by) ? params.liked_by : [],
    comments: [params.payload],
    storage_provider: 'supabase',
    created_at: params.created_at || new Date().toISOString(),
  };
}

function decodeHubPayload<T = any>(row: any): T | null {
  if (!row) return null;
  if (Array.isArray(row.comments) && row.comments.length > 0 && typeof row.comments[0] === 'object') {
    return {
      ...row.comments[0],
      _rowCreatedAt: row.created_at,
      _rowId: row.id,
    } as T;
  }
  if (row.comments && typeof row.comments === 'object' && !Array.isArray(row.comments)) {
    return {
      ...row.comments,
      _rowCreatedAt: row.created_at,
      _rowId: row.id,
    } as T;
  }
  return null;
}

export async function upsertHubRow(row: ReturnType<typeof encodeHubRow>): Promise<boolean> {
  try {
    const res = await fetch(getSupabaseRestUrl(), {
      method: 'POST',
      headers: getSupabaseHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch (err) {
    console.warn('Supabase upsertHubRow error:', err);
    return false;
  }
}

export async function deleteHubRow(rowId: string): Promise<boolean> {
  try {
    const res = await fetch(`${getSupabaseRestUrl()}?id=eq.${encodeURIComponent(rowId)}`, {
      method: 'DELETE',
      headers: getSupabaseHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.warn('Supabase deleteHubRow error:', err);
    return false;
  }
}

export async function queryHubRows(queryString: string): Promise<any[]> {
  try {
    const res = await fetch(`${getSupabaseRestUrl()}?${queryString}`, {
      headers: getSupabaseHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Supabase queryHubRows error:', err);
    return [];
  }
}

// ============================================================================
// 1. SMART USER PROFILE CACHE (0 Repeated Firebase Reads)
// ============================================================================

export async function getCachedUserProfile(uid: string): Promise<any | null> {
  if (!uid) return null;
  if (profileMemoryCache.has(uid)) {
    return profileMemoryCache.get(uid);
  }

  try {
    const localRaw = localStorage.getItem(`jee_uprofile_${uid}`);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed && Date.now() - (parsed._cachedAt || 0) < 12 * 3600 * 1000) {
        profileMemoryCache.set(uid, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Try Supabase profile row first (0 Firebase reads)
  const rows = await queryHubRows(
    `select=*&id=eq.${encodeURIComponent(`uprofile_${uid}`)}&limit=1`
  );
  if (rows.length > 0) {
    const decoded = decodeHubPayload(rows[0]);
    if (decoded) {
      profileMemoryCache.set(uid, decoded);
      try {
        localStorage.setItem(
          `jee_uprofile_${uid}`,
          JSON.stringify({ ...decoded, _cachedAt: Date.now() })
        );
      } catch {
        // ignore
      }
      return decoded;
    }
  }

  // Fallback once to Firebase `users/{uid}` and cache in Supabase for everyone
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = { uid, ...snap.data() };
      await cacheUserProfileInSupabase(uid, data);
      return data;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function cacheUserProfileInSupabase(uid: string, profileData: any): Promise<void> {
  if (!uid || !profileData) return;
  const clean = {
    uid,
    fullName: profileData.fullName || profileData.name || 'Student',
    username: profileData.username || 'student',
    photoURL: profileData.photoURL || profileData.avatar || '',
    role: profileData.role || 'user',
    targetExam: profileData.targetExam || 'JEE',
    cheersEnabled: profileData.cheersEnabled !== false,
    campus: profileData.campus || { totalCoins: 0, totalXP: 0 },
  };
  profileMemoryCache.set(uid, clean);
  try {
    localStorage.setItem(`jee_uprofile_${uid}`, JSON.stringify({ ...clean, _cachedAt: Date.now() }));
  } catch {
    // ignore
  }
  await upsertHubRow(
    encodeHubRow({
      id: `uprofile_${uid}`,
      recordType: 'user_profile',
      title: clean.fullName,
      description: clean.username,
      author_uid: uid,
      author_name: clean.fullName,
      author_username: clean.username,
      author_photo: clean.photoURL,
      payload: clean,
    })
  );
}

// ============================================================================
// 2. GLOBAL & PERSONAL LIVE NOTIFICATIONS (Supabase Realtime - 0 Firebase Quota)
// ============================================================================

export interface HubNotificationPayload {
  id: string;
  recipientId: string; // 'ALL' for global broadcast or specific user UID
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: string;
  postId?: string;
  postContent?: string;
  commentId?: string;
  commentContent?: string;
  noteId?: string;
  noteTitle?: string;
  noteCategory?: string;
  noteSubject?: string;
  videoId?: string;
  videoTitle?: string;
  videoType?: string;
  targetUrl?: string;
  isRead?: boolean;
  createdAtMs: number;
}

export function getReadNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNotificationReadLocal(notifId: string): void {
  try {
    const current = getReadNotificationIds();
    if (!current.includes(notifId)) {
      localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify([notifId, ...current].slice(0, 300)));
    }
  } catch {
    // ignore
  }
  emitHubSync('hub_notification', notifId);
}

export function clearAllNotificationsForUser(): void {
  try {
    localStorage.setItem(CLEARED_NOTIFS_TS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
  emitHubSync('hub_notification');
}

export function getSeenLiveToastIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_LIVE_TOAST_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markSeenLiveToastId(id: string): void {
  try {
    const current = getSeenLiveToastIds();
    if (!current.includes(id)) {
      localStorage.setItem(SEEN_LIVE_TOAST_IDS_KEY, JSON.stringify([id, ...current].slice(0, 200)));
    }
  } catch {
    // ignore
  }
}

export async function createSupabaseNotification(data: {
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: string;
  postId?: string;
  postContent?: string;
  commentId?: string;
  commentContent?: string;
  noteId?: string;
  noteTitle?: string;
  videoId?: string;
  videoTitle?: string;
  targetUrl?: string;
}): Promise<void> {
  if (!data.recipientId || data.recipientId === data.senderId) return;

  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload: HubNotificationPayload = {
    id,
    recipientId: data.recipientId,
    senderId: data.senderId,
    senderName: data.senderName || 'Community Member',
    senderAvatar: data.senderAvatar || '',
    type: data.type,
    postId: data.postId,
    postContent: data.postContent,
    commentId: data.commentId,
    commentContent: data.commentContent,
    noteId: data.noteId,
    noteTitle: data.noteTitle,
    videoId: data.videoId,
    videoTitle: data.videoTitle,
    targetUrl: data.targetUrl,
    isRead: false,
    createdAtMs: Date.now(),
  };

  await upsertHubRow(
    encodeHubRow({
      id,
      recordType: 'hub_notification',
      title: data.type,
      description: data.postContent || data.commentContent || data.noteTitle || data.videoTitle || '',
      subject: data.type,
      chapter: data.recipientId,
      author_uid: data.senderId,
      author_name: data.senderName,
      author_photo: data.senderAvatar,
      payload,
    })
  );

  emitHubSync('hub_notification', id);
}

/**
 * Broadcasts ONE single global notification row (`chapter: 'ALL'`) to all users in Supabase!
 * Triggered automatically when ANY user uploads a Video/Short, Community Post, or Notes Hub PDF.
 */
export async function sendSupabaseGlobalNotification(
  senderId: string,
  senderName: string,
  senderAvatar: string,
  type: string,
  extraData: Record<string, any> = {}
): Promise<void> {
  const id = `notif_global_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload: HubNotificationPayload = {
    id,
    recipientId: 'ALL',
    senderId: senderId || 'system',
    senderName: senderName || 'JEE Community Member',
    senderAvatar: senderAvatar || '',
    type,
    postId: extraData.postId,
    postContent: extraData.postContent,
    noteId: extraData.noteId,
    noteTitle: extraData.noteTitle,
    noteCategory: extraData.noteCategory,
    noteSubject: extraData.noteSubject,
    videoId: extraData.videoId,
    videoTitle: extraData.videoTitle,
    videoType: extraData.videoType,
    targetUrl: extraData.targetUrl,
    isRead: false,
    createdAtMs: Date.now(),
  };

  await upsertHubRow(
    encodeHubRow({
      id,
      recordType: 'hub_notification',
      title: type,
      description:
        extraData.videoTitle ||
        extraData.noteTitle ||
        extraData.postContent ||
        'New Community Update',
      subject: type,
      chapter: 'ALL',
      author_uid: senderId || 'system',
      author_name: senderName || 'JEE Community',
      author_photo: senderAvatar || '',
      payload,
    })
  );

  emitHubSync('hub_notification', id);
}

export async function fetchUserSupabaseNotifications(uid: string): Promise<any[]> {
  if (!uid) return [];
  const rows = await queryHubRows(
    `select=*&video_type=eq.hub_notification&chapter=in.(ALL,${encodeURIComponent(uid)})&order=created_at.desc&limit=40`
  );
  const readIds = getReadNotificationIds();
  const clearedBefore = Number(localStorage.getItem(CLEARED_NOTIFS_TS_KEY) || '0');

  const results: any[] = [];
  for (const row of rows) {
    const p = decodeHubPayload<HubNotificationPayload>(row);
    if (!p) continue;
    // Don't show a global notification to the user who uploaded it themselves
    if (p.recipientId === 'ALL' && p.senderId === uid) continue;
    const createdAtMs = p.createdAtMs || new Date(row.created_at).getTime();
    if (clearedBefore > 0 && createdAtMs <= clearedBefore) continue;

    const isRead = Boolean(p.isRead || readIds.includes(p.id) || readIds.includes(row.id));
    results.push({
      ...p,
      id: p.id || row.id,
      isRead,
      createdAt: {
        toDate: () => new Date(createdAtMs),
        toMillis: () => createdAtMs,
      },
    });
  }

  return results.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export function subscribeSupabaseNotifications(
  uid: string,
  onUpdate: (notifs: any[], newArrival?: any) => void
): () => void {
  let active = true;
  let initialLoadDone = false;

  const load = async () => {
    if (!active || !uid) return;
    const list = await fetchUserSupabaseNotifications(uid);
    if (!active) return;

    let newestUnseen: any = undefined;
    const seenToasts = getSeenLiveToastIds();

    if (!initialLoadDone) {
      // Mark existing notifications as already toast-seen so we only toast new live arrivals
      list.slice(0, 15).forEach((n) => markSeenLiveToastId(n.id));
      initialLoadDone = true;
    } else {
      for (const n of list) {
        if (!n.isRead && !seenToasts.includes(n.id)) {
          markSeenLiveToastId(n.id);
          newestUnseen = n;
          break;
        }
      }
    }

    onUpdate(list, newestUnseen);
  };

  load();
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load();
    }
  }, 5000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'hub_notification') {
      load();
    }
  };
  window.addEventListener(HUB_EVENT_NAME, handleSync);

  return () => {
    active = false;
    clearInterval(interval);
    window.removeEventListener(HUB_EVENT_NAME, handleSync);
  };
}

// ============================================================================
// 3. LIVE STUDY HUB (`study_session` in Supabase - Live Snapshot!)
// ============================================================================

function normalizeSessionTimestamps(data: any): any {
  if (!data) return null;
  const lastUpdatedMs =
    typeof data.lastUpdatedMs === 'number'
      ? data.lastUpdatedMs
      : data.lastUpdated?.toMillis
      ? data.lastUpdated.toMillis()
      : Date.now();
  return {
    ...data,
    id: data.uid || data.id,
    lastUpdatedMs,
    lastUpdated: {
      toMillis: () => lastUpdatedMs,
      toDate: () => new Date(lastUpdatedMs),
    },
  };
}

export async function getSupabaseStudySession(uid: string): Promise<any | null> {
  if (!uid) return null;
  const rows = await queryHubRows(
    `select=*&id=eq.${encodeURIComponent(`session_${uid}`)}&limit=1`
  );
  if (rows.length > 0) {
    const decoded = decodeHubPayload(rows[0]);
    if (decoded) return normalizeSessionTimestamps(decoded);
  }

  // One-time seamless migration from Firebase if user had a study session before
  if (!firebaseSeededFlags.has(`session_${uid}`)) {
    firebaseSeededFlags.add(`session_${uid}`);
    try {
      const snap = await getDoc(doc(db, 'study_sessions', uid));
      if (snap.exists()) {
        const fbData = snap.data();
        const normalized = normalizeSessionTimestamps({ id: uid, uid, ...fbData });
        await saveSupabaseStudySession(uid, normalized);
        return normalized;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export async function saveSupabaseStudySession(uid: string, sessionData: any): Promise<any> {
  const existing = await getSupabaseStudySessionOnceNoFallback(uid);
  const merged = {
    ...(existing || {}),
    ...sessionData,
    id: uid,
    uid,
    lastUpdatedMs: Date.now(),
  };
  // Strip Firestore FieldValue objects like serverTimestamp() before JSON serialization
  if (merged.lastUpdated && typeof merged.lastUpdated.toMillis !== 'function') {
    delete merged.lastUpdated;
  }

  await upsertHubRow(
    encodeHubRow({
      id: `session_${uid}`,
      recordType: 'study_session',
      title: merged.fullName || merged.username || 'Student',
      description: merged.dailyDate || '',
      subject: merged.dailyDate || 'today',
      chapter: merged.isStudying ? 'studying' : 'idle',
      author_uid: uid,
      author_name: merged.fullName || 'Student',
      author_username: merged.username || 'student',
      author_photo: merged.photoURL || '',
      views: Number(merged.accumulatedTime) || 0,
      likes: merged.isStudying ? 1 : 0,
      payload: merged,
    })
  );

  emitHubSync('study_session', uid);
  return normalizeSessionTimestamps(merged);
}

async function getSupabaseStudySessionOnceNoFallback(uid: string): Promise<any | null> {
  const rows = await queryHubRows(
    `select=*&id=eq.${encodeURIComponent(`session_${uid}`)}&limit=1`
  );
  if (rows.length > 0) {
    return decodeHubPayload(rows[0]);
  }
  return null;
}

export async function fetchAllSupabaseStudySessions(todayDate: string): Promise<any[]> {
  const rows = await queryHubRows(
    `select=*&video_type=eq.study_session&order=created_at.desc&limit=150`
  );

  const map = new Map<string, any>();
  for (const row of rows) {
    const decoded = decodeHubPayload(row);
    if (!decoded || !decoded.uid) continue;
    map.set(decoded.uid, normalizeSessionTimestamps(decoded));
  }

  // One-time seed of today's Firebase study sessions if Supabase has < 2 sessions
  const seedKey = `seeded_all_sessions_${todayDate}`;
  if (map.size < 2 && !firebaseSeededFlags.has(seedKey)) {
    firebaseSeededFlags.add(seedKey);
    try {
      const q = query(
        collection(db, 'study_sessions'),
        where('dailyDate', '==', todayDate),
        limit(50)
      );
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const d = docSnap.data();
        const uid = docSnap.id;
        if (!map.has(uid)) {
          const norm = normalizeSessionTimestamps({ id: uid, uid, ...d });
          map.set(uid, norm);
          saveSupabaseStudySession(uid, norm).catch(() => {});
        }
      }
    } catch {
      // ignore if Firebase quota reached
    }
  }

  const allSessions: any[] = [];
  for (const data of map.values()) {
    const cloned = { ...data };
    if (cloned.isStudying && cloned.startTime) {
      const elapsedSeconds = Math.floor((Date.now() - cloned.startTime) / 1000);
      if (elapsedSeconds >= 3 * 3600) {
        cloned.isStudying = false;
        cloned.accumulatedTime = Math.min(18 * 3600, (cloned.accumulatedTime || 0) + 3 * 3600);
        if (cloned.goals && cloned.activeGoalId) {
          cloned.goals = cloned.goals.map((g: any) =>
            g.id === cloned.activeGoalId
              ? { ...g, accumulatedTime: (g.accumulatedTime || 0) + 3 * 3600 }
              : g
          );
        }
      }
    }
    const hasStudiedToday =
      cloned.dailyDate === todayDate && (cloned.accumulatedTime > 0 || cloned.isStudying);
    if (cloned.isStudying || hasStudiedToday) {
      allSessions.push(cloned);
    }
  }

  return allSessions.sort((a, b) => {
    const getTotal = (s: any) => {
      let total = s.accumulatedTime || 0;
      if (s.dailyDate !== todayDate) return 0;
      if (s.isStudying && s.startTime) {
        let t = Math.floor((Date.now() - s.startTime) / 1000);
        if (t > 3 * 3600) t = 3 * 3600;
        total += t;
      }
      return total;
    };
    return getTotal(b) - getTotal(a);
  });
}

export function subscribeSupabaseStudySessions(
  uid: string,
  todayDate: string,
  onUpdate: (allSessions: any[], mySession: any | null) => void
): () => void {
  let active = true;

  const refresh = async () => {
    if (!active) return;
    const [all, mine] = await Promise.all([
      fetchAllSupabaseStudySessions(todayDate),
      uid ? getSupabaseStudySession(uid) : Promise.resolve(null),
    ]);
    if (!active) return;
    onUpdate(all, mine);
  };

  refresh();
  // Live snapshot every 4 seconds (0 Firebase reads!)
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      refresh();
    }
  }, 4000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'study_session') {
      refresh();
    }
  };
  window.addEventListener(HUB_EVENT_NAME, handleSync);

  return () => {
    active = false;
    clearInterval(timer);
    window.removeEventListener(HUB_EVENT_NAME, handleSync);
  };
}

// ============================================================================
// 4. PRIVATE STUDY GROUPS & LIVE CHAT (`study_group` in Supabase)
// ============================================================================

export async function fetchSupabaseStudyGroups(uid: string): Promise<any[]> {
  if (!uid) return [];
  const rows = await queryHubRows(
    `select=*&video_type=eq.study_group&order=created_at.desc&limit=100`
  );
  const groupsMap = new Map<string, any>();

  for (const row of rows) {
    const g = decodeHubPayload(row);
    if (g && Array.isArray(g.members) && g.members.includes(uid)) {
      groupsMap.set(g.id || g.shortCode, g);
    }
  }

  // One-time migration from Firebase `study_groups` for this user
  const seedKey = `seeded_groups_${uid}`;
  if (groupsMap.size === 0 && !firebaseSeededFlags.has(seedKey)) {
    firebaseSeededFlags.add(seedKey);
    try {
      const q = query(collection(db, 'study_groups'), where('members', 'array-contains', uid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const gData = { id: d.id, shortCode: d.id, ...d.data(), messages: [] };
        groupsMap.set(d.id, gData);
        await saveSupabaseStudyGroup(gData);
      }
    } catch {
      // ignore
    }
  }

  return Array.from(groupsMap.values());
}

export async function getSupabaseStudyGroupByCode(shortCode: string): Promise<any | null> {
  const code = shortCode.trim().toUpperCase();
  const rows = await queryHubRows(
    `select=*&id=eq.${encodeURIComponent(`group_${code}`)}&limit=1`
  );
  if (rows.length > 0) {
    const decoded = decodeHubPayload(rows[0]);
    if (decoded) return decoded;
  }

  // Check Firebase fallback once if group was created before Supabase migration
  try {
    const q = query(collection(db, 'study_groups'), where('shortCode', '==', code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      const gData = { id: d.id, shortCode: code, ...d.data(), messages: [] };
      await saveSupabaseStudyGroup(gData);
      return gData;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function saveSupabaseStudyGroup(groupData: any): Promise<any> {
  const code = (groupData.shortCode || groupData.id || '').trim().toUpperCase();
  const existing = await getSupabaseStudyGroupByCodeNoFallback(code);
  const merged = {
    ...(existing || {}),
    ...groupData,
    id: code,
    shortCode: code,
    messages: Array.isArray(groupData.messages)
      ? groupData.messages
      : Array.isArray(existing?.messages)
      ? existing.messages
      : [],
  };

  await upsertHubRow(
    encodeHubRow({
      id: `group_${code}`,
      recordType: 'study_group',
      title: merged.name || 'Study Group',
      description: code,
      subject: 'StudyGroup',
      chapter: code,
      author_uid: merged.creatorId || 'user',
      author_name: merged.name || 'Study Group',
      author_photo: merged.photoURL || '',
      liked_by: Array.isArray(merged.members) ? merged.members : [],
      payload: merged,
    })
  );

  emitHubSync('study_group', code);
  return merged;
}

async function getSupabaseStudyGroupByCodeNoFallback(code: string): Promise<any | null> {
  const rows = await queryHubRows(
    `select=*&id=eq.${encodeURIComponent(`group_${code}`)}&limit=1`
  );
  if (rows.length > 0) {
    return decodeHubPayload(rows[0]);
  }
  return null;
}

export async function addSupabaseGroupMessage(
  shortCode: string,
  msgInput: Record<string, any>
): Promise<any> {
  const group = await getSupabaseStudyGroupByCode(shortCode);
  if (!group) throw new Error('Study group not found');

  const nowMs = Date.now();
  const newMsg = {
    ...msgInput,
    id: `gmsg_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
    createdAtMs: nowMs,
  };

  const currentMsgs = Array.isArray(group.messages) ? group.messages : [];
  const nextMsgs = [...currentMsgs, newMsg].slice(-80); // Keep latest 80 messages fast & compact

  await saveSupabaseStudyGroup({
    ...group,
    messages: nextMsgs,
    needsAdminAttention: msgInput.isToxic ? true : group.needsAdminAttention,
  });

  return newMsg;
}

export async function updateSupabaseGroupMessage(
  shortCode: string,
  msgId: string,
  patch: Record<string, any>
): Promise<void> {
  const group = await getSupabaseStudyGroupByCode(shortCode);
  if (!group) return;
  const currentMsgs = Array.isArray(group.messages) ? group.messages : [];
  const nextMsgs = currentMsgs.map((m: any) => (m.id === msgId ? { ...m, ...patch } : m));
  await saveSupabaseStudyGroup({ ...group, messages: nextMsgs });
}

export function subscribeSupabaseGroupMessages(
  shortCode: string,
  onUpdate: (messages: any[], groupData?: any) => void
): () => void {
  let active = true;
  const code = shortCode.trim().toUpperCase();

  const load = async () => {
    if (!active || !code) return;
    const group = await getSupabaseStudyGroupByCodeNoFallback(code);
    if (!active || !group) return;
    const rawMsgs = Array.isArray(group.messages) ? group.messages : [];
    const hydrated = rawMsgs.map((m: any) => {
      const ms = m.createdAtMs || Date.now();
      return {
        ...m,
        createdAt: {
          toDate: () => new Date(ms),
          toMillis: () => ms,
        },
      };
    });
    onUpdate(hydrated, group);
  };

  load();
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load();
    }
  }, 3000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'study_group') {
      load();
    }
  };
  window.addEventListener(HUB_EVENT_NAME, handleSync);

  return () => {
    active = false;
    clearInterval(interval);
    window.removeEventListener(HUB_EVENT_NAME, handleSync);
  };
}

// ============================================================================
// 5. NOTES HUB (`notes_hub` in Supabase + Instant Broadcast Notification)
// ============================================================================

export async function fetchSupabaseNotes(category: string, subject: string): Promise<any[]> {
  const rows = await queryHubRows(
    `select=*&video_type=eq.notes_hub&chapter=eq.${encodeURIComponent(category)}&subject=eq.${encodeURIComponent(subject)}&order=created_at.desc&limit=150`
  );

  const notesMap = new Map<string, any>();
  for (const row of rows) {
    const decoded = decodeHubPayload(row);
    if (!decoded) continue;
    const ms = decoded.createdAtMs || new Date(row.created_at).getTime();
    notesMap.set(decoded.id || row.id, {
      ...decoded,
      id: decoded.id || row.id,
      views: Number(row.views ?? decoded.views ?? 0),
      downloads: Number(row.likes ?? decoded.downloads ?? 0),
      createdAt: {
        toMillis: () => ms,
        toDate: () => new Date(ms),
      },
    });
  }

  // One-time seamless migration of existing Firebase `notes_hub` items for this category+subject
  const seedKey = `notes_${category}_${subject}`;
  if (notesMap.size === 0 && !firebaseSeededFlags.has(seedKey)) {
    firebaseSeededFlags.add(seedKey);
    try {
      const q = query(
        collection(db, 'notes_hub'),
        where('category', '==', category),
        where('subject', '==', subject)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const fbData = d.data();
        const ms = fbData.createdAt?.toMillis ? fbData.createdAt.toMillis() : Date.now();
        const noteId = `note_${d.id}`;
        const noteObj = {
          id: noteId,
          title: fbData.title || 'Study Resource',
          description: fbData.description || '',
          category,
          subject,
          fileUrl: fbData.fileUrl || '',
          uploadedBy: fbData.uploadedBy || { uid: 'system', name: 'Contributor', avatar: null },
          createdAtMs: ms,
          downloads: fbData.downloads || 0,
          views: fbData.views || 0,
        };
        notesMap.set(noteId, {
          ...noteObj,
          createdAt: { toMillis: () => ms, toDate: () => new Date(ms) },
        });
        upsertHubRow(
          encodeHubRow({
            id: noteId,
            recordType: 'notes_hub',
            title: noteObj.title,
            description: noteObj.description,
            subject,
            chapter: category,
            author_uid: noteObj.uploadedBy.uid || 'system',
            author_name: noteObj.uploadedBy.name || 'Contributor',
            author_photo: noteObj.uploadedBy.avatar || '',
            views: noteObj.views,
            likes: noteObj.downloads,
            payload: noteObj,
            created_at: new Date(ms).toISOString(),
          })
        ).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  return Array.from(notesMap.values()).sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
  );
}

export async function createSupabaseNote(params: {
  title: string;
  description: string;
  category: string;
  subject: string;
  fileUrl: string;
  uploadedBy: { uid: string; name: string; avatar: string | null };
}): Promise<any> {
  const nowMs = Date.now();
  const id = `note_${nowMs}_${Math.random().toString(36).slice(2, 7)}`;
  const payload = {
    id,
    title: params.title,
    description: params.description,
    category: params.category,
    subject: params.subject,
    fileUrl: params.fileUrl,
    uploadedBy: params.uploadedBy,
    createdAtMs: nowMs,
    downloads: 0,
    views: 1,
  };

  await upsertHubRow(
    encodeHubRow({
      id,
      recordType: 'notes_hub',
      title: params.title,
      description: params.description,
      subject: params.subject,
      chapter: params.category,
      author_uid: params.uploadedBy.uid,
      author_name: params.uploadedBy.name,
      author_photo: params.uploadedBy.avatar || '',
      views: 1,
      likes: 0,
      payload,
    })
  );

  // Automatically notify ALL users in the community about the new Notes Hub upload!
  await sendSupabaseGlobalNotification(
    params.uploadedBy.uid,
    params.uploadedBy.name,
    params.uploadedBy.avatar || '',
    'note_upload',
    {
      noteId: id,
      noteTitle: params.title,
      noteCategory: params.category,
      noteSubject: params.subject,
      targetUrl: '/notes',
    }
  );

  emitHubSync('notes_hub', id);
  return payload;
}

export async function incrementSupabaseNoteViews(note: any): Promise<void> {
  if (!note?.id) return;
  const rowId = String(note.id).startsWith('note_') ? note.id : `note_${note.id}`;
  const nextViews = (Number(note.views) || 0) + 1;
  try {
    await fetch(`${getSupabaseRestUrl()}?id=eq.${encodeURIComponent(rowId)}`, {
      method: 'PATCH',
      headers: getSupabaseHeaders(),
      body: JSON.stringify({ views: nextViews }),
    });
  } catch {
    // ignore
  }
}

export async function deleteSupabaseNote(noteId: string): Promise<void> {
  const rowId = String(noteId).startsWith('note_') ? noteId : `note_${noteId}`;
  await deleteHubRow(rowId);
  emitHubSync('notes_hub', rowId);
}

// ============================================================================
// 6. COMMUNITY POSTS & COMMENTS (`community_post` & `post_comment` in Supabase)
// ============================================================================

function hydratePostTimestamps(post: any): any {
  const createdMs =
    typeof post.createdAtMs === 'number'
      ? post.createdAtMs
      : post.createdAt?.toMillis
      ? post.createdAt.toMillis()
      : post.createdAt
      ? new Date(post.createdAt).getTime()
      : Date.now();
  return {
    ...post,
    createdAtMs: createdMs,
    createdAt: {
      toDate: () => new Date(createdMs),
      toMillis: () => createdMs,
    },
  };
}

export async function fetchSupabaseCommunityPosts(): Promise<any[]> {
  const rows = await queryHubRows(
    `select=*&video_type=eq.community_post&order=created_at.desc&limit=80`
  );

  const postsMap = new Map<string, any>();
  for (const row of rows) {
    const decoded = decodeHubPayload(row);
    if (!decoded) continue;
    const rawId = decoded.id || String(row.id).replace(/^post_/, '');
    if (decoded.isDeleted) continue;
    postsMap.set(
      rawId,
      hydratePostTimestamps({
        ...decoded,
        id: rawId,
      })
    );
  }

  // One-time background seed of recent Firebase posts so existing community posts remain visible
  if (postsMap.size < 5 && !firebaseSeededFlags.has('seeded_community_posts')) {
    firebaseSeededFlags.add('seeded_community_posts');
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(25));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const fbData = d.data();
        if (fbData.isMigrationNotice) continue;
        if (!postsMap.has(d.id)) {
          const createdMs = fbData.createdAt?.toMillis
            ? fbData.createdAt.toMillis()
            : fbData.createdAt?.toDate
            ? fbData.createdAt.toDate().getTime()
            : Date.now();
          const normalized = hydratePostTimestamps({
            id: d.id,
            ...fbData,
            createdAtMs: createdMs,
          });
          postsMap.set(d.id, normalized);
          saveSupabaseCommunityPost(normalized, false).catch(() => {});
        }
      }
    } catch {
      // ignore if Firebase quota reached
    }
  }

  return Array.from(postsMap.values()).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });
}

export async function saveSupabaseCommunityPost(
  postData: any,
  sendNotificationToAll = false,
  authorProfile?: { fullName?: string; username?: string; photoURL?: string }
): Promise<any> {
  const rawId = String(postData.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).replace(
    /^post_/,
    ''
  );
  const rowId = `post_${rawId}`;
  const createdAtMs =
    typeof postData.createdAtMs === 'number'
      ? postData.createdAtMs
      : postData.createdAt?.toMillis
      ? postData.createdAt.toMillis()
      : Date.now();

  const cleanPost = {
    ...postData,
    id: rawId,
    createdAtMs,
    authorName:
      postData.authorName ||
      authorProfile?.fullName ||
      authorProfile?.username ||
      'Student',
    authorUsername: postData.authorUsername || authorProfile?.username || 'student',
    authorPhoto: postData.authorPhoto || authorProfile?.photoURL || '',
    likesCount: Number(postData.likesCount) || 0,
    dislikesCount: Number(postData.dislikesCount) || 0,
    commentsCount: Number(postData.commentsCount) || 0,
    likedBy: Array.isArray(postData.likedBy) ? postData.likedBy : [],
    dislikedBy: Array.isArray(postData.dislikedBy) ? postData.dislikedBy : [],
  };

  // Remove non-serializable Firestore Date/Timestamp methods before saving JSON
  delete cleanPost.createdAt;
  delete cleanPost.expiresAt;

  await upsertHubRow(
    encodeHubRow({
      id: rowId,
      recordType: 'community_post',
      title: (cleanPost.text || 'Community Post').slice(0, 100),
      description: cleanPost.text || '',
      subject: cleanPost.tag || 'General',
      chapter: cleanPost.communityType || 'JEE',
      author_uid: cleanPost.authorId || 'user',
      author_name: cleanPost.authorName,
      author_username: cleanPost.authorUsername,
      author_photo: cleanPost.authorPhoto,
      views: cleanPost.commentsCount,
      likes: cleanPost.likesCount,
      liked_by: cleanPost.likedBy,
      payload: cleanPost,
      created_at: new Date(createdAtMs).toISOString(),
    })
  );

  if (sendNotificationToAll) {
    await sendSupabaseGlobalNotification(
      cleanPost.authorId,
      cleanPost.authorName,
      cleanPost.authorPhoto,
      'new_post',
      {
        postId: rawId,
        postContent: (cleanPost.text || 'Shared an image / PDF in Community').slice(0, 80),
        postTag: cleanPost.tag || 'General',
        targetUrl: `/community?postId=${rawId}`,
      }
    );
  }

  emitHubSync('community_post', rawId);
  return hydratePostTimestamps(cleanPost);
}

export async function updateSupabaseCommunityPost(
  postId: string,
  basePost: any,
  patch: Record<string, any>
): Promise<any> {
  const rawId = String(postId).replace(/^post_/, '');
  const existingRows = await queryHubRows(
    `select=*&id=eq.${encodeURIComponent(`post_${rawId}`)}&limit=1`
  );
  const current =
    existingRows.length > 0 ? decodeHubPayload(existingRows[0]) : basePost || { id: rawId };
  const merged = {
    ...current,
    ...patch,
    id: rawId,
  };
  return saveSupabaseCommunityPost(merged, false);
}

export async function deleteSupabaseCommunityPost(postId: string): Promise<void> {
  const rawId = String(postId).replace(/^post_/, '');
  await deleteHubRow(`post_${rawId}`);
  emitHubSync('community_post', rawId);
}

export function subscribeSupabaseCommunityPosts(onUpdate: (posts: any[]) => void): () => void {
  let active = true;

  const load = async () => {
    if (!active) return;
    const list = await fetchSupabaseCommunityPosts();
    if (!active) return;
    onUpdate(list);
  };

  load();
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load();
    }
  }, 6000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'community_post') {
      load();
    }
  };
  window.addEventListener(HUB_EVENT_NAME, handleSync);

  return () => {
    active = false;
    clearInterval(interval);
    window.removeEventListener(HUB_EVENT_NAME, handleSync);
  };
}

// ============================================================================
// 7. COMMUNITY POST COMMENTS (`post_comment` in Supabase)
// ============================================================================

export async function fetchSupabasePostComments(postId: string): Promise<any[]> {
  const rawPostId = String(postId).replace(/^post_/, '');
  const rows = await queryHubRows(
    `select=*&video_type=eq.post_comment&chapter=eq.${encodeURIComponent(rawPostId)}&order=created_at.asc&limit=200`
  );

  const commentsMap = new Map<string, any>();
  for (const row of rows) {
    const decoded = decodeHubPayload(row);
    if (!decoded || decoded.isDeleted) continue;
    const ms = decoded.createdAtMs || new Date(row.created_at).getTime();
    const cId = decoded.id || String(row.id).replace(/^pcomment_/, '');
    commentsMap.set(cId, {
      ...decoded,
      id: cId,
      createdAt: {
        toDate: () => new Date(ms),
        toMillis: () => ms,
      },
    });
  }

  // One-time fallback seed from Firebase comments for legacy posts
  const seedKey = `seeded_comments_${rawPostId}`;
  if (commentsMap.size === 0 && !firebaseSeededFlags.has(seedKey)) {
    firebaseSeededFlags.add(seedKey);
    try {
      const q = query(collection(db, 'comments'), where('postId', '==', rawPostId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const fbData = d.data();
        const ms = fbData.createdAt?.toMillis
          ? fbData.createdAt.toMillis()
          : fbData.createdAt?.toDate
          ? fbData.createdAt.toDate().getTime()
          : Date.now();
        const commentObj = {
          ...fbData,
          id: d.id,
          postId: rawPostId,
          createdAtMs: ms,
        };
        delete (commentObj as any).createdAt;
        commentsMap.set(d.id, {
          ...commentObj,
          createdAt: { toDate: () => new Date(ms), toMillis: () => ms },
        });
        saveSupabasePostComment(commentObj).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  return Array.from(commentsMap.values());
}

export async function saveSupabasePostComment(commentData: any): Promise<any> {
  const rawId = String(
    commentData.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  ).replace(/^pcomment_/, '');
  const rawPostId = String(commentData.postId || '').replace(/^post_/, '');
  const createdAtMs = commentData.createdAtMs || Date.now();

  const clean = {
    ...commentData,
    id: rawId,
    postId: rawPostId,
    createdAtMs,
    likesCount: Number(commentData.likesCount) || 0,
    likedBy: Array.isArray(commentData.likedBy) ? commentData.likedBy : [],
  };
  delete clean.createdAt;
  delete clean.updatedAt;

  await upsertHubRow(
    encodeHubRow({
      id: `pcomment_${rawId}`,
      recordType: 'post_comment',
      title: (clean.text || 'Comment').slice(0, 80),
      description: clean.text || '',
      subject: 'Comment',
      chapter: rawPostId,
      author_uid: clean.authorId || 'user',
      author_name: clean.authorName || 'Student',
      author_photo: clean.authorPhoto || '',
      likes: clean.likesCount,
      liked_by: clean.likedBy,
      payload: clean,
      created_at: new Date(createdAtMs).toISOString(),
    })
  );

  emitHubSync('post_comment', rawPostId);
  return {
    ...clean,
    createdAt: {
      toDate: () => new Date(createdAtMs),
      toMillis: () => createdAtMs,
    },
  };
}

export async function deleteSupabasePostComment(commentId: string): Promise<void> {
  const rawId = String(commentId).replace(/^pcomment_/, '');
  await deleteHubRow(`pcomment_${rawId}`);
  emitHubSync('post_comment', rawId);
}

export function subscribeSupabasePostComments(
  postId: string,
  postAuthorId: string,
  onUpdate: (comments: any[]) => void
): () => void {
  let active = true;
  const rawPostId = String(postId).replace(/^post_/, '');

  const load = async () => {
    if (!active || !rawPostId) return;
    const list = await fetchSupabasePostComments(rawPostId);
    if (!active) return;

    const sorted = list.sort((a: any, b: any) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      if (a.authorId === postAuthorId && b.authorId !== postAuthorId) return -1;
      if (a.authorId !== postAuthorId && b.authorId === postAuthorId) return 1;
      const aVotes = (a.upvotes || 0) - (a.downvotes || 0);
      const bVotes = (b.upvotes || 0) - (b.downvotes || 0);
      if (aVotes !== bVotes) return bVotes - aVotes;
      const aMs = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAtMs || 0;
      const bMs = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAtMs || 0;
      return aMs - bMs;
    });

    onUpdate(sorted);
  };

  load();
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load();
    }
  }, 3500);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'post_comment') {
      load();
    }
  };
  window.addEventListener(HUB_EVENT_NAME, handleSync);

  return () => {
    active = false;
    clearInterval(interval);
    window.removeEventListener(HUB_EVENT_NAME, handleSync);
  };
}
