import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, getCloudConfig } from './edutube';

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
const CLEARED_NOTIF_IDS_KEY = 'jee_hub_cleared_notif_ids_v1';
const SEEN_LIVE_TOAST_IDS_KEY = 'jee_hub_seen_live_toasts_v1';

const FAST_POSTS_CACHE_KEY = 'jee_hub_fast_posts_v2';
const FAST_SESSIONS_CACHE_KEY = 'jee_hub_fast_sessions_v2';
const FAST_NOTIFS_CACHE_KEY = 'jee_hub_fast_notifs_v2';

// ============================================================================
// HIGH-SPEED IN-MEMORY CACHES & REQUEST DEDUPLICATION
// ============================================================================
const profileMemoryCache = new Map<string, any>();
const profileInFlight = new Map<string, Promise<any | null>>();
const inFlightQueries = new Map<string, Promise<any[]>>();

let postsMemoryCache: any[] | null = null;
let postsLastFetchedAt = 0;

let sessionsMemoryCache: { date: string; list: any[]; ts: number } | null = null;
const mySessionMemoryCache = new Map<string, any>();

const commentsMemoryCache = new Map<string, any[]>();
const notesMemoryCache = new Map<string, any[]>();
const notifsMemoryCache = new Map<string, any[]>();

/**
 * Prevents raw multi-kilobyte base64 strings from bloating Supabase JSON rows.
 */
function sanitizePhotoUrl(photo?: string | null): string {
  if (!photo || typeof photo !== 'string') return '';
  if (photo.startsWith('data:image/') && photo.length > 1800) {
    return '';
  }
  return photo;
}

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
  const cleanPhoto = sanitizePhotoUrl(params.author_photo);
  return {
    id: params.id,
    title: params.title || 'Record',
    description: params.description || '',
    video_url: `blob://${params.recordType}`,
    thumbnail_url: cleanPhoto,
    duration: '00:00',
    video_type: params.recordType,
    subject: params.subject || params.recordType,
    chapter: params.chapter || 'general',
    author_uid: params.author_uid || 'system',
    author_name: params.author_name || 'User',
    author_username: params.author_username || 'user',
    author_photo: cleanPhoto,
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

/**
 * Deduplicated query helper: if two components request the exact same query simultaneously,
 * they share a single network round-trip.
 */
export async function queryHubRows(queryString: string): Promise<any[]> {
  const existingPromise = inFlightQueries.get(queryString);
  if (existingPromise) return existingPromise;

  const promise = (async () => {
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
    } finally {
      inFlightQueries.delete(queryString);
    }
  })();

  inFlightQueries.set(queryString, promise);
  return promise;
}

// ============================================================================
// 1. SMART USER PROFILE CACHE (0 Firebase Reads, Deduplicated In-Flight)
// ============================================================================

export function getInstantCachedUserProfile(uid: string): any | null {
  if (!uid) return null;
  if (profileMemoryCache.has(uid)) {
    return profileMemoryCache.get(uid);
  }
  try {
    const localRaw = localStorage.getItem(`jee_uprofile_${uid}`);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed) {
        profileMemoryCache.set(uid, parsed);
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getCachedUserProfile(uid: string): Promise<any | null> {
  if (!uid) return null;
  const instant = getInstantCachedUserProfile(uid);
  if (instant && Date.now() - (instant._cachedAt || 0) < 12 * 3600 * 1000) {
    return instant._notFound ? null : instant;
  }

  const inflight = profileInFlight.get(uid);
  if (inflight) return inflight;

  const fetchPromise = (async () => {
    try {
      const rows = await queryHubRows(
        `select=id,created_at,comments&id=eq.${encodeURIComponent(`uprofile_${uid}`)}&limit=1`
      );
      if (rows.length > 0) {
        const decoded = decodeHubPayload(rows[0]);
        if (decoded) {
          decoded.photoURL = sanitizePhotoUrl(decoded.photoURL);
          const withTs = { ...decoded, _cachedAt: Date.now() };
          profileMemoryCache.set(uid, withTs);
          try {
            localStorage.setItem(`jee_uprofile_${uid}`, JSON.stringify(withTs));
          } catch {
            // ignore
          }
          return decoded;
        }
      }

      // Negative cache for 15 minutes so missing profiles don't trigger repeated network requests
      const fallbackEntry = instant || { _notFound: true, _cachedAt: Date.now() };
      profileMemoryCache.set(uid, fallbackEntry);
      return instant && !instant._notFound ? instant : null;
    } finally {
      profileInFlight.delete(uid);
    }
  })();

  profileInFlight.set(uid, fetchPromise);
  return fetchPromise;
}

export async function cacheUserProfileInSupabase(uid: string, profileData: any): Promise<void> {
  if (!uid || !profileData) return;
  const cleanPhoto = sanitizePhotoUrl(profileData.photoURL || profileData.avatar || '');
  const clean = {
    uid,
    fullName: profileData.fullName || profileData.name || 'Student',
    username: profileData.username || 'student',
    photoURL: cleanPhoto,
    role: profileData.role || 'user',
    targetExam: profileData.targetExam || 'JEE',
    cheersEnabled: profileData.cheersEnabled !== false,
    campus: profileData.campus || { totalCoins: 0, totalXP: 0 },
  };
  const withTs = { ...clean, _cachedAt: Date.now() };
  profileMemoryCache.set(uid, withTs);
  try {
    localStorage.setItem(`jee_uprofile_${uid}`, JSON.stringify(withTs));
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
      author_photo: cleanPhoto,
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

export function getClearedNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(CLEARED_NOTIF_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearAllNotificationsForUser(idsToClear: string[] = []): void {
  try {
    localStorage.setItem(CLEARED_NOTIFS_TS_KEY, String(Date.now() + 60000));
    if (idsToClear.length > 0) {
      const existing = getClearedNotificationIds();
      const merged = Array.from(new Set([...idsToClear, ...existing])).slice(0, 400);
      localStorage.setItem(CLEARED_NOTIF_IDS_KEY, JSON.stringify(merged));
    }
    notifsMemoryCache.clear();
    localStorage.removeItem(FAST_NOTIFS_CACHE_KEY);
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

  const cleanAvatar = sanitizePhotoUrl(data.senderAvatar);
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload: HubNotificationPayload = {
    id,
    recipientId: data.recipientId,
    senderId: data.senderId,
    senderName: data.senderName || 'Community Member',
    senderAvatar: cleanAvatar,
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
      author_photo: cleanAvatar,
      payload,
    })
  );

  emitHubSync('hub_notification', id);
}

/**
 * Broadcasts ONE single global notification row (`chapter: 'ALL'`) to all users in Supabase!
 */
export async function sendSupabaseGlobalNotification(
  senderId: string,
  senderName: string,
  senderAvatar: string,
  type: string,
  extraData: Record<string, any> = {}
): Promise<void> {
  const cleanAvatar = sanitizePhotoUrl(senderAvatar);
  const id = `notif_global_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const payload: HubNotificationPayload = {
    id,
    recipientId: 'ALL',
    senderId: senderId || 'system',
    senderName: senderName || 'JEE Community Member',
    senderAvatar: cleanAvatar,
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
      author_photo: cleanAvatar,
      payload,
    })
  );

  emitHubSync('hub_notification', id);
}

export async function fetchUserSupabaseNotifications(uid: string): Promise<any[]> {
  if (!uid) return [];
  const rows = await queryHubRows(
    `select=id,created_at,comments&video_type=eq.hub_notification&chapter=in.(ALL,${encodeURIComponent(uid)})&order=created_at.desc&limit=20`
  );
  const readIds = getReadNotificationIds();
  const clearedIds = getClearedNotificationIds();
  const clearedBefore = Number(localStorage.getItem(CLEARED_NOTIFS_TS_KEY) || '0');

  const results: any[] = [];
  for (const row of rows) {
    const p = decodeHubPayload<HubNotificationPayload>(row);
    if (!p) continue;
    if (p.recipientId === 'ALL' && p.senderId === uid) continue;
    const notifId = p.id || row.id;
    if (clearedIds.includes(notifId) || clearedIds.includes(row.id)) continue;

    const createdAtMs = p.createdAtMs || new Date(row.created_at).getTime();
    if (clearedBefore > 0 && createdAtMs <= clearedBefore) continue;

    const isRead = Boolean(p.isRead || readIds.includes(p.id) || readIds.includes(row.id));
    results.push({
      ...p,
      senderAvatar: sanitizePhotoUrl(p.senderAvatar),
      id: notifId,
      isRead,
      createdAt: {
        toDate: () => new Date(createdAtMs),
        toMillis: () => createdAtMs,
      },
    });
  }

  const sorted = results.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  notifsMemoryCache.set(uid, sorted);
  return sorted;
}

export function subscribeSupabaseNotifications(
  uid: string,
  onUpdate: (notifs: any[], newArrival?: any) => void
): () => void {
  let active = true;
  let initialLoadDone = false;

  // Instant 0ms cache emission
  const cached = notifsMemoryCache.get(uid);
  if (cached) {
    onUpdate(cached, undefined);
  }

  const load = async () => {
    if (!active || !uid) return;
    const list = await fetchUserSupabaseNotifications(uid);
    if (!active) return;

    let newestUnseen: any = undefined;
    const seenToasts = getSeenLiveToastIds();

    if (!initialLoadDone) {
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
  }, 30000);

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
    photoURL: sanitizePhotoUrl(data.photoURL),
    lastUpdatedMs,
    lastUpdated: {
      toMillis: () => lastUpdatedMs,
      toDate: () => new Date(lastUpdatedMs),
    },
  };
}

function getInstantSessionsCache(todayDate: string): any[] | null {
  if (sessionsMemoryCache && sessionsMemoryCache.date === todayDate) {
    return sessionsMemoryCache.list;
  }
  try {
    const raw = localStorage.getItem(FAST_SESSIONS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === todayDate && Array.isArray(parsed.list)) {
        const hydrated = parsed.list.map(normalizeSessionTimestamps).filter(Boolean);
        sessionsMemoryCache = { date: todayDate, list: hydrated, ts: parsed.ts || 0 };
        return hydrated;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getSupabaseStudySession(uid: string): Promise<any | null> {
  if (!uid) return null;
  const localMem = mySessionMemoryCache.get(uid);
  const rows = await queryHubRows(
    `select=id,created_at,comments&id=eq.${encodeURIComponent(`session_${uid}`)}&limit=1`
  );
  if (rows.length > 0) {
    const decoded = decodeHubPayload(rows[0]);
    if (decoded) {
      const norm = normalizeSessionTimestamps(decoded);
      if (localMem && (localMem.lastUpdatedMs || 0) > (norm.lastUpdatedMs || 0)) {
        return localMem;
      }
      mySessionMemoryCache.set(uid, norm);
      return norm;
    }
  }
  return localMem || null;
}

export async function saveSupabaseStudySession(uid: string, sessionData: any): Promise<any> {
  const existing = mySessionMemoryCache.get(uid) || (await getSupabaseStudySessionOnceNoFallback(uid));
  const merged: any = {
    ...(existing || {}),
    ...sessionData,
    id: uid,
    uid,
    photoURL: sanitizePhotoUrl(sessionData.photoURL ?? existing?.photoURL),
    lastUpdatedMs: Date.now(),
  };

  // Protect against accidental 0-time reset on the same day if a network request failed earlier
  if (
    existing &&
    existing.dailyDate &&
    merged.dailyDate === existing.dailyDate &&
    (Number(merged.accumulatedTime) || 0) < (Number(existing.accumulatedTime) || 0)
  ) {
    merged.accumulatedTime = existing.accumulatedTime;
  }

  if (merged.lastUpdated && typeof merged.lastUpdated.toMillis !== 'function') {
    delete merged.lastUpdated;
  }

  // Keep weeklyData compact (latest 10 days max) so session rows stay < 2 KB
  if (merged.weeklyData && typeof merged.weeklyData === 'object') {
    const keys = Object.keys(merged.weeklyData).sort();
    if (keys.length > 10) {
      const nextWeekly: Record<string, any> = {};
      for (const k of keys.slice(-10)) {
        nextWeekly[k] = merged.weeklyData[k];
      }
      merged.weeklyData = nextWeekly;
    }
  }

  const normalized = normalizeSessionTimestamps(merged);
  mySessionMemoryCache.set(uid, normalized);

  // Optimistically update in-memory sessions list
  if (sessionsMemoryCache) {
    const filtered = sessionsMemoryCache.list.filter((s) => (s.uid || s.id) !== uid);
    sessionsMemoryCache.list = [normalized, ...filtered];
  }
  emitHubSync('study_session', uid);

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
  return normalized;
}

async function getSupabaseStudySessionOnceNoFallback(uid: string): Promise<any | null> {
  const rows = await queryHubRows(
    `select=id,created_at,comments&id=eq.${encodeURIComponent(`session_${uid}`)}&limit=1`
  );
  if (rows.length > 0) {
    return decodeHubPayload(rows[0]);
  }
  return null;
}

export async function fetchAllSupabaseStudySessions(todayDate: string): Promise<any[]> {
  // Share recent result if fetched within last 8s (prevents duplicate polling from Layout + LiveStudy)
  if (
    sessionsMemoryCache &&
    sessionsMemoryCache.date === todayDate &&
    Date.now() - sessionsMemoryCache.ts < 8000
  ) {
    return sessionsMemoryCache.list;
  }

  // Only fetch today's study sessions or currently studying sessions!
  const rows = await queryHubRows(
    `select=id,created_at,comments&video_type=eq.study_session&or=(subject.eq.${encodeURIComponent(todayDate)},chapter.eq.studying)&limit=60`
  );

  const map = new Map<string, any>();
  for (const row of rows) {
    const decoded = decodeHubPayload(row);
    if (!decoded || !decoded.uid) continue;
    const norm = normalizeSessionTimestamps(decoded);
    const localMem = mySessionMemoryCache.get(decoded.uid);
    const latest =
      localMem && (localMem.lastUpdatedMs || 0) > (norm.lastUpdatedMs || 0) ? localMem : norm;
    map.set(decoded.uid, latest);
    mySessionMemoryCache.set(decoded.uid, latest);
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

  const sorted = allSessions.sort((a, b) => {
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

  sessionsMemoryCache = { date: todayDate, list: sorted, ts: Date.now() };
  try {
    localStorage.setItem(
      FAST_SESSIONS_CACHE_KEY,
      JSON.stringify({
        date: todayDate,
        ts: Date.now(),
        list: sorted.slice(0, 30).map((s) => {
          const copy = { ...s };
          delete copy.lastUpdated;
          delete copy.weeklyData;
          return copy;
        }),
      })
    );
  } catch {
    // ignore
  }

  return sorted;
}

export function subscribeSupabaseStudySessions(
  uid: string,
  todayDate: string,
  onUpdate: (allSessions: any[], mySession: any | null) => void
): () => void {
  let active = true;

  // Instant 0ms cache hydration before network request
  const cachedAll = getInstantSessionsCache(todayDate);
  const cachedMine =
    (uid && mySessionMemoryCache.get(uid)) ||
    (cachedAll ? cachedAll.find((s) => (s.uid || s.id) === uid) || null : null);
  if (cachedAll) {
    onUpdate(cachedAll, cachedMine);
  }

  const refresh = async () => {
    if (!active) return;
    const all = await fetchAllSupabaseStudySessions(todayDate);
    if (!active) return;
    let mine = uid ? all.find((s) => (s.uid || s.id) === uid) || mySessionMemoryCache.get(uid) || null : null;
    if (uid && !mine) {
      mine = await getSupabaseStudySession(uid);
    }
    if (!active) return;
    onUpdate(all, mine);
  };

  refresh();
  const timer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      refresh();
    }
  }, 15000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'study_session') {
      if (sessionsMemoryCache && e?.detail?.id) {
        onUpdate(
          sessionsMemoryCache.list,
          uid ? mySessionMemoryCache.get(uid) || null : null
        );
      }
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
    `select=id,created_at,comments&video_type=eq.study_group&order=created_at.desc&limit=80`
  );
  const groupsMap = new Map<string, any>();

  for (const row of rows) {
    const g = decodeHubPayload(row);
    if (g && Array.isArray(g.members) && g.members.includes(uid)) {
      groupsMap.set(g.id || g.shortCode, g);
    }
  }

  return Array.from(groupsMap.values());
}

export async function getSupabaseStudyGroupByCode(shortCode: string): Promise<any | null> {
  const code = shortCode.trim().toUpperCase();
  const rows = await queryHubRows(
    `select=id,created_at,comments&id=eq.${encodeURIComponent(`group_${code}`)}&limit=1`
  );
  if (rows.length > 0) {
    const decoded = decodeHubPayload(rows[0]);
    if (decoded) return decoded;
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
      author_photo: sanitizePhotoUrl(merged.photoURL),
      liked_by: Array.isArray(merged.members) ? merged.members : [],
      payload: merged,
    })
  );

  emitHubSync('study_group', code);
  return merged;
}

async function getSupabaseStudyGroupByCodeNoFallback(code: string): Promise<any | null> {
  const rows = await queryHubRows(
    `select=id,created_at,comments&id=eq.${encodeURIComponent(`group_${code}`)}&limit=1`
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
  const nextMsgs = [...currentMsgs, newMsg].slice(-80);

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
  }, 8000);

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
// 5. NOTES HUB (`notes_hub` in Supabase + Instant Cache)
// ============================================================================

export async function fetchSupabaseNotes(category: string, subject: string): Promise<any[]> {
  const cacheKey = `${category}__${subject}`;
  const rows = await queryHubRows(
    `select=id,created_at,views,likes,comments&video_type=eq.notes_hub&chapter=eq.${encodeURIComponent(category)}&subject=eq.${encodeURIComponent(subject)}&order=created_at.desc&limit=100`
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

  const sorted = Array.from(notesMap.values()).sort(
    (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
  );
  notesMemoryCache.set(cacheKey, sorted);
  return sorted;
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
  const cleanAvatar = sanitizePhotoUrl(params.uploadedBy.avatar);
  const payload = {
    id,
    title: params.title,
    description: params.description,
    category: params.category,
    subject: params.subject,
    fileUrl: params.fileUrl,
    uploadedBy: { ...params.uploadedBy, avatar: cleanAvatar },
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
      author_photo: cleanAvatar,
      views: 1,
      likes: 0,
      payload,
    })
  );

  sendSupabaseGlobalNotification(
    params.uploadedBy.uid,
    params.uploadedBy.name,
    cleanAvatar,
    'note_upload',
    {
      noteId: id,
      noteTitle: params.title,
      noteCategory: params.category,
      noteSubject: params.subject,
      targetUrl: '/notes',
    }
  ).catch(() => {});

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
// 6. COMMUNITY POSTS (`community_post` in Supabase - 0ms Instant Cache!)
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
  const minViewsFromEngagement =
    (Number(post.likesCount) || 0) * 4 +
    (Number(post.dislikesCount) || 0) * 2 +
    (Number(post.commentsCount) || 0) * 3 +
    1;
  const resolvedViews = Math.max(Number(post.viewsCount) || 0, minViewsFromEngagement);
  return {
    ...post,
    viewsCount: resolvedViews,
    authorPhoto: sanitizePhotoUrl(post.authorPhoto),
    createdAtMs: createdMs,
    createdAt: {
      toDate: () => new Date(createdMs),
      toMillis: () => createdMs,
    },
  };
}

function sortCommunityPosts(list: any[]): any[] {
  return [...list].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });
}

function saveFastPostsCache(posts: any[]) {
  postsMemoryCache = posts;
  postsLastFetchedAt = Date.now();
  try {
    const serializable = posts.slice(0, 40).map((p) => {
      const copy = { ...p };
      delete copy.createdAt;
      return copy;
    });
    localStorage.setItem(FAST_POSTS_CACHE_KEY, JSON.stringify(serializable));
  } catch {
    // ignore storage quota
  }
}

export function getInstantCommunityPosts(): any[] {
  if (postsMemoryCache && postsMemoryCache.length > 0) {
    return postsMemoryCache;
  }
  try {
    const raw = localStorage.getItem(FAST_POSTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        postsMemoryCache = sortCommunityPosts(parsed.map(hydratePostTimestamps));
        return postsMemoryCache;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export async function fetchSupabaseCommunityPosts(forceNetwork = false): Promise<any[]> {
  if (!forceNetwork && postsMemoryCache && Date.now() - postsLastFetchedAt < 8000) {
    return postsMemoryCache;
  }

  const rows = await queryHubRows(
    `select=id,created_at,comments&video_type=eq.community_post&order=created_at.desc&limit=45`
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

  const sorted = sortCommunityPosts(Array.from(postsMap.values()));
  if (sorted.length > 0 || !postsMemoryCache) {
    saveFastPostsCache(sorted);
  }
  return sorted;
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

  const cleanPhoto = sanitizePhotoUrl(postData.authorPhoto || authorProfile?.photoURL || '');
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
    authorPhoto: cleanPhoto,
    likesCount: Number(postData.likesCount) || 0,
    dislikesCount: Number(postData.dislikesCount) || 0,
    commentsCount: Number(postData.commentsCount) || 0,
    viewsCount: Math.max(Number(postData.viewsCount) || 1, 1),
    likedBy: Array.isArray(postData.likedBy) ? postData.likedBy : [],
    dislikedBy: Array.isArray(postData.dislikedBy) ? postData.dislikedBy : [],
  };

  delete cleanPost.createdAt;
  delete cleanPost.expiresAt;

  const hydrated = hydratePostTimestamps(cleanPost);

  // Optimistically update in-memory + localStorage cache in 0ms!
  const currentList = getInstantCommunityPosts();
  const withoutThis = currentList.filter((p) => p.id !== rawId);
  saveFastPostsCache(sortCommunityPosts([hydrated, ...withoutThis]));
  emitHubSync('community_post', rawId);

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
      author_photo: cleanPhoto,
      views: cleanPost.commentsCount,
      likes: cleanPost.likesCount,
      liked_by: cleanPost.likedBy,
      payload: cleanPost,
      created_at: new Date(createdAtMs).toISOString(),
    })
  );

  if (sendNotificationToAll) {
    sendSupabaseGlobalNotification(
      cleanPost.authorId,
      cleanPost.authorName,
      cleanPhoto,
      'new_post',
      {
        postId: rawId,
        postContent: (cleanPost.text || 'Shared an image / PDF in Community').slice(0, 80),
        postTag: cleanPost.tag || 'General',
        targetUrl: `/community?postId=${rawId}`,
      }
    ).catch(() => {});
  }

  return hydrated;
}

export async function updateSupabaseCommunityPost(
  postId: string,
  basePost: any,
  patch: Record<string, any>
): Promise<any> {
  const rawId = String(postId).replace(/^post_/, '');
  const cachedMatch = getInstantCommunityPosts().find((p) => p.id === rawId);
  const current = cachedMatch || basePost || { id: rawId };
  const merged = {
    ...current,
    ...patch,
    id: rawId,
  };
  return saveSupabaseCommunityPost(merged, false);
}

export async function deleteSupabaseCommunityPost(postId: string): Promise<void> {
  const rawId = String(postId).replace(/^post_/, '');
  const currentList = getInstantCommunityPosts();
  saveFastPostsCache(currentList.filter((p) => p.id !== rawId));
  emitHubSync('community_post', rawId);
  await deleteHubRow(`post_${rawId}`);
}

export function subscribeSupabaseCommunityPosts(onUpdate: (posts: any[]) => void): () => void {
  let active = true;

  // Instant 0ms render from memory / localStorage cache
  const instant = getInstantCommunityPosts();
  if (instant.length > 0) {
    onUpdate(instant);
  }

  const load = async (force = false) => {
    if (!active) return;
    const list = await fetchSupabaseCommunityPosts(force);
    if (!active) return;
    onUpdate(list);
  };

  load(true);
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load(true);
    }
  }, 20000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'community_post') {
      if (postsMemoryCache && active) {
        onUpdate(postsMemoryCache);
      }
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
// 7. COMMUNITY POST COMMENTS (`post_comment` in Supabase - 0ms Optimistic!)
// ============================================================================

function hydrateCommentItem(decoded: any, fallbackMs?: number): any {
  const ms = decoded.createdAtMs || fallbackMs || Date.now();
  const cId = decoded.id || String(decoded._rowId || '').replace(/^pcomment_/, '');
  return {
    ...decoded,
    id: cId,
    authorPhoto: sanitizePhotoUrl(decoded.authorPhoto),
    createdAtMs: ms,
    createdAt: {
      toDate: () => new Date(ms),
      toMillis: () => ms,
    },
  };
}

function getInstantPostComments(rawPostId: string): any[] | null {
  if (commentsMemoryCache.has(rawPostId)) {
    return commentsMemoryCache.get(rawPostId) || null;
  }
  try {
    const raw = localStorage.getItem(`jee_fast_comments_${rawPostId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const hydrated = parsed.map((c) => hydrateCommentItem(c));
        commentsMemoryCache.set(rawPostId, hydrated);
        return hydrated;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function saveInstantPostComments(rawPostId: string, list: any[]) {
  commentsMemoryCache.set(rawPostId, list);
  try {
    const serializable = list.slice(0, 100).map((c) => {
      const copy = { ...c };
      delete copy.createdAt;
      return copy;
    });
    localStorage.setItem(`jee_fast_comments_${rawPostId}`, JSON.stringify(serializable));
  } catch {
    // ignore
  }
}

export async function fetchSupabasePostComments(postId: string): Promise<any[]> {
  const rawPostId = String(postId).replace(/^post_/, '');
  const rows = await queryHubRows(
    `select=id,created_at,comments&video_type=eq.post_comment&chapter=eq.${encodeURIComponent(rawPostId)}&order=created_at.asc&limit=120`
  );

  const commentsMap = new Map<string, any>();
  for (const row of rows) {
    const decoded = decodeHubPayload(row);
    if (!decoded || decoded.isDeleted) continue;
    const ms = decoded.createdAtMs || new Date(row.created_at).getTime();
    const hydrated = hydrateCommentItem(decoded, ms);
    commentsMap.set(hydrated.id, hydrated);
  }

  const list = Array.from(commentsMap.values());
  saveInstantPostComments(rawPostId, list);
  return list;
}

export async function saveSupabasePostComment(commentData: any): Promise<any> {
  const rawId = String(
    commentData.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  ).replace(/^pcomment_/, '');
  const rawPostId = String(commentData.postId || '').replace(/^post_/, '');
  const createdAtMs = commentData.createdAtMs || Date.now();
  const cleanPhoto = sanitizePhotoUrl(commentData.authorPhoto);

  const clean = {
    ...commentData,
    id: rawId,
    postId: rawPostId,
    authorPhoto: cleanPhoto,
    createdAtMs,
    likesCount: Number(commentData.likesCount) || 0,
    likedBy: Array.isArray(commentData.likedBy) ? commentData.likedBy : [],
  };
  delete clean.createdAt;
  delete clean.updatedAt;

  const hydrated = hydrateCommentItem(clean, createdAtMs);

  // Instant 0ms optimistic update in memory + localStorage BEFORE network call!
  const existing = getInstantPostComments(rawPostId) || [];
  const filtered = existing.filter((c) => c.id !== rawId);
  const nextList = clean.isDeleted ? filtered : [...filtered, hydrated];
  saveInstantPostComments(rawPostId, nextList);
  emitHubSync('post_comment', rawPostId);

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
      author_photo: cleanPhoto,
      likes: clean.likesCount,
      liked_by: clean.likedBy,
      payload: clean,
      created_at: new Date(createdAtMs).toISOString(),
    })
  );

  return hydrated;
}

export async function deleteSupabasePostComment(commentId: string, postId?: string): Promise<void> {
  const rawId = String(commentId).replace(/^pcomment_/, '');
  if (postId) {
    const rawPostId = String(postId).replace(/^post_/, '');
    const existing = getInstantPostComments(rawPostId) || [];
    saveInstantPostComments(
      rawPostId,
      existing.filter((c) => c.id !== rawId)
    );
    emitHubSync('post_comment', rawPostId);
  }
  await deleteHubRow(`pcomment_${rawId}`);
  emitHubSync('post_comment', rawId);
}

function sortPostComments(list: any[], postAuthorId: string): any[] {
  return [...list].sort((a: any, b: any) => {
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
}

export function subscribeSupabasePostComments(
  postId: string,
  postAuthorId: string,
  onUpdate: (comments: any[]) => void
): () => void {
  let active = true;
  const rawPostId = String(postId).replace(/^post_/, '');

  // Instant 0ms cache emit if we already opened this post earlier
  const cached = getInstantPostComments(rawPostId);
  if (cached) {
    onUpdate(sortPostComments(cached, postAuthorId));
  }

  const load = async () => {
    if (!active || !rawPostId) return;
    const list = await fetchSupabasePostComments(rawPostId);
    if (!active) return;
    onUpdate(sortPostComments(list, postAuthorId));
  };

  load();
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load();
    }
  }, 12000);

  const handleSync = (e: any) => {
    if (!e?.detail?.recordType || e.detail.recordType === 'post_comment') {
      const latestMem = commentsMemoryCache.get(rawPostId);
      if (latestMem && active) {
        onUpdate(sortPostComments(latestMem, postAuthorId));
      }
    }
  };
  window.addEventListener(HUB_EVENT_NAME, handleSync);

  return () => {
    active = false;
    clearInterval(interval);
    window.removeEventListener(HUB_EVENT_NAME, handleSync);
  };
}
