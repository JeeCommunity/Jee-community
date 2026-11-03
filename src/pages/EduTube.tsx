import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Upload,
  Search,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  ArrowLeft,
  Film,
  Zap,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  Database,
  X,
  Send,
  Sparkles,
  Gauge,
  Maximize2,
  Users,
  UserPlus,
  UserCheck,
  Edit3,
  Hash,
  Tv,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import {
  EduTubeVideo,
  EduTubeChannel,
  VideoFormat,
  fetchEduTubeData,
  publishEduTubeVideo,
  updateEduTubeVideoRecord,
  deleteEduTubeVideoRecord,
  saveEduTubeChannel,
  toggleSubscribeEduTubeChannel,
  uploadMediaToEduTubeCloud,
  resolvePlayableVideoUrl,
  dataUrlToBlob,
  compressThumbnailFile,
  inspectVideoFile,
  createCustomBannerThumbnail,
  createChannelBannerSvg,
  parseVideoTags,
  getEmbedInfo,
  getSavedVideoIds,
  toggleSavedVideoId,
  getCloudConfig,
  saveCloudConfig,
  isSupabaseConfigured,
  SUPABASE_SETUP_SQL,
  JEE_COMMUNITY_OFFICIAL_LOGO_URL,
  JEE_COMMUNITY_OFFICIAL_BANNER_URL,
  JEE_COMMUNITY_OFFICIAL_BIO,
} from '../lib/edutube';
import { formatDistanceToNow } from 'date-fns';

type FeedTab = 'home' | 'shorts' | 'subscriptions' | 'channels' | 'saved' | 'my_channel';
type ChannelSubTab = 'videos' | 'shorts' | 'about';

const SUGGESTED_TAGS = [
  '#trending',
  '#vlog',
  '#solution',
  '#shorts',
  '#tricks',
  '#motivation',
  '#study',
  '#daily',
];

export default function EduTube() {
  const { user, profile } = useAuth();
  const isAdmin =
    user?.email === 'aistoryimage1999@gmail.com' ||
    profile?.role === 'admin' ||
    profile?.role === 'community_manager';

  const [videos, setVideos] = useState<EduTubeVideo[]>([]);
  const [channels, setChannels] = useState<EduTubeChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation & Filtering state
  const [activeTab, setActiveTab] = useState<FeedTab>('home');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedIds, setSavedIds] = useState<string[]>(() => getSavedVideoIds());

  // Selected Channel Page state
  const [viewingChannelUid, setViewingChannelUid] = useState<string | null>(null);
  const [channelSubTab, setChannelSubTab] = useState<ChannelSubTab>('videos');

  // Watch Video state
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [resolvedPlayableUrl, setResolvedPlayableUrl] = useState<string>('');
  const [isBufferingChunks, setIsBufferingChunks] = useState<boolean>(false);
  const [chunkBufferProgress, setChunkBufferProgress] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [commentText, setCommentText] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Upload Video Studio Modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadSourceMode, setUploadSourceMode] = useState<'file' | 'url'>('file');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoTagsInput, setVideoTagsInput] = useState('#edutube #video #trending');
  const [videoType, setVideoType] = useState<VideoFormat>('long');
  const [videoDuration, setVideoDuration] = useState('05:00');
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [customThumbnailBlob, setCustomThumbnailBlob] = useState<Blob | null>(null);
  const [extractedFrameDataUrl, setExtractedFrameDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Customize / Create Channel Modal state
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [channelNameInput, setChannelNameInput] = useState('');
  const [channelHandleInput, setChannelHandleInput] = useState('');
  const [channelBioInput, setChannelBioInput] = useState('');
  const [channelAvatarPreview, setChannelAvatarPreview] = useState('');
  const [channelAvatarBlob, setChannelAvatarBlob] = useState<Blob | null>(null);
  const [channelBannerPreview, setChannelBannerPreview] = useState('');
  const [channelBannerBlob, setChannelBannerBlob] = useState<Blob | null>(null);
  const [isSavingChannel, setIsSavingChannel] = useState(false);

  // Cloud Setup Modal state
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getCloudConfig().supabaseUrl);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getCloudConfig().supabaseAnonKey);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchEduTubeData();
      setVideos(res.videos);
      setChannels(res.channels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isOfficialChannel = (ch: { uid?: string; handle?: string; name?: string }) => {
    const h = (ch.handle || '').toLowerCase().replace(/^@/, '');
    const n = (ch.name || '').toLowerCase().trim();
    return (
      ch.uid === '8MFhW6Ljr0bibCPjos5734DTkHR2' ||
      h === 'jeecommunity' ||
      n === 'jee community'
    );
  };

  // Current user's own channel (explicit or synthesized from their auth profile)
  const myChannel = useMemo<EduTubeChannel | null>(() => {
    if (!user) return null;
    const found = channels.find((c) => c.uid === user.uid);
    if (found) return found;
    if (isAdmin) {
      return {
        uid: user.uid,
        name: 'JEE Community',
        handle: 'jeecommunity',
        bio: JEE_COMMUNITY_OFFICIAL_BIO,
        avatar_url: JEE_COMMUNITY_OFFICIAL_LOGO_URL,
        banner_url: JEE_COMMUNITY_OFFICIAL_BANNER_URL,
        subscribers: [],
        created_at: new Date().toISOString(),
      };
    }
    const defaultName = profile?.fullName || user.displayName || 'My Channel';
    const defaultHandle = (
      profile?.username ||
      defaultName.toLowerCase().replace(/[^a-z0-9]/g, '_') ||
      'creator'
    ).replace(/^@/, '');
    return {
      uid: user.uid,
      name: defaultName,
      handle: defaultHandle,
      bio: 'Welcome to my official EduTube channel! Subscribe for new videos and shorts.',
      avatar_url: profile?.photoURL || user.photoURL || '',
      banner_url: createChannelBannerSvg(defaultName, defaultHandle),
      subscribers: [],
      created_at: new Date().toISOString(),
    };
  }, [channels, user, profile, isAdmin]);

  const channelMap = useMemo(() => {
    const map = new Map<string, EduTubeChannel>();
    for (const c of channels) {
      map.set(c.uid, c);
    }
    if (myChannel && !map.has(myChannel.uid)) {
      map.set(myChannel.uid, myChannel);
    }
    return map;
  }, [channels, myChannel]);

  const getChannelForVideo = (video: EduTubeVideo): EduTubeChannel => {
    const existing = channelMap.get(video.author_uid);
    if (existing) return existing;
    const handle = (video.author_username || 'creator').replace(/^@/, '');
    return {
      uid: video.author_uid,
      name: video.author_name || 'Creator',
      handle,
      bio: `Official EduTube channel of ${video.author_name}.`,
      avatar_url: video.author_photo || '',
      banner_url: createChannelBannerSvg(video.author_name || 'Creator', handle),
      subscribers: [],
      created_at: video.created_at,
    };
  };

  const activeVideo = useMemo(
    () => videos.find((v) => v.id === activeVideoId) || null,
    [videos, activeVideoId]
  );

  useEffect(() => {
    let cancelled = false;
    if (!activeVideo) {
      setResolvedPlayableUrl('');
      setIsBufferingChunks(false);
      return;
    }

    const rawUrl = activeVideo.video_url;
    if (!rawUrl.endsWith('_manifest.json')) {
      setResolvedPlayableUrl(rawUrl);
      setIsBufferingChunks(false);
      return;
    }

    setIsBufferingChunks(true);
    setChunkBufferProgress(10);
    resolvePlayableVideoUrl(rawUrl, (pct) => {
      if (!cancelled) setChunkBufferProgress(pct);
    })
      .then((playable) => {
        if (!cancelled) {
          setResolvedPlayableUrl(playable);
          setIsBufferingChunks(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsBufferingChunks(false);
          toast.error('Could not load large video stream');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeVideo]);

  const viewingChannel = useMemo<EduTubeChannel | null>(() => {
    if (!viewingChannelUid) return null;
    if (myChannel && viewingChannelUid === myChannel.uid) return myChannel;
    return channelMap.get(viewingChannelUid) || null;
  }, [viewingChannelUid, channelMap, myChannel]);

  // All trending hashtags across videos
  const availableHashtags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of videos) {
      for (const tag of v.tags || []) {
        const clean = tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`;
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    }
    for (const t of SUGGESTED_TAGS) {
      if (!counts.has(t)) counts.set(t, 0);
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 14);
    return ['All', ...sorted];
  }, [videos]);

  // Channels that the current user is subscribed to
  const subscribedChannels = useMemo(() => {
    if (!user) return [];
    return Array.from(channelMap.values()).filter((c) => c.subscribers.includes(user.uid));
  }, [channelMap, user]);

  // Filtered videos for current feed tab, hashtag, and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (activeTab === 'shorts' && v.video_type !== 'short') return false;
      if (activeTab === 'saved' && !savedIds.includes(v.id)) return false;
      if (activeTab === 'my_channel' && v.author_uid !== user?.uid) return false;
      if (activeTab === 'subscriptions') {
        if (!user) return false;
        const ch = channelMap.get(v.author_uid);
        if (!ch || !ch.subscribers.includes(user.uid)) return false;
      }

      if (selectedTag !== 'All') {
        const normalizedSelected = selectedTag.toLowerCase();
        const hasTag = (v.tags || []).some((t) => t.toLowerCase() === normalizedSelected);
        if (!hasTag) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchDesc = v.description.toLowerCase().includes(q);
        const matchAuthor = v.author_name.toLowerCase().includes(q);
        const matchHandle = v.author_username.toLowerCase().includes(q.replace(/^@/, ''));
        const matchTag = (v.tags || []).some((t) =>
          t.toLowerCase().includes(q.startsWith('#') ? q : `#${q}`) ||
          t.toLowerCase().includes(q)
        );
        if (!matchTitle && !matchDesc && !matchAuthor && !matchHandle && !matchTag) {
          return false;
        }
      }
      return true;
    });
  }, [videos, activeTab, selectedTag, searchQuery, savedIds, user, channelMap]);

  // Filtered channels when in Channels directory tab or searching
  const filteredChannels = useMemo(() => {
    const all = Array.from(channelMap.values());
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase().trim();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.handle.toLowerCase().includes(q.replace(/^@/, '')) ||
        c.bio.toLowerCase().includes(q)
    );
  }, [channelMap, searchQuery]);

  const handleOpenChannelPage = (uid: string) => {
    setActiveVideoId(null);
    setViewingChannelUid(uid);
    setChannelSubTab('videos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditChannelModal = () => {
    if (!user) {
      toast.error('Please login to create or customize your channel');
      return;
    }
    const current = myChannel;
    setChannelNameInput(current?.name || profile?.fullName || user.displayName || '');
    setChannelHandleInput(current?.handle || profile?.username || '');
    setChannelBioInput(
      current?.bio || 'Welcome to my official EduTube channel! Subscribe for regular videos.'
    );
    setChannelAvatarPreview(current?.avatar_url || profile?.photoURL || user.photoURL || '');
    setChannelBannerPreview(
      current?.banner_url ||
        createChannelBannerSvg(current?.name || 'My Channel', current?.handle || 'creator')
    );
    setChannelAvatarBlob(null);
    setChannelBannerBlob(null);
    setIsChannelModalOpen(true);
  };

  const handleSaveChannelProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!channelNameInput.trim()) {
      toast.error('Please enter your channel name');
      return;
    }

    setIsSavingChannel(true);
    try {
      let finalAvatarUrl = channelAvatarPreview;
      let finalBannerUrl = channelBannerPreview;

      if (channelAvatarBlob) {
        const uploadedAvatar = await uploadMediaToEduTubeCloud(
          channelAvatarBlob,
          `channel_avatar_${user.uid}.jpg`,
          'thumbnails'
        );
        finalAvatarUrl = uploadedAvatar.url;
      }

      if (channelBannerBlob) {
        const uploadedBanner = await uploadMediaToEduTubeCloud(
          channelBannerBlob,
          `channel_banner_${user.uid}.jpg`,
          'thumbnails'
        );
        finalBannerUrl = uploadedBanner.url;
      }

      const saved = await saveEduTubeChannel({
        uid: user.uid,
        name: channelNameInput.trim(),
        handle: channelHandleInput.trim(),
        bio: channelBioInput.trim(),
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl,
      });

      setChannels((prev) => [saved, ...prev.filter((c) => c.uid !== saved.uid)]);
      setVideos((prev) =>
        prev.map((v) =>
          v.author_uid === saved.uid
            ? {
                ...v,
                author_name: saved.name,
                author_username: saved.handle,
                author_photo: saved.avatar_url || v.author_photo,
              }
            : v
        )
      );
      setIsChannelModalOpen(false);
      setViewingChannelUid(saved.uid);
      toast.success('Your EduTube Channel is live!');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save channel');
    } finally {
      setIsSavingChannel(false);
    }
  };

  const handleToggleSubscribe = async (targetChannel: EduTubeChannel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast.error('Please login to subscribe to channels');
      return;
    }
    if (targetChannel.uid === user.uid) {
      handleOpenEditChannelModal();
      return;
    }

    const { updatedChannel, isSubscribed } = await toggleSubscribeEduTubeChannel(
      targetChannel,
      user.uid
    );
    setChannels((prev) => [
      updatedChannel,
      ...prev.filter((c) => c.uid !== updatedChannel.uid),
    ]);
    toast.success(
      isSubscribed
        ? `Subscribed to ${updatedChannel.name}!`
        : `Unsubscribed from ${updatedChannel.name}`
    );
  };

  const handleSelectVideoToWatch = async (video: EduTubeVideo) => {
    setViewingChannelUid(null);
    setActiveVideoId(video.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const nextViews = (video.views || 0) + 1;
    setVideos((prev) =>
      prev.map((item) => (item.id === video.id ? { ...item, views: nextViews } : item))
    );
    await updateEduTubeVideoRecord(video.id, { views: nextViews });
  };

  const handleToggleLike = async (video: EduTubeVideo) => {
    if (!user) {
      toast.error('Please login to like videos');
      return;
    }
    const alreadyLiked = video.liked_by.includes(user.uid);
    const nextLikedBy = alreadyLiked
      ? video.liked_by.filter((id) => id !== user.uid)
      : [...video.liked_by, user.uid];
    const nextLikes = Math.max(0, (video.likes || 0) + (alreadyLiked ? -1 : 1));

    setVideos((prev) =>
      prev.map((item) =>
        item.id === video.id ? { ...item, likes: nextLikes, liked_by: nextLikedBy } : item
      )
    );
    await updateEduTubeVideoRecord(video.id, { likes: nextLikes, liked_by: nextLikedBy });
  };

  const handleToggleSave = (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = toggleSavedVideoId(videoId);
    setSavedIds(next);
    toast.success(next.includes(videoId) ? 'Saved to Watch Later' : 'Removed from Saved');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVideo) return;
    if (!user) {
      toast.error('Please login to post a comment');
      return;
    }
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const senderChannel = myChannel;
    const newComment = {
      id: `cmt_${Date.now()}`,
      author_uid: user.uid,
      author_name: senderChannel?.name || profile?.fullName || user.displayName || 'User',
      author_username: senderChannel?.handle || profile?.username || 'user',
      author_photo: senderChannel?.avatar_url || profile?.photoURL || user.photoURL || '',
      text: trimmed,
      created_at: new Date().toISOString(),
    };

    const nextComments = [newComment, ...(activeVideo.comments || [])];
    setCommentText('');
    setVideos((prev) =>
      prev.map((item) =>
        item.id === activeVideo.id ? { ...item, comments: nextComments } : item
      )
    );
    await updateEduTubeVideoRecord(activeVideo.id, { comments: nextComments });
    toast.success('Comment posted');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activeVideo) return;
    const nextComments = activeVideo.comments.filter((c) => c.id !== commentId);
    setVideos((prev) =>
      prev.map((item) =>
        item.id === activeVideo.id ? { ...item, comments: nextComments } : item
      )
    );
    await updateEduTubeVideoRecord(activeVideo.id, { comments: nextComments });
  };

  const handleDeleteVideo = async (video: EduTubeVideo) => {
    await deleteEduTubeVideoRecord(video.id);
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
    if (activeVideoId === video.id) {
      setActiveVideoId(null);
    }
    toast.success('Video deleted');
  };

  // Handle video file selection in Upload Modal
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedVideoFile(file);
    if (!videoTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      setVideoTitle(cleanName);
    }

    const toastId = toast.loading('Inspecting video duration & capturing frame...');
    try {
      const info = await inspectVideoFile(file);
      setVideoDuration(info.durationFormatted);
      if (info.durationSeconds <= 65 || info.isVertical) {
        setVideoType('short');
      } else {
        setVideoType('long');
      }
      if (info.frameDataUrl) {
        setExtractedFrameDataUrl(info.frameDataUrl);
        if (!customThumbnailBlob) {
          setThumbnailPreview(info.frameDataUrl);
        }
      }
      toast.success(`Video ready (${info.durationFormatted})`, { id: toastId });
    } catch {
      toast.dismiss(toastId);
    }
  };

  // Handle Custom Thumbnail file selection
  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressThumbnailFile(file, 1280, 720);
      setCustomThumbnailBlob(compressed.blob);
      setThumbnailPreview(compressed.dataUrl);
      toast.success('Custom HD thumbnail applied');
    } catch {
      toast.error('Could not process thumbnail image');
    }
  };

  const handleGenerateBannerThumbnail = () => {
    const parsedTags = parseVideoTags(videoTagsInput, videoTitle, videoDescription);
    const generated = createCustomBannerThumbnail(
      videoTitle || 'New Video',
      parsedTags.slice(0, 3).join(' · ')
    );
    setCustomThumbnailBlob(null);
    setThumbnailPreview(generated);
    toast.success('Generated custom title thumbnail');
  };

  const handlePublishUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to upload a video');
      return;
    }
    if (!videoTitle.trim()) {
      toast.error('Please enter a video title');
      return;
    }
    if (uploadSourceMode === 'file' && !selectedVideoFile) {
      toast.error('Please select a video file to upload');
      return;
    }
    if (uploadSourceMode === 'url' && !externalVideoUrl.trim()) {
      toast.error('Please paste a valid video URL');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      let finalVideoUrl = externalVideoUrl.trim();
      let storageProvider: 'supabase' | 'external' | 'local' = 'external';

      if (uploadSourceMode === 'file' && selectedVideoFile) {
        const videoRes = await uploadMediaToEduTubeCloud(
          selectedVideoFile,
          selectedVideoFile.name,
          'videos',
          (pct) => setUploadProgress(Math.max(10, Math.min(85, pct)))
        );
        finalVideoUrl = videoRes.url;
        storageProvider = videoRes.provider === 'supabase' ? 'supabase' : 'local';
      } else {
        setUploadProgress(65);
      }

      const finalTags = parseVideoTags(videoTagsInput, videoTitle, videoDescription);

      let finalThumbnailUrl =
        thumbnailPreview ||
        createCustomBannerThumbnail(videoTitle.trim(), finalTags.slice(0, 3).join(' · '));

      const blobToUpload =
        customThumbnailBlob ||
        (thumbnailPreview.startsWith('data:image/jpeg')
          ? dataUrlToBlob(thumbnailPreview)
          : null);

      if (blobToUpload) {
        const thumbRes = await uploadMediaToEduTubeCloud(
          blobToUpload,
          `thumb_${Date.now()}.jpg`,
          'thumbnails'
        );
        finalThumbnailUrl = thumbRes.url;
      }

      setUploadProgress(92);

      // Ensure the uploader's channel exists in Supabase so others can subscribe/follow them
      const creatorChannel = await saveEduTubeChannel({
        uid: user.uid,
        name: myChannel?.name || profile?.fullName || user.displayName || 'Creator',
        handle: myChannel?.handle || profile?.username || 'creator',
        bio:
          myChannel?.bio ||
          'Welcome to my official EduTube channel! Subscribe for regular videos.',
        avatar_url: myChannel?.avatar_url || profile?.photoURL || user.photoURL || '',
        banner_url: myChannel?.banner_url,
      });

      setChannels((prev) => [
        creatorChannel,
        ...prev.filter((c) => c.uid !== creatorChannel.uid),
      ]);

      const created = await publishEduTubeVideo({
        title: videoTitle.trim(),
        description: videoDescription.trim(),
        video_url: finalVideoUrl,
        thumbnail_url: finalThumbnailUrl,
        duration: videoDuration || (videoType === 'short' ? '0:45' : '08:00'),
        video_type: videoType,
        tags: finalTags,
        author_uid: user.uid,
        author_name: creatorChannel.name,
        author_username: creatorChannel.handle,
        author_photo: creatorChannel.avatar_url,
        storage_provider: storageProvider,
      });

      setUploadProgress(100);
      setVideos((prev) => [created, ...prev.filter((v) => v.id !== created.id)]);

      // Reset form
      setIsUploadOpen(false);
      setSelectedVideoFile(null);
      setExternalVideoUrl('');
      setVideoTitle('');
      setVideoDescription('');
      setVideoTagsInput('#edutube #video #trending');
      setCustomThumbnailBlob(null);
      setThumbnailPreview('');
      setViewingChannelUid(null);
      setActiveVideoId(created.id);
      toast.success('Video published to your channel!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish video');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveCloudSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudConfig({
      supabaseUrl: supabaseUrlInput,
      supabaseAnonKey: supabaseKeyInput,
    });
    setIsSetupModalOpen(false);
    toast.success('EduTube Cloud settings saved!');
    loadData();
  };

  const handleChangePlaybackSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleClickHashtag = (tag: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clean = tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`;
    setActiveVideoId(null);
    setViewingChannelUid(null);
    setActiveTab('home');
    setSelectedTag(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      {/* Top EduTube Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {(activeVideo || viewingChannel) && (
            <button
              onClick={() => {
                setActiveVideoId(null);
                setViewingChannelUid(null);
              }}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Back to Home Feed"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div
            onClick={() => {
              setActiveVideoId(null);
              setViewingChannelUid(null);
              setActiveTab('home');
              setSelectedTag('All');
            }}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                EduTube
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Creator Channels, Shorts & Videos
              </p>
            </div>
          </div>
        </div>

        {/* Search + Channel & Upload Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeVideoId) setActiveVideoId(null);
                if (viewingChannelUid) setViewingChannelUid(null);
              }}
              placeholder="Search videos, #hashtags, or @channels..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {user && (
            <button
              onClick={() => handleOpenChannelPage(user.uid)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="View or Customize Your Channel"
            >
              <Tv className="w-4 h-4 text-red-500" />
              <span>My Channel</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Cloud Storage Settings"
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>{isSupabaseConfigured() ? 'Cloud Connected' : 'Setup Cloud'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!thumbnailPreview) {
                setThumbnailPreview(
                  createCustomBannerThumbnail('New Video', '#edutube · #trending')
                );
              }
              setIsUploadOpen(true);
            }}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* 1. WATCH VIDEO VIEW (YouTube Player + Channel Subscribe Bar + Hashtags + Comments) */}
      {activeVideo ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className={theaterMode ? 'lg:col-span-12' : 'lg:col-span-8'}>
            {/* Video Player Frame */}
            <div className="w-full bg-black rounded-xl overflow-hidden border border-slate-800 shadow-lg">
              {(() => {
                const embed = getEmbedInfo(activeVideo.video_url);
                if (embed.type === 'youtube' || embed.type === 'gdrive') {
                  return (
                    <div className="relative w-full aspect-video">
                      <iframe
                        src={embed.embedUrl}
                        title={activeVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  );
                }
                return (
                  <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                    {isBufferingChunks ? (
                      <div className="flex flex-col items-center justify-center text-white p-6 text-center">
                        <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm font-semibold">
                          Loading HD Video ({chunkBufferProgress}%)...
                        </p>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        src={resolvedPlayableUrl || embed.embedUrl}
                        poster={activeVideo.thumbnail_url}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full max-h-[75vh] object-contain"
                      />
                    )}
                  </div>
                );
              })()}

              {/* Player Controls Bar (Speed + Theater Mode) */}
              <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="font-mono tabular-nums">{activeVideo.duration}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeVideo.video_type === 'short' ? 'Short' : 'Full Video'}</span>
                  {(activeVideo.tags || []).slice(0, 3).map((tag) => (
                    <React.Fragment key={tag}>
                      <span aria-hidden="true">·</span>
                      <button
                        onClick={() => handleClickHashtag(tag)}
                        className="text-blue-400 hover:underline whitespace-nowrap"
                      >
                        {tag}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getEmbedInfo(activeVideo.video_url).type === 'video' && (
                    <button
                      onClick={handleChangePlaybackSpeed}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono tabular-nums flex items-center gap-1 transition-colors whitespace-nowrap"
                      title="Change Playback Speed"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{playbackRate}x Speed</span>
                    </button>
                  )}
                  <button
                    onClick={() => setTheaterMode(!theaterMode)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hidden lg:flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>{theaterMode ? 'Standard View' : 'Theater View'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Video Title, Channel Subscribe Row & Actions */}
            <div className="mt-4">
              {/* Clickable Hashtags above title (YouTube style) */}
              {(activeVideo.tags || []).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {activeVideo.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleClickHashtag(tag)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {activeVideo.title}
              </h2>

              {/* YouTube Channel Owner + Subscribe Button + Like/Save/Share Bar */}
              {(() => {
                const videoChannel = getChannelForVideo(activeVideo);
                const isSubscribed = Boolean(
                  user && videoChannel.subscribers.includes(user.uid)
                );
                const isOwnChannel = user?.uid === videoChannel.uid;

                return (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    {/* Left: Channel Avatar + Name + Subscriber Count + Subscribe Button */}
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => handleOpenChannelPage(videoChannel.uid)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        {videoChannel.avatar_url ? (
                          <img
                            src={videoChannel.avatar_url}
                            alt={videoChannel.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                            {videoChannel.name[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-1.5">
                            <span>{videoChannel.name}</span>
                            {isOfficialChannel(videoChannel) && (
                              <CheckCircle2
                                className="w-4 h-4 text-blue-500 fill-blue-500/20 shrink-0"
                                title="Official Verified Channel"
                              />
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                            @{videoChannel.handle} · {videoChannel.subscribers.length}{' '}
                            {videoChannel.subscribers.length === 1 ? 'subscriber' : 'subscribers'}
                          </div>
                        </div>
                      </div>

                      {isOwnChannel ? (
                        <button
                          onClick={handleOpenEditChannelModal}
                          className="ml-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Customize Channel</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleSubscribe(videoChannel)}
                          className={`ml-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                            isSubscribed
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                          }`}
                        >
                          {isSubscribed ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>Subscribed</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>Subscribe</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Right: Like, Save, Share, Delete */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleToggleLike(activeVideo)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                          user && activeVideo.liked_by.includes(user.uid)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="font-mono tabular-nums">{activeVideo.likes}</span>
                      </button>

                      <button
                        onClick={() => handleToggleSave(activeVideo.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
                          savedIds.includes(activeVideo.id)
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>{savedIds.includes(activeVideo.id) ? 'Saved' : 'Save'}</span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('Video link copied to clipboard!');
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>

                      {(user?.uid === activeVideo.author_uid || isAdmin) && (
                        <button
                          onClick={() => handleDeleteVideo(activeVideo)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* YouTube Description Box */}
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white font-mono tabular-nums mb-2">
                  <span>{activeVideo.views.toLocaleString()} views</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatDistanceToNow(new Date(activeVideo.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {(activeVideo.tags || []).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleClickHashtag(tag)}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-sans"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {activeVideo.description ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {activeVideo.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No additional description provided.
                  </p>
                )}
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Comments ({activeVideo.comments?.length || 0})</span>
                </h3>

                <form onSubmit={handlePostComment} className="flex gap-2.5 mb-6">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Comment</span>
                  </button>
                </form>

                <div className="space-y-3">
                  {(activeVideo.comments || []).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                      No comments yet. Start the conversation!
                    </p>
                  ) : (
                    activeVideo.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            onClick={() => handleOpenChannelPage(c.author_uid)}
                            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
                          >
                            {c.author_photo ? (
                              <img
                                src={c.author_photo}
                                alt={c.author_name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              c.author_name[0]?.toUpperCase() || 'U'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-xs">
                              <button
                                onClick={() => handleOpenChannelPage(c.author_uid)}
                                className="font-semibold text-slate-900 dark:text-white hover:underline"
                              >
                                {c.author_name}
                              </button>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {formatDistanceToNow(new Date(c.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                              {c.text}
                            </p>
                          </div>
                        </div>
                        {(user?.uid === c.author_uid || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Up Next / Related Videos Sidebar */}
          <div className={theaterMode ? 'lg:col-span-12' : 'lg:col-span-4'}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Up Next · Recommended Videos
            </h3>
            <div className="space-y-3">
              {videos
                .filter((v) => v.id !== activeVideo.id)
                .slice(0, 10)
                .map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => handleSelectVideoToWatch(vid)}
                    className="group flex gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer transition-all"
                  >
                    <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={vid.thumbnail_url}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono tabular-nums">
                        {vid.duration}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400">
                        {vid.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChannelPage(vid.author_uid);
                        }}
                        className="mt-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white truncate block"
                      >
                        {vid.author_name}
                      </button>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        {vid.views.toLocaleString()} views ·{' '}
                        {formatDistanceToNow(new Date(vid.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : viewingChannel ? (
        /* 2. DEDICATED YOUTUBE CHANNEL PAGE VIEW */
        <div className="mt-6">
          {/* Channel Banner */}
          <div className="w-full h-36 sm:h-48 md:h-56 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
            <img
              src={
                viewingChannel.banner_url ||
                createChannelBannerSvg(viewingChannel.name, viewingChannel.handle)
              }
              alt={viewingChannel.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Channel Profile Header */}
          {(() => {
            const channelVideos = videos.filter((v) => v.author_uid === viewingChannel.uid);
            const totalViews = channelVideos.reduce((acc, v) => acc + (v.views || 0), 0);
            const isSubscribed = Boolean(
              user && viewingChannel.subscribers.includes(user.uid)
            );
            const isOwnChannel = user?.uid === viewingChannel.uid;

            return (
              <>
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-start sm:items-center gap-4">
                    {viewingChannel.avatar_url ? (
                      <img
                        src={viewingChannel.avatar_url}
                        alt={viewingChannel.name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-red-600 text-white font-bold text-3xl flex items-center justify-center shrink-0">
                        {viewingChannel.name[0]?.toUpperCase() || 'C'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {viewingChannel.name}
                        </h2>
                        {isOfficialChannel(viewingChannel) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                            <span>Official</span>
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          @{viewingChannel.handle}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {viewingChannel.subscribers.length}{' '}
                          {viewingChannel.subscribers.length === 1
                            ? 'subscriber'
                            : 'subscribers'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{channelVideos.length} videos</span>
                        <span aria-hidden="true">·</span>
                        <span>{totalViews.toLocaleString()} views</span>
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl line-clamp-2">
                        {viewingChannel.bio}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {isOwnChannel ? (
                      <>
                        <button
                          onClick={handleOpenEditChannelModal}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Customize Channel</span>
                        </button>
                        <button
                          onClick={() => setIsUploadOpen(true)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Video</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleSubscribe(viewingChannel)}
                        className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
                          isSubscribed
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                        }`}
                      >
                        {isSubscribed ? (
                          <>
                            <UserCheck className="w-4 h-4" />
                            <span>Subscribed</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Subscribe</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Channel Sub-Navigation Tabs: Videos | Shorts | About */}
                <div className="flex items-center gap-2 mt-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <button
                    onClick={() => setChannelSubTab('videos')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      channelSubTab === 'videos'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Videos ({channelVideos.filter((v) => v.video_type === 'long').length})
                  </button>
                  <button
                    onClick={() => setChannelSubTab('shorts')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      channelSubTab === 'shorts'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Shorts ({channelVideos.filter((v) => v.video_type === 'short').length})
                  </button>
                  <button
                    onClick={() => setChannelSubTab('about')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      channelSubTab === 'about'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    About Channel
                  </button>
                </div>

                {channelSubTab === 'about' ? (
                  <div className="mt-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-2xl space-y-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      About {viewingChannel.name}
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {viewingChannel.bio}
                    </p>
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-xs font-mono tabular-nums">
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Subscribers</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {viewingChannel.subscribers.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Videos</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {channelVideos.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 dark:text-slate-400">Total Views</div>
                        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {totalViews.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const list = channelVideos.filter((v) =>
                      channelSubTab === 'shorts'
                        ? v.video_type === 'short'
                        : v.video_type === 'long'
                    );
                    if (list.length === 0) {
                      return (
                        <div className="mt-6 p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                          <Film className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            No {channelSubTab} uploaded yet
                          </h4>
                          {isOwnChannel && (
                            <button
                              onClick={() => setIsUploadOpen(true)}
                              className="mt-3 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload First Video</span>
                            </button>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {list.map((video) => (
                          <div
                            key={video.id}
                            onClick={() => handleSelectVideoToWatch(video)}
                            className="group rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col"
                          >
                            <div className="relative w-full aspect-video bg-slate-950 overflow-hidden">
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-mono tabular-nums">
                                {video.duration}
                              </span>
                            </div>
                            <div className="p-3.5">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400">
                                {video.title}
                              </h3>
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                                <span>{video.views.toLocaleString()} views</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {formatDistanceToNow(new Date(video.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </>
            );
          })()}
        </div>
      ) : (
        /* 3. MAIN BROWSE FEED & CHANNELS DIRECTORY VIEW */
        <div className="mt-5">
          {/* Primary Navigation Bar */}
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-lg overflow-x-auto">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'home'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveTab('shorts')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'shorts'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Shorts</span>
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'subscriptions'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Subscriptions ({subscribedChannels.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('channels')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'channels'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Explore Channels ({filteredChannels.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === 'saved'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Saved ({savedIds.length})
              </button>
              {user && (
                <button
                  onClick={() => handleOpenChannelPage(user.uid)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Your Channel
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Trending #Hashtags Filter Strip (Replaces old Physics/Chemistry/Maths filter) */}
          {activeTab !== 'channels' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
              {availableHashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                    selectedTag === tag
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Subscribed Channels Quick Strip when inside Subscriptions tab */}
          {activeTab === 'subscriptions' && subscribedChannels.length > 0 && (
            <div className="mb-5 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4 overflow-x-auto">
              {subscribedChannels.map((ch) => (
                <button
                  key={ch.uid}
                  onClick={() => handleOpenChannelPage(ch.uid)}
                  className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
                >
                  {ch.avatar_url ? (
                    <img
                      src={ch.avatar_url}
                      alt={ch.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                      {ch.name[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {ch.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      @{ch.handle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB CONTENT: CHANNELS DIRECTORY OR VIDEO FEED */}
          {activeTab === 'channels' ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Creator Channels on EduTube
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Subscribe to channels to watch their latest videos or create your own channel
                  </p>
                </div>
                {user && (
                  <button
                    onClick={handleOpenEditChannelModal}
                    className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Create / Edit My Channel</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredChannels.map((ch) => {
                  const chVids = videos.filter((v) => v.author_uid === ch.uid);
                  const isSubscribed = Boolean(user && ch.subscribers.includes(user.uid));
                  const isOwn = user?.uid === ch.uid;

                  return (
                    <div
                      key={ch.uid}
                      onClick={() => handleOpenChannelPage(ch.uid)}
                      className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col"
                    >
                      <div className="h-24 bg-slate-900 overflow-hidden">
                        <img
                          src={ch.banner_url || createChannelBannerSvg(ch.name, ch.handle)}
                          alt={ch.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {ch.avatar_url ? (
                                <img
                                  src={ch.avatar_url}
                                  alt={ch.name}
                                  referrerPolicy="no-referrer"
                                  className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                                  {ch.name[0]?.toUpperCase() || 'C'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span className="truncate">{ch.name}</span>
                                  {isOfficialChannel(ch) && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  )}
                                </h3>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums truncate">
                                  @{ch.handle} · {ch.subscribers.length} subscribers ·{' '}
                                  {chVids.length} videos
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {ch.bio}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            View Channel &rarr;
                          </span>
                          {isOwn ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditChannelModal();
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap"
                            >
                              Customize
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleToggleSubscribe(ch, e)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                                isSubscribed
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                              }`}
                            >
                              {isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
                >
                  <div className="w-full aspect-video bg-slate-200 dark:bg-slate-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/5" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="mt-8 p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <Film className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeTab === 'subscriptions'
                  ? 'No videos from subscribed channels yet'
                  : 'No videos found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {activeTab === 'subscriptions'
                  ? 'Explore creator channels and click Subscribe to see their videos here!'
                  : 'Upload your own video with a custom thumbnail and #hashtags, or explore other tags.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                {activeTab === 'subscriptions' ? (
                  <button
                    onClick={() => setActiveTab('channels')}
                    className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
                  >
                    Explore Channels
                  </button>
                ) : (
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Video</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
              {filteredVideos.map((video) => {
                const vidChannel = getChannelForVideo(video);
                return (
                  <div
                    key={video.id}
                    onClick={() => handleSelectVideoToWatch(video)}
                    className="group rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col"
                  >
                    {/* 16:9 Thumbnail Frame */}
                    <div className="relative w-full aspect-video bg-slate-950 overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-white text-xs font-mono tabular-nums">
                        {video.duration}
                      </span>
                    </div>

                    {/* Card Details (YouTube Style: Channel Avatar on Left + Title, Channel Name, Views & Hashtags) */}
                    <div className="p-3.5 flex gap-3 flex-1">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenChannelPage(vidChannel.uid);
                        }}
                        className="shrink-0 mt-0.5"
                        title={`Visit ${vidChannel.name}'s Channel`}
                      >
                        {vidChannel.avatar_url ? (
                          <img
                            src={vidChannel.avatar_url}
                            alt={vidChannel.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">
                            {vidChannel.name[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                          {video.title}
                        </h3>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChannelPage(vidChannel.uid);
                          }}
                          className="mt-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white truncate block"
                        >
                          {vidChannel.name} · @{vidChannel.handle}
                        </button>

                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          <span>{video.views.toLocaleString()} views</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {formatDistanceToNow(new Date(video.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>

                        {(video.tags || []).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400">
                            {video.tags.slice(0, 3).map((tag) => (
                              <button
                                key={tag}
                                onClick={(e) => handleClickHashtag(tag, e)}
                                className="hover:underline"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / CUSTOMIZE YOUTUBE CHANNEL MODAL */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Tv className="w-5 h-5 text-red-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Customize Your EduTube Channel
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Set your channel name, @handle, bio, profile picture, and banner
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChannelModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannelProfile} className="mt-4 space-y-4">
              {isAdmin && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Official JEE Community Channel Kit</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Apply official JEE Community HD Logo, Wide Banner, @jeecommunity handle &amp; bio
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setChannelNameInput('JEE Community');
                      setChannelHandleInput('jeecommunity');
                      setChannelBioInput(JEE_COMMUNITY_OFFICIAL_BIO);
                      setChannelAvatarPreview(JEE_COMMUNITY_OFFICIAL_LOGO_URL);
                      setChannelBannerPreview(JEE_COMMUNITY_OFFICIAL_BANNER_URL);
                      setChannelAvatarBlob(null);
                      setChannelBannerBlob(null);
                      toast.success('Official JEE Community Logo & Banner applied!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
                  >
                    Apply Official Logo &amp; Banner
                  </button>
                </div>
              )}

              {/* Banner Preview + Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Channel Banner
                </label>
                <div className="relative h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <img
                    src={
                      channelBannerPreview ||
                      createChannelBannerSvg(channelNameInput || 'My Channel', channelHandleInput)
                    }
                    alt="Channel Banner"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-black text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressThumbnailFile(file, 1600, 400);
                          setChannelBannerBlob(compressed.blob);
                          setChannelBannerPreview(compressed.dataUrl);
                        } catch {
                          toast.error('Could not process banner image');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Channel Avatar + Name & Handle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  {channelAvatarPreview ? (
                    <img
                      src={channelAvatarPreview}
                      alt="Channel Avatar"
                      className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-600 text-white font-bold text-xl flex items-center justify-center">
                      {channelNameInput[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <label className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                    <ImageIcon className="w-3 h-3" />
                    <span>Change Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressThumbnailFile(file, 400, 400);
                          setChannelAvatarBlob(compressed.blob);
                          setChannelAvatarPreview(compressed.dataUrl);
                        } catch {
                          toast.error('Could not process channel logo');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Channel Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={channelNameInput}
                      onChange={(e) => setChannelNameInput(e.target.value)}
                      placeholder="e.g. Aniket Official"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Channel Handle (@)
                    </label>
                    <input
                      type="text"
                      value={channelHandleInput}
                      onChange={(e) => setChannelHandleInput(e.target.value)}
                      placeholder="e.g. aniket_official"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Channel Description / Bio
                </label>
                <textarea
                  rows={3}
                  value={channelBioInput}
                  onChange={(e) => setChannelBioInput(e.target.value)}
                  placeholder="Tell viewers what kind of videos you upload..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingChannel}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingChannel ? 'Saving...' : 'Save Channel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD VIDEO STUDIO MODAL (Pure YouTube Style: Title, Description, #Hashtags, Format, Thumbnail) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Upload Video to {myChannel?.name || 'Your Channel'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload Long Videos or Shorts with Custom Thumbnails &amp; #Hashtags
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishUpload} className="mt-5 space-y-5">
              {/* Source Mode Selector: Direct Video File vs External Link */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg">
                <button
                  type="button"
                  onClick={() => setUploadSourceMode('file')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    uploadSourceMode === 'file'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Upload Video File (MP4 / WebM)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadSourceMode('url')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    uploadSourceMode === 'url'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Paste YouTube / Drive / MP4 Link</span>
                </button>
              </div>

              {uploadSourceMode === 'file' ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 text-center">
                  <input
                    type="file"
                    accept="video/*"
                    id="edutube-video-file"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="edutube-video-file"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Film className="w-8 h-8 text-red-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {selectedVideoFile
                        ? `${selectedVideoFile.name} (${(
                            selectedVideoFile.size /
                            (1024 * 1024)
                          ).toFixed(1)} MB)`
                        : 'Select Video File from Phone or PC'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports both Long Videos (16:9) &amp; Vertical Shorts (9:16)
                    </span>
                  </label>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Video Link (YouTube, YouTube Shorts, Google Drive, or direct MP4 URL)
                  </label>
                  <input
                    type="url"
                    value={externalVideoUrl}
                    onChange={(e) => setExternalVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or direct video link"
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Custom Thumbnail Studio */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Video Thumbnail (16:9 HD)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload custom thumbnail image, use video frame, or generate banner
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="edutube-thumb-file"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="edutube-thumb-file"
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Upload Custom Image</span>
                    </label>

                    {extractedFrameDataUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomThumbnailBlob(null);
                          setThumbnailPreview(extractedFrameDataUrl);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      >
                        Use Video Frame
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateBannerThumbnail}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-semibold flex items-center gap-1 hover:bg-blue-600/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto Banner</span>
                    </button>
                  </div>
                </div>

                {thumbnailPreview && (
                  <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-mono">
                      {videoDuration}
                    </span>
                  </div>
                )}
              </div>

              {/* Video Title, Format, Description & #Hashtags */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Video Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="e.g. My Daily Vlog & Quick Question Trick #vlog #solution"
                      className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Video Format
                    </label>
                    <select
                      value={videoType}
                      onChange={(e) => setVideoType(e.target.value as VideoFormat)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="long">Long Video (Standard)</option>
                      <option value="short">Short (&lt; 60s / Vertical)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Tell viewers about your video, links, timestamps, or #hashtags..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    <span>Hashtags &amp; Search Tags (Separated by space or comma)</span>
                  </label>
                  <input
                    type="text"
                    value={videoTagsInput}
                    onChange={(e) => setVideoTagsInput(e.target.value)}
                    placeholder="#vlog #solution #tricks #shorts #motivation"
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Quick add:
                    </span>
                    {SUGGESTED_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!videoTagsInput.toLowerCase().includes(tag)) {
                            setVideoTagsInput((prev) => `${prev.trim()} ${tag}`.trim());
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">
                    <span>Uploading video &amp; thumbnail to EduTube Cloud...</span>
                    <span className="font-mono tabular-nums">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Publishing...' : 'Publish Video'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CLOUD SETUP GUIDE MODAL */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    EduTube Unlimited Cloud Setup (0 Firebase Reads)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Connected to Supabase Cloud Storage &amp; Database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="relative mt-2">
                <pre className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-40">
                  {SUPABASE_SETUP_SQL}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                    toast.success('SQL Script copied!');
                  }}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy SQL</span>
                </button>
              </div>

              <form onSubmit={handleSaveCloudSettings} className="space-y-3 pt-2">
                <div>
                  <label className="block font-semibold mb-1">VITE_SUPABASE_URL</label>
                  <input
                    type="url"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">VITE_SUPABASE_ANON_KEY</label>
                  <input
                    type="text"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSetupModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save &amp; Connect Cloud</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
