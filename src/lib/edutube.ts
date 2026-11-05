export type VideoFormat = 'long' | 'short' | 'live';
export type StorageProviderType = 'supabase' | 'imagekit' | 'external' | 'local';

export interface EduTubeComment {
  id: string;
  author_uid: string;
  author_name: string;
  author_username: string;
  author_photo?: string;
  text: string;
  created_at: string;
}

export interface EduTubeVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  video_type: VideoFormat;
  tags: string[];
  author_uid: string;
  author_name: string;
  author_username: string;
  author_photo?: string;
  views: number;
  likes: number;
  liked_by: string[];
  comments: EduTubeComment[];
  storage_provider: StorageProviderType;
  created_at: string;
}

export interface EduTubeChannel {
  uid: string;
  name: string;
  handle: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  subscribers: string[];
  created_at: string;
}

export interface EduTubeCloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  imagekitEndpoint?: string;
  imagekitPublicKey?: string;
}

export const DEFAULT_SUPABASE_URL = 'https://siudeeqkpljaxgivnydh.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_9aKQYQw4vLugc4XLpcxZpg_48H40ySl';

export const JEE_COMMUNITY_OFFICIAL_LOGO_URL =
  'https://siudeeqkpljaxgivnydh.supabase.co/storage/v1/object/public/edutube-media/thumbnails/jc_official_logo_1793722522.svg';
export const JEE_COMMUNITY_OFFICIAL_BANNER_URL =
  'https://siudeeqkpljaxgivnydh.supabase.co/storage/v1/object/public/edutube-media/thumbnails/jc_official_banner_1793722522.svg';
export const JEE_COMMUNITY_OFFICIAL_BIO =
  'Official Video & Creator Hub of JEE Community 🇮🇳 | Watch Concept Breakdowns, Problem Solutions, Study Strategies, Campus Vlogs & Quick Shorts. Subscribe & share your own videos with the community!';

const LOCAL_VIDEOS_KEY = 'edutube_videos_cache_v6';
const LOCAL_CHANNELS_KEY = 'edutube_channels_cache_v8';
const LOCAL_DELETED_IDS_KEY = 'edutube_deleted_ids_v1';
const LOCAL_CONFIG_KEY = 'edutube_cloud_config_v1';
const SAVED_VIDEOS_KEY = 'edutube_saved_ids_v1';

// 40 MB chunk threshold so we never hit Supabase Free Plan's 50 MB per-object limit
const CHUNK_SIZE_BYTES = 40 * 1024 * 1024;

// In-memory cache of resolved object URLs for multi-part large videos
const resolvedChunkVideoCache = new Map<string, string>();

// Helper to generate crisp SVG DataURL thumbnails so there are zero external broken links
function createSvgThumbnail(
  title: string,
  subtitle: string,
  badgeText: string,
  accentHex: string,
  bgHex1: string,
  bgHex2: string
): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeSub = subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeBadge = badgeText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex1}" />
        <stop offset="100%" stop-color="${bgHex2}" />
      </linearGradient>
      <radialGradient id="glow" cx="80%" cy="20%" r="55%">
        <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.32" />
        <stop offset="100%" stop-color="${accentHex}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#bg)" />
    <rect width="1280" height="720" fill="url(#glow)" />
    <g stroke="#ffffff" stroke-opacity="0.05" stroke-width="2">
      <line x1="0" y1="180" x2="1280" y2="180" />
      <line x1="0" y1="360" x2="1280" y2="360" />
      <line x1="0" y1="540" x2="1280" y2="540" />
      <line x1="320" y1="0" x2="320" y2="720" />
      <line x1="640" y1="0" x2="640" y2="720" />
      <line x1="960" y1="0" x2="960" y2="720" />
    </g>
    <rect x="80" y="88" width="240" height="46" rx="8" fill="${accentHex}" fill-opacity="0.2" stroke="${accentHex}" stroke-width="2" />
    <text x="200" y="119" font-family="Plus Jakarta Sans, sans-serif" font-size="22" font-weight="700" fill="${accentHex}" text-anchor="middle">${safeBadge}</text>
    <text x="80" y="310" font-family="Plus Jakarta Sans, sans-serif" font-size="56" font-weight="800" fill="#F8FAFC">${safeTitle}</text>
    <text x="80" y="395" font-family="Plus Jakarta Sans, sans-serif" font-size="32" font-weight="600" fill="#94A3B8">${safeSub}</text>
    <text x="80" y="625" font-family="IBM Plex Mono, monospace" font-size="24" font-weight="600" fill="#E2E8F0">EDUTUBE · CREATOR STUDIO</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createChannelBannerSvg(_channelName?: string, _handle?: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="320" viewBox="0 0 1600 320">
    <defs>
      <linearGradient id="cbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="50%" stop-color="#1E293B" />
        <stop offset="100%" stop-color="#0F172A" />
      </linearGradient>
    </defs>
    <rect width="1600" height="320" fill="url(#cbg)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Extracts normalized `#hashtags` from a tag string + title + description
 */
export function parseVideoTags(rawTagsInput: string | string[], title = '', description = ''): string[] {
  const combined: string[] = [];

  if (Array.isArray(rawTagsInput)) {
    combined.push(...rawTagsInput);
  } else if (typeof rawTagsInput === 'string' && rawTagsInput.trim()) {
    combined.push(...rawTagsInput.split(/[\s,]+/));
  }

  const textMatches = `${title} ${description}`.match(/#[a-zA-Z0-9_]+/g);
  if (textMatches) {
    combined.push(...textMatches);
  }

  const normalized = combined
    .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
    .filter((t) => t.length > 1 && t !== 'general')
    .map((t) => `#${t}`);

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique.slice(0, 12) : ['#edutube', '#video'];
}

const INITIAL_SEED_CHANNELS: EduTubeChannel[] = [
  {
    uid: 'system-educator-1',
    name: 'Aarav Sharma (IITB)',
    handle: 'aarav_iitb',
    bio: 'Sharing step-by-step problem solutions, study vlogs, and deep concept breakdowns.',
    avatar_url: '',
    banner_url: createChannelBannerSvg('Aarav Sharma (IITB)', 'aarav_iitb'),
    subscribers: ['student-1', 'student-2'],
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
  },
  {
    uid: 'system-educator-2',
    name: 'Priya Study Hub',
    handle: 'priya_tricks',
    bio: '10-minute shortcuts, daily question solutions & exam strategy videos!',
    avatar_url: '',
    banner_url: createChannelBannerSvg('Priya Study Hub', 'priya_tricks'),
    subscribers: ['student-1'],
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 7).toISOString(),
  },
  {
    uid: 'system-educator-3',
    name: 'Kabir Shorts & Tricks',
    handle: 'kabir_shorts',
    bio: '60-second revision shorts, quick tricks, and daily motivation.',
    avatar_url: '',
    banner_url: createChannelBannerSvg('Kabir Shorts & Tricks', 'kabir_shorts'),
    subscribers: ['student-1', 'student-2', 'student-3'],
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
  },
];

const INITIAL_SEED_VIDEOS: EduTubeVideo[] = [
  {
    id: 'seed-rotational-1',
    title: 'Rolling Motion & Angular Momentum Trick | Complete Solution #mechanics #solution #pyq',
    description:
      'Complete visual breakdown of Instantaneous Axis of Rotation (IAOR) and toppling vs slipping conditions with 3 step-by-step question solutions.\n\n#mechanics #solution #pyq #study',
    video_url: 'https://www.youtube.com/watch?v=b1t41Q3xRM8',
    thumbnail_url: createSvgThumbnail(
      'Rolling Motion & IAOR Trick',
      '#mechanics · #solution · #pyq',
      'FULL VIDEO',
      '#EF4444',
      '#090D16',
      '#0F172A'
    ),
    duration: '14:25',
    video_type: 'long',
    tags: ['#mechanics', '#solution', '#pyq', '#study'],
    author_uid: 'system-educator-1',
    author_name: 'Aarav Sharma (IITB)',
    author_username: 'aarav_iitb',
    views: 1240,
    likes: 186,
    liked_by: [],
    comments: [
      {
        id: 'c-101',
        author_uid: 'student-1',
        author_name: 'Rohan Verma',
        author_username: 'rohan_26',
        text: 'IAOR method saved at least 3 minutes in solving pulley-cylinder problems!',
        created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      },
    ],
    storage_provider: 'external',
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
  },
  {
    id: 'seed-calculus-2',
    title: 'Definite Integration: King Property & Leibniz Rule in 10 Minutes #calculus #tricks #maths',
    description:
      'Master the 4 most repeated Definite Integration patterns. Learn when to apply King Property and Newton-Leibniz differentiation under the integral sign.\n\n#calculus #tricks #maths #solution',
    video_url: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
    thumbnail_url: createSvgThumbnail(
      'Definite Integration Tricks',
      '#calculus · #tricks · #maths',
      'TRICK VIDEO',
      '#F59E0B',
      '#111827',
      '#1E1B4B'
    ),
    duration: '11:10',
    video_type: 'long',
    tags: ['#calculus', '#tricks', '#maths', '#solution'],
    author_uid: 'system-educator-2',
    author_name: 'Priya Study Hub',
    author_username: 'priya_tricks',
    views: 980,
    likes: 142,
    liked_by: [],
    comments: [],
    storage_provider: 'external',
    created_at: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
  },
  {
    id: 'seed-organic-short-3',
    title: 'SN1 vs SN2 Decision Tree in 45 Seconds #shorts #tricks #quickrevision',
    description:
      'Quick 45-second checklist: Check substrate crowding, nucleophile strength, and polar protic vs aprotic solvent to instantly decide SN1 or SN2.\n\n#shorts #tricks #quickrevision',
    video_url: 'https://www.youtube.com/watch?v=kXFEex-dABU',
    thumbnail_url: createSvgThumbnail(
      '45-Sec Reaction Trick',
      '#shorts · #tricks · #quickrevision',
      'SHORT',
      '#10B981',
      '#061A14',
      '#0F172A'
    ),
    duration: '0:45',
    video_type: 'short',
    tags: ['#shorts', '#tricks', '#quickrevision'],
    author_uid: 'system-educator-3',
    author_name: 'Kabir Shorts & Tricks',
    author_username: 'kabir_shorts',
    views: 2150,
    likes: 319,
    liked_by: [],
    comments: [],
    storage_provider: 'external',
    created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
  },
];

export function getCloudConfig(): EduTubeCloudConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();
  const envIkEndpoint = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '').trim();
  const envIkKey = (import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '').trim();

  try {
    const savedRaw = localStorage.getItem(LOCAL_CONFIG_KEY);
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw) as Partial<EduTubeCloudConfig>;
      return {
        supabaseUrl: (parsed.supabaseUrl || envUrl || DEFAULT_SUPABASE_URL).replace(/\/+$/, ''),
        supabaseAnonKey: (parsed.supabaseAnonKey || envKey || DEFAULT_SUPABASE_ANON_KEY).trim(),
        imagekitEndpoint: parsed.imagekitEndpoint || envIkEndpoint,
        imagekitPublicKey: parsed.imagekitPublicKey || envIkKey,
      };
    }
  } catch (e) {
    console.warn('Failed to read local cloud config', e);
  }

  return {
    supabaseUrl: envUrl.replace(/\/+$/, ''),
    supabaseAnonKey: envKey,
    imagekitEndpoint: envIkEndpoint,
    imagekitPublicKey: envIkKey,
  };
}

export function saveCloudConfig(config: EduTubeCloudConfig): void {
  const normalized: EduTubeCloudConfig = {
    supabaseUrl: (config.supabaseUrl.trim() || DEFAULT_SUPABASE_URL).replace(/\/+$/, ''),
    supabaseAnonKey: config.supabaseAnonKey.trim() || DEFAULT_SUPABASE_ANON_KEY,
    imagekitEndpoint: (config.imagekitEndpoint || '').trim().replace(/\/+$/, ''),
    imagekitPublicKey: (config.imagekitPublicKey || '').trim(),
  };
  localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(normalized));
}

export function isSupabaseConfigured(): boolean {
  const cfg = getCloudConfig();
  return Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && cfg.supabaseUrl.startsWith('http'));
}

function getDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedId(id: string): void {
  try {
    const current = getDeletedIds();
    if (!current.includes(id)) {
      localStorage.setItem(LOCAL_DELETED_IDS_KEY, JSON.stringify([...current, id]));
    }
  } catch {
    // ignore
  }
}

function getLocalVideos(): EduTubeVideo[] {
  try {
    const raw = localStorage.getItem(LOCAL_VIDEOS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(INITIAL_SEED_VIDEOS));
      return INITIAL_SEED_VIDEOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Never return stale temporary blob: URLs from previous browser sessions
      const valid = parsed.filter((v: any) => !String(v.video_url || '').startsWith('blob:'));
      return valid.length > 0 ? valid : INITIAL_SEED_VIDEOS;
    }
  } catch (e) {
    console.warn('Error reading local EduTube cache', e);
  }
  return INITIAL_SEED_VIDEOS;
}

function saveLocalVideos(videos: EduTubeVideo[]): void {
  try {
    const clean = videos.filter((v) => !String(v.video_url || '').startsWith('blob:'));
    localStorage.setItem(LOCAL_VIDEOS_KEY, JSON.stringify(clean));
  } catch (e) {
    console.warn('Could not save videos to localStorage cache', e);
  }
}

function getLocalChannels(): EduTubeChannel[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHANNELS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CHANNELS_KEY, JSON.stringify(INITIAL_SEED_CHANNELS));
      return INITIAL_SEED_CHANNELS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading local EduTube channels', e);
  }
  return INITIAL_SEED_CHANNELS;
}

function saveLocalChannels(channels: EduTubeChannel[]): void {
  try {
    localStorage.setItem(LOCAL_CHANNELS_KEY, JSON.stringify(channels));
  } catch (e) {
    console.warn('Could not save channels to localStorage cache', e);
  }
}

export function getSavedVideoIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_VIDEOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedVideoId(videoId: string): string[] {
  const current = getSavedVideoIds();
  const next = current.includes(videoId)
    ? current.filter((id) => id !== videoId)
    : [videoId, ...current];
  localStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(next));
  return next;
}

function normalizeVideoRow(r: any): EduTubeVideo {
  const rawTagSource = Array.isArray(r.tags) ? r.tags : r.chapter || '';
  const tags = parseVideoTags(rawTagSource, r.title || '', r.description || '');
  return {
    id: String(r.id),
    title: r.title || 'Untitled Video',
    description: r.description || '',
    video_url: r.video_url || '',
    thumbnail_url:
      r.thumbnail_url ||
      createCustomBannerThumbnail(r.title || 'EduTube Video', tags.slice(0, 3).join(' · ')),
    duration: r.duration || (r.video_type === 'live' ? 'LIVE' : '05:00'),
    video_type:
      r.video_type === 'short'
        ? 'short'
        : r.video_type === 'live'
        ? 'live'
        : 'long',
    tags,
    author_uid: r.author_uid || 'anonymous',
    author_name: r.author_name || 'Creator',
    author_username: (r.author_username || 'creator').replace(/^@/, ''),
    author_photo: r.author_photo || '',
    views: Number(r.views) || 1,
    likes: Number(r.likes) || 0,
    liked_by: Array.isArray(r.liked_by) ? r.liked_by : [],
    comments: Array.isArray(r.comments) ? r.comments : [],
    storage_provider: r.storage_provider || 'supabase',
    created_at: r.created_at || new Date().toISOString(),
  };
}

function normalizeChannelFromRow(r: any): EduTubeChannel {
  const uid = String(r.author_uid || r.uid || String(r.id || '').replace(/^channel_/, ''));
  const isOfficialJeeChannel = uid === '8MFhW6Ljr0bibCPjos5734DTkHR2';

  let rawName = String(r.title || r.name || r.author_name || 'Creator Channel').trim();
  if (!isOfficialJeeChannel && rawName.toLowerCase() === 'jee community') {
    rawName = uid === 'sYoZnmiq0AavIUoocIwSuJcbuRD2' ? 'hrizzz🐬' : 'Creator Channel';
  }
  const name = isOfficialJeeChannel ? 'JEE Community' : rawName;

  let handle = String(
    r.author_username || r.handle || name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'creator'
  )
    .replace(/^@/, '')
    .trim();
  if (!isOfficialJeeChannel && handle.toLowerCase() === 'jeecommunity') {
    handle = uid === 'sYoZnmiq0AavIUoocIwSuJcbuRD2' ? 'hrizzz' : 'creator';
  }

  let avatarUrl = r.author_photo || r.avatar_url || '';
  if (!isOfficialJeeChannel && avatarUrl.includes('jc_official_logo')) {
    avatarUrl =
      uid === 'sYoZnmiq0AavIUoocIwSuJcbuRD2'
        ? 'https://res.cloudinary.com/gg0rxzjm/image/upload/v1787313194/lteyrxreowouwkng1w6y.png'
        : '';
  } else if (
    isOfficialJeeChannel &&
    (!avatarUrl || avatarUrl.includes('res.cloudinary.com/gg0rxzjm'))
  ) {
    avatarUrl = JEE_COMMUNITY_OFFICIAL_LOGO_URL;
  }

  let bannerUrl =
    r.thumbnail_url && !r.thumbnail_url.startsWith('channel://')
      ? r.thumbnail_url
      : r.banner_url || '';

  if (
    !isOfficialJeeChannel &&
    (bannerUrl.includes('jc_official_banner') ||
      bannerUrl.includes('channel_banner_sYoZnmiq0AavIUoocIwSuJcbuRD2'))
  ) {
    bannerUrl = '';
  }

  if (
    isOfficialJeeChannel &&
    (!bannerUrl || bannerUrl.startsWith('data:image/svg+xml'))
  ) {
    bannerUrl = JEE_COMMUNITY_OFFICIAL_BANNER_URL;
  } else if (!bannerUrl) {
    bannerUrl = createChannelBannerSvg(name, handle);
  }

  return {
    uid,
    name,
    handle,
    bio:
      r.description ||
      r.bio ||
      (isOfficialJeeChannel
        ? JEE_COMMUNITY_OFFICIAL_BIO
        : 'Welcome to my EduTube channel! Subscribe for regular study videos.'),
    avatar_url: avatarUrl,
    banner_url: bannerUrl,
    subscribers: Array.isArray(r.liked_by)
      ? r.liked_by
      : Array.isArray(r.subscribers)
      ? r.subscribers
      : [],
    created_at: r.created_at || new Date().toISOString(),
  };
}

function videoToDbRow(v: EduTubeVideo) {
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    video_url: v.video_url,
    thumbnail_url: v.thumbnail_url,
    duration: v.duration,
    video_type: v.video_type,
    subject: 'General',
    chapter: (v.tags || []).join(','),
    author_uid: v.author_uid,
    author_name: v.author_name,
    author_username: v.author_username,
    author_photo: v.author_photo || '',
    views: v.views,
    likes: v.likes,
    liked_by: v.liked_by,
    comments: v.comments,
    storage_provider: v.storage_provider,
    created_at: v.created_at,
  };
}

function channelToDbRow(c: EduTubeChannel) {
  return {
    id: `channel_${c.uid}`,
    title: c.name,
    description: c.bio,
    video_url: 'channel://profile',
    thumbnail_url: c.banner_url || createChannelBannerSvg(c.name, c.handle),
    duration: '00:00',
    video_type: 'channel_profile',
    subject: 'Channel',
    chapter: c.handle,
    author_uid: c.uid,
    author_name: c.name,
    author_username: c.handle,
    author_photo: c.avatar_url || '',
    views: 0,
    likes: c.subscribers.length,
    liked_by: c.subscribers,
    comments: [],
    storage_provider: 'supabase',
    created_at: c.created_at,
  };
}

function mergeAndSynthesizeChannels(
  explicitChannels: EduTubeChannel[],
  videos: EduTubeVideo[]
): EduTubeChannel[] {
  const map = new Map<string, EduTubeChannel>();

  for (const ch of explicitChannels) {
    map.set(ch.uid, ch);
  }

  for (const v of videos) {
    if (!v.author_uid) continue;
    const existing = map.get(v.author_uid);
    if (!existing) {
      const handle = (v.author_username || v.author_name.toLowerCase().replace(/[^a-z0-9]/g, '_')).replace(/^@/, '');
      map.set(v.author_uid, {
        uid: v.author_uid,
        name: v.author_name || 'Creator',
        handle,
        bio: `EduTube channel of ${v.author_name}. Watch & subscribe for regular study videos!`,
        avatar_url: v.author_photo || '',
        banner_url: createChannelBannerSvg(v.author_name || 'Creator', handle),
        subscribers: [],
        created_at: v.created_at,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Returns locally cached EduTube videos and channels synchronously in 0ms for instant page load.
 */
export function getInstantEduTubeCache(): {
  videos: EduTubeVideo[];
  channels: EduTubeChannel[];
} {
  const deletedIds = getDeletedIds();
  const localVids = getLocalVideos().filter((v) => !deletedIds.includes(v.id));
  const localChans = mergeAndSynthesizeChannels(getLocalChannels(), localVids);
  return {
    videos: localVids,
    channels: localChans,
  };
}

/**
 * Fetches both Videos and Creator Channels from Supabase (0 Firebase Reads).
 */
export async function fetchEduTubeData(): Promise<{
  videos: EduTubeVideo[];
  channels: EduTubeChannel[];
  source: 'supabase' | 'local';
}> {
  const cfg = getCloudConfig();
  const deletedIds = getDeletedIds();

  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      const res = await fetch(
        `${cfg.supabaseUrl}/rest/v1/edutube_videos?select=*&video_type=in.(long,short,live,channel_profile)&order=created_at.desc&limit=200`,
        {
          headers: {
            apikey: cfg.supabaseAnonKey,
            Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          },
        }
      );

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          const dbChannels: EduTubeChannel[] = [];
          const dbVideos: EduTubeVideo[] = [];

          for (const row of rows) {
            if (
              row.video_type === 'channel_profile' ||
              String(row.id || '').startsWith('channel_') ||
              row.video_url === 'channel://profile'
            ) {
              dbChannels.push(normalizeChannelFromRow(row));
            } else if (
              (row.video_type === 'long' ||
                row.video_type === 'short' ||
                row.video_type === 'live') &&
              !deletedIds.includes(String(row.id)) &&
              !String(row.video_url || '').startsWith('blob:')
            ) {
              dbVideos.push(normalizeVideoRow(row));
            }
          }

          const mergedChannels = mergeAndSynthesizeChannels(dbChannels, dbVideos);
          const channelByUid = new Map(mergedChannels.map((c) => [c.uid, c]));

          const enrichedVideos = dbVideos
            .map((v) => {
              const ch = channelByUid.get(v.author_uid);
              if (!ch) return v;
              return {
                ...v,
                author_name: ch.name || v.author_name,
                author_username: ch.handle || v.author_username,
                author_photo: ch.avatar_url || v.author_photo,
              };
            })
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          saveLocalVideos(enrichedVideos);
          saveLocalChannels(mergedChannels);
          return {
            videos: enrichedVideos,
            channels: mergedChannels,
            source: 'supabase',
          };
        }
      }
    } catch (err) {
      console.warn('Supabase fetch error, falling back to local cache:', err);
    }
  }

  const localVids = getLocalVideos().filter((v) => !deletedIds.includes(v.id));
  const localChans = mergeAndSynthesizeChannels(getLocalChannels(), localVids);
  return {
    videos: localVids,
    channels: localChans,
    source: 'local',
  };
}

/**
 * Creates or updates a user's YouTube-style Channel in Supabase (0 Firebase Reads)
 */
export async function saveEduTubeChannel(channelInput: {
  uid: string;
  name: string;
  handle: string;
  bio: string;
  avatar_url?: string;
  banner_url?: string;
}): Promise<EduTubeChannel> {
  const existingChannels = getLocalChannels();
  const existing = existingChannels.find((c) => c.uid === channelInput.uid);
  const isOfficialJeeChannel = channelInput.uid === '8MFhW6Ljr0bibCPjos5734DTkHR2';

  let cleanName = channelInput.name.trim() || 'My Channel';
  if (!isOfficialJeeChannel && cleanName.toLowerCase() === 'jee community') {
    cleanName = channelInput.uid === 'sYoZnmiq0AavIUoocIwSuJcbuRD2' ? 'hrizzz🐬' : 'My Channel';
  }

  let cleanHandle = (
    channelInput.handle.trim() ||
    cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_') ||
    'creator'
  ).replace(/^@/, '');
  if (!isOfficialJeeChannel && cleanHandle.toLowerCase() === 'jeecommunity') {
    cleanHandle = channelInput.uid === 'sYoZnmiq0AavIUoocIwSuJcbuRD2' ? 'hrizzz' : 'creator';
  }

  let resolvedBanner = channelInput.banner_url || existing?.banner_url || '';
  if (
    !isOfficialJeeChannel &&
    (resolvedBanner.includes('jc_official_banner') ||
      resolvedBanner.includes('channel_banner_sYoZnmiq0AavIUoocIwSuJcbuRD2'))
  ) {
    resolvedBanner = '';
  }
  if (!resolvedBanner || resolvedBanner.startsWith('data:image/svg+xml')) {
    resolvedBanner = isOfficialJeeChannel
      ? JEE_COMMUNITY_OFFICIAL_BANNER_URL
      : createChannelBannerSvg(cleanName, cleanHandle);
  }

  let resolvedAvatar = channelInput.avatar_url ?? existing?.avatar_url ?? '';
  if (!isOfficialJeeChannel && resolvedAvatar.includes('jc_official_logo')) {
    resolvedAvatar =
      channelInput.uid === 'sYoZnmiq0AavIUoocIwSuJcbuRD2'
        ? 'https://res.cloudinary.com/gg0rxzjm/image/upload/v1787313194/lteyrxreowouwkng1w6y.png'
        : '';
  } else if (
    isOfficialJeeChannel &&
    (!resolvedAvatar || resolvedAvatar.includes('res.cloudinary.com/gg0rxzjm'))
  ) {
    resolvedAvatar = JEE_COMMUNITY_OFFICIAL_LOGO_URL;
  }

  const updatedChannel: EduTubeChannel = {
    uid: channelInput.uid,
    name: cleanName,
    handle: cleanHandle,
    bio:
      channelInput.bio.trim() ||
      (isOfficialJeeChannel
        ? JEE_COMMUNITY_OFFICIAL_BIO
        : 'Welcome to my EduTube channel! Subscribe for new videos.'),
    avatar_url: resolvedAvatar,
    banner_url: resolvedBanner,
    subscribers: existing?.subscribers || [],
    created_at: existing?.created_at || new Date().toISOString(),
  };

  const nextChannels = [
    updatedChannel,
    ...existingChannels.filter((c) => c.uid !== updatedChannel.uid),
  ];
  saveLocalChannels(nextChannels);

  const nextVideos = getLocalVideos().map((v) =>
    v.author_uid === updatedChannel.uid
      ? {
          ...v,
          author_name: updatedChannel.name,
          author_username: updatedChannel.handle,
          author_photo: updatedChannel.avatar_url || v.author_photo,
        }
      : v
  );
  saveLocalVideos(nextVideos);

  const cfg = getCloudConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      await fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos`, {
        method: 'POST',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(channelToDbRow(updatedChannel)),
      });
    } catch (err) {
      console.warn('Failed to upsert channel to Supabase:', err);
    }
  }

  return updatedChannel;
}

/**
 * Toggles Subscribe / Follow on a Creator Channel in Supabase (0 Firebase Reads)
 */
export async function toggleSubscribeEduTubeChannel(
  channel: EduTubeChannel,
  subscriberUid: string
): Promise<{ updatedChannel: EduTubeChannel; isSubscribed: boolean }> {
  const alreadySubscribed = channel.subscribers.includes(subscriberUid);
  const nextSubscribers = alreadySubscribed
    ? channel.subscribers.filter((id) => id !== subscriberUid)
    : [...channel.subscribers, subscriberUid];

  const updatedChannel: EduTubeChannel = {
    ...channel,
    subscribers: nextSubscribers,
  };

  const nextChannels = [
    updatedChannel,
    ...getLocalChannels().filter((c) => c.uid !== updatedChannel.uid),
  ];
  saveLocalChannels(nextChannels);

  const cfg = getCloudConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      await fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos`, {
        method: 'POST',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(channelToDbRow(updatedChannel)),
      });
    } catch (err) {
      console.warn('Failed to update channel subscription in Supabase:', err);
    }
  }

  return { updatedChannel, isSubscribed: !alreadySubscribed };
}

/**
 * Creates a clean, high-contrast custom thumbnail DataURL on HTML5 Canvas / SVG
 */
export function createCustomBannerThumbnail(title: string, tagsPreview = '#edutube · #video'): string {
  const trimmedTitle = title.length > 34 ? title.slice(0, 32) + '...' : title || 'New Video';
  const trimmedSub = tagsPreview || '#edutube · #video';
  return createSvgThumbnail(trimmedTitle, trimmedSub, 'EDUTUBE', '#EF4444', '#090D16', '#0F172A');
}

export function createLiveBannerThumbnail(title: string, hostName = 'Live Stream'): string {
  const trimmedTitle = title.length > 34 ? title.slice(0, 32) + '...' : title || 'Live Session';
  const trimmedSub = `🔴 LIVE NOW · ${hostName}`;
  return createSvgThumbnail(trimmedTitle, trimmedSub, '🔴 LIVE STREAM', '#DC2626', '#180409', '#090D16');
}

/**
 * Converts a data:image/... DataURL into a binary Blob so extracted frames can be uploaded to Supabase Storage
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    if (!dataUrl.startsWith('data:image/')) return null;
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Compresses a custom thumbnail or channel image file on HTML5 Canvas
 */
export async function compressThumbnailFile(
  file: File,
  targetWidth = 1280,
  targetHeight = 720
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const targetRatio = targetWidth / targetHeight;
      const imgRatio = img.width / img.height;
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > targetRatio) {
        drawHeight = targetHeight;
        drawWidth = img.width * (targetHeight / img.height);
        offsetX = (targetWidth - drawWidth) / 2;
      } else {
        drawWidth = targetWidth;
        drawHeight = img.height * (targetWidth / img.width);
        offsetY = (targetHeight - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, dataUrl });
          else reject(new Error('Image blob conversion failed'));
        },
        'image/jpeg',
        0.84
      );
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(objUrl);
      reject(e);
    };
    img.src = objUrl;
  });
}

/**
 * Extracts a 16:9 thumbnail frame AND exact duration directly from a user-selected video file!
 */
export async function inspectVideoFile(
  file: File
): Promise<{ durationFormatted: string; durationSeconds: number; frameDataUrl: string; isVertical: boolean }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const objUrl = URL.createObjectURL(file);

    const cleanupFallback = () => {
      URL.revokeObjectURL(objUrl);
      resolve({
        durationFormatted: '03:00',
        durationSeconds: 180,
        frameDataUrl: '',
        isVertical: false,
      });
    };

    const timeoutId = setTimeout(cleanupFallback, 6000);

    video.onloadedmetadata = () => {
      const secs = Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : 120;
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      const formatted = `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
      const isVertical = video.videoHeight > video.videoWidth;

      video.currentTime = Math.min(1.5, Math.max(0.1, secs * 0.25));

      video.onseeked = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          const isShortOrVertical = isVertical || secs <= 65;
          const targetW = isShortOrVertical ? 720 : 1280;
          const targetH = isShortOrVertical ? 1280 : 720;
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          let frameDataUrl = '';
          if (ctx) {
            ctx.fillStyle = '#090D16';
            ctx.fillRect(0, 0, targetW, targetH);
            const vidW = video.videoWidth || targetW;
            const vidH = video.videoHeight || targetH;
            // Use cover scaling for Shorts so vertical frames fill 9:16 edge-to-edge without black bars
            const scale = isShortOrVertical
              ? Math.max(targetW / vidW, targetH / vidH)
              : Math.min(targetW / vidW, targetH / vidH);
            const w = vidW * scale;
            const h = vidH * scale;
            ctx.drawImage(video, (targetW - w) / 2, (targetH - h) / 2, w, h);
            frameDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          }
          URL.revokeObjectURL(objUrl);
          resolve({
            durationFormatted: formatted,
            durationSeconds: secs,
            frameDataUrl,
            isVertical,
          });
        } catch {
          URL.revokeObjectURL(objUrl);
          resolve({
            durationFormatted: formatted,
            durationSeconds: secs,
            frameDataUrl: '',
            isVertical,
          });
        }
      };
    };

    video.onerror = () => {
      clearTimeout(timeoutId);
      cleanupFallback();
    };

    video.src = objUrl;
  });
}

function uploadSingleBlobToSupabase(
  cfg: EduTubeCloudConfig,
  blob: Blob,
  objectPath: string,
  contentType: string,
  onProgress?: (loadedBytes: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const uploadUrl = `${cfg.supabaseUrl}/storage/v1/object/edutube-media/${objectPath}`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('apikey', cfg.supabaseAnonKey);
    xhr.setRequestHeader('Authorization', `Bearer ${cfg.supabaseAnonKey}`);
    xhr.setRequestHeader('Content-Type', contentType || 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${cfg.supabaseUrl}/storage/v1/object/public/edutube-media/${objectPath}`;
        resolve(publicUrl);
      } else {
        reject(new Error(`Cloud upload failed (HTTP ${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error while uploading to Supabase Storage'));
    xhr.send(blob);
  });
}

/**
 * Uploads a video, thumbnail, or channel image to Supabase Storage (`edutube-media` public bucket).
 * Automatically splits large videos (> 40 MB) into < 40 MB chunks so Supabase Free Tier's 50 MB
 * single-file limit is NEVER exceeded!
 */
export async function uploadMediaToEduTubeCloud(
  fileOrBlob: File | Blob,
  fileName: string,
  folder: 'videos' | 'thumbnails' | 'uploads' | 'notes',
  onProgress?: (percent: number) => void
): Promise<{ url: string; provider: StorageProviderType }> {
  const cfg = getCloudConfig();
  const baseTs = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    throw new Error('Supabase Cloud is not configured');
  }

  // Case 1: File <= 40 MB -> Direct single-file upload
  if (fileOrBlob.size <= CHUNK_SIZE_BYTES) {
    const objectPath = `${folder}/${baseTs}_${cleanName}`;
    const publicUrl = await uploadSingleBlobToSupabase(
      cfg,
      fileOrBlob,
      objectPath,
      fileOrBlob.type || (folder === 'videos' ? 'video/mp4' : 'image/jpeg'),
      (loaded) => {
        if (onProgress && fileOrBlob.size > 0) {
          onProgress(Math.min(99, Math.round((loaded / fileOrBlob.size) * 100)));
        }
      }
    );
    if (onProgress) onProgress(100);
    return { url: publicUrl, provider: 'supabase' };
  }

  // Case 2: Large Video (> 40 MB) -> Automatic Multi-Part Chunked Upload to bypass 50 MB per-object limit
  const totalSize = fileOrBlob.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE_BYTES);
  const chunkUrls: string[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE_BYTES;
    const end = Math.min(totalSize, start + CHUNK_SIZE_BYTES);
    const chunkBlob = fileOrBlob.slice(start, end, 'application/octet-stream');
    const chunkPath = `${folder}/${baseTs}_part${i}_${cleanName}.bin`;

    const chunkUrl = await uploadSingleBlobToSupabase(
      cfg,
      chunkBlob,
      chunkPath,
      'application/octet-stream',
      (chunkLoaded) => {
        if (onProgress) {
          const overallLoaded = start + chunkLoaded;
          onProgress(Math.min(98, Math.round((overallLoaded / totalSize) * 100)));
        }
      }
    );
    chunkUrls.push(chunkUrl);
  }

  // Upload JSON manifest pointing to all uploaded chunks
  const manifestPayload = {
    type: 'edutube_chunked_video',
    mimeType: fileOrBlob.type || 'video/mp4',
    totalSize,
    chunks: chunkUrls,
  };
  const manifestBlob = new Blob([JSON.stringify(manifestPayload)], {
    type: 'application/json',
  });
  const manifestPath = `${folder}/${baseTs}_${cleanName}_manifest.json`;
  const manifestUrl = await uploadSingleBlobToSupabase(
    cfg,
    manifestBlob,
    manifestPath,
    'application/json'
  );

  // Cache local playable blob immediately for current session
  resolvedChunkVideoCache.set(manifestUrl, URL.createObjectURL(fileOrBlob));

  if (onProgress) onProgress(100);
  return { url: manifestUrl, provider: 'supabase' };
}

/**
 * Resolves a video URL for playback. If the video was uploaded as a multi-part chunked manifest
 * (`_manifest.json`), downloads the parts in parallel and reassembles them into a playable Blob URL.
 */
export async function resolvePlayableVideoUrl(
  videoUrl: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!videoUrl) return '';
  if (!videoUrl.endsWith('_manifest.json')) {
    return videoUrl;
  }

  const cached = resolvedChunkVideoCache.get(videoUrl);
  if (cached) {
    if (onProgress) onProgress(100);
    return cached;
  }

  const manifestRes = await fetch(videoUrl);
  if (!manifestRes.ok) {
    throw new Error('Could not load video manifest');
  }
  const manifest = await manifestRes.json();
  if (!manifest || !Array.isArray(manifest.chunks) || manifest.chunks.length === 0) {
    throw new Error('Invalid chunked video manifest');
  }

  const totalParts = manifest.chunks.length;
  let completedParts = 0;

  const partBlobs = await Promise.all(
    manifest.chunks.map(async (chunkUrl: string) => {
      const res = await fetch(chunkUrl);
      if (!res.ok) throw new Error(`Failed to load video segment`);
      const blob = await res.blob();
      completedParts += 1;
      if (onProgress) {
        onProgress(Math.round((completedParts / totalParts) * 100));
      }
      return blob;
    })
  );

  const combinedBlob = new Blob(partBlobs, {
    type: manifest.mimeType || 'video/mp4',
  });
  const playableObjectUrl = URL.createObjectURL(combinedBlob);
  resolvedChunkVideoCache.set(videoUrl, playableObjectUrl);
  return playableObjectUrl;
}

/**
 * Publishes a new video record to Supabase `edutube_videos` (0 Firebase reads/writes)
 */
export async function publishEduTubeVideo(
  payload: Omit<EduTubeVideo, 'id' | 'views' | 'likes' | 'liked_by' | 'comments' | 'created_at'>
): Promise<EduTubeVideo> {
  const normalizedTags = parseVideoTags(payload.tags, payload.title, payload.description);
  const newVideo: EduTubeVideo = {
    ...payload,
    tags: normalizedTags,
    id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    views: 1,
    likes: 0,
    liked_by: [],
    comments: [],
    created_at: new Date().toISOString(),
  };

  const current = getLocalVideos();
  saveLocalVideos([newVideo, ...current]);

  const cfg = getCloudConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      const res = await fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos`, {
        method: 'POST',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(videoToDbRow(newVideo)),
      });
      if (res.ok) {
        const created = await res.json();
        if (Array.isArray(created) && created[0]) {
          const saved = normalizeVideoRow(created[0]);
          saveLocalVideos([saved, ...current.filter((v) => v.id !== saved.id)]);

          // Automatically broadcast a Global Notification to ALL users in Supabase
          const isLiveNow = saved.video_type === 'live';
          const displayNotifTitle = isLiveNow ? `🔴 LIVE NOW: ${saved.title}` : saved.title;
          const notifId = `notif_global_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const notifPayload = {
            id: notifId,
            recipientId: 'ALL',
            senderId: saved.author_uid,
            senderName: saved.author_name,
            senderAvatar: saved.author_photo || '',
            type: 'edutube_video',
            videoId: saved.id,
            videoTitle: displayNotifTitle,
            videoType: saved.video_type,
            targetUrl: '/edutube',
            isRead: false,
            createdAtMs: Date.now(),
          };
          fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos`, {
            method: 'POST',
            headers: {
              apikey: cfg.supabaseAnonKey,
              Authorization: `Bearer ${cfg.supabaseAnonKey}`,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify({
              id: notifId,
              title: 'edutube_video',
              description: displayNotifTitle,
              video_url: 'blob://hub_notification',
              thumbnail_url: saved.thumbnail_url || saved.author_photo || '',
              duration: saved.duration || '00:00',
              video_type: 'hub_notification',
              subject: 'edutube_video',
              chapter: 'ALL',
              author_uid: saved.author_uid,
              author_name: saved.author_name,
              author_username: saved.author_username,
              author_photo: saved.author_photo || '',
              views: 0,
              likes: 0,
              liked_by: [],
              comments: [notifPayload],
              storage_provider: 'supabase',
              created_at: new Date().toISOString(),
            }),
          }).catch(() => {});

          return saved;
        }
      }
    } catch (err) {
      console.warn('Supabase insert fallback to local storage:', err);
    }
  }

  return newVideo;
}

/**
 * Updates views, likes, or comments on a video in Supabase + local cache (0 Firebase reads).
 */
export async function updateEduTubeVideoRecord(
  videoId: string,
  patch: Partial<
    Pick<
      EduTubeVideo,
      | 'views'
      | 'likes'
      | 'liked_by'
      | 'comments'
      | 'video_type'
      | 'duration'
      | 'video_url'
      | 'thumbnail_url'
    >
  >
): Promise<void> {
  const current = getLocalVideos();
  const target = current.find((v) => v.id === videoId);
  const updated = current.map((v) => (v.id === videoId ? { ...v, ...patch } : v));
  saveLocalVideos(updated);

  const cfg = getCloudConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      if (target && videoId.startsWith('seed-')) {
        const mergedVideo = { ...target, ...patch };
        await fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos`, {
          method: 'POST',
          headers: {
            apikey: cfg.supabaseAnonKey,
            Authorization: `Bearer ${cfg.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(videoToDbRow(mergedVideo)),
        });
        return;
      }

      await fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos?id=eq.${encodeURIComponent(videoId)}`, {
        method: 'PATCH',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patch),
      });
    } catch (err) {
      console.warn('Supabase patch failed:', err);
    }
  }
}

/**
 * Polls a single video row from Supabase for Real-Time Live Chat & Live Viewer/Likes updates (0 Firebase Reads)
 */
export async function fetchSingleEduTubeVideo(videoId: string): Promise<EduTubeVideo | null> {
  const cfg = getCloudConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  try {
    const res = await fetch(
      `${cfg.supabaseUrl}/rest/v1/edutube_videos?select=*&id=eq.${encodeURIComponent(videoId)}&limit=1`,
      {
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        },
      }
    );
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows[0]) {
        return normalizeVideoRow(rows[0]);
      }
    }
  } catch {
    // ignore transient network errors
  }
  return null;
}

export async function deleteEduTubeVideoRecord(videoId: string): Promise<void> {
  addDeletedId(videoId);
  const current = getLocalVideos();
  saveLocalVideos(current.filter((v) => v.id !== videoId));

  const cfg = getCloudConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    try {
      await fetch(`${cfg.supabaseUrl}/rest/v1/edutube_videos?id=eq.${encodeURIComponent(videoId)}`, {
        method: 'DELETE',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        },
      });
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }
}

/**
 * Parses YouTube (including YouTube Live), built-in Live Broadcast Rooms, and Google Drive links
 */
export function getEmbedInfo(url: string): {
  type: 'youtube' | 'gdrive' | 'live_room' | 'video';
  embedUrl: string;
  youtubeId?: string;
  roomId?: string;
} {
  if (!url) return { type: 'video', embedUrl: '' };

  if (url.startsWith('live://room/')) {
    const roomId = url.replace('live://room/', '').split('?')[0].trim();
    return {
      type: 'live_room',
      roomId,
      embedUrl: url,
    };
  }

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      youtubeId: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&enablejsapi=1`,
    };
  }

  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
    };
  }

  return { type: 'video', embedUrl: url };
}

export const SUPABASE_SETUP_SQL = `-- Run this in Supabase -> SQL Editor (100% Free, Unlimited Reads)
create table if not exists public.edutube_videos (
  id text primary key,
  title text not null,
  description text default '',
  video_url text not null,
  thumbnail_url text default '',
  duration text default '05:00',
  video_type text default 'long',
  subject text default 'General',
  chapter text default '#edutube',
  author_uid text not null,
  author_name text not null,
  author_username text default 'creator',
  author_photo text default '',
  views integer default 1,
  likes integer default 0,
  liked_by jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  storage_provider text default 'supabase',
  created_at timestamptz default now()
);

grant usage on schema public to anon, authenticated, service_role;
grant all on table public.edutube_videos to anon, authenticated, service_role;

alter table public.edutube_videos enable row level security;

drop policy if exists "Public read edutube_videos" on public.edutube_videos;
create policy "Public read edutube_videos"
  on public.edutube_videos for select
  using (true);

drop policy if exists "Public insert edutube_videos" on public.edutube_videos;
create policy "Public insert edutube_videos"
  on public.edutube_videos for insert
  with check (true);

drop policy if exists "Public update edutube_videos" on public.edutube_videos;
create policy "Public update edutube_videos"
  on public.edutube_videos for update
  using (true);

drop policy if exists "Public delete edutube_videos" on public.edutube_videos;
create policy "Public delete edutube_videos"
  on public.edutube_videos for delete
  using (true);

insert into storage.buckets (id, name, public)
values ('edutube-media', 'edutube-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read edutube-media" on storage.objects;
create policy "Public read edutube-media"
  on storage.objects for select
  using (bucket_id = 'edutube-media');

drop policy if exists "Public upload edutube-media" on storage.objects;
create policy "Public upload edutube-media"
  on storage.objects for insert
  with check (bucket_id = 'edutube-media');`;
