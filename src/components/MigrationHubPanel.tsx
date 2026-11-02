import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Pin,
  Bell,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Sparkles,
  Globe,
  Eye,
  Copy,
  ShieldCheck,
  ArrowRight,
  Search,
} from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import {
  NEW_WEBSITE_COMMUNITY_URL,
  OLD_WEBSITE_URL,
  DEFAULT_MIGRATION_POST_TEXT,
  DEFAULT_MIGRATION_NOTIFICATION_TEXT,
  MigrationHubState,
  getMigrationHubState,
  publishMigrationPinnedPost,
  publishMigrationStatusStory,
  broadcastMigrationNotifications,
  boostMigrationToTop,
  deactivateMigrationBridge,
  generateMigrationPostBannerDataUrl,
  generateMigrationStatusStoryDataUrl,
} from '../lib/migrationBridge';

interface MigrationHubPanelProps {
  adminUid: string;
  adminAvatar?: string;
  totalUsersCount?: number;
}

export default function MigrationHubPanel({
  adminUid,
  adminAvatar,
  totalUsersCount = 0,
}: MigrationHubPanelProps) {
  const [state, setState] = useState<MigrationHubState>({
    isActive: false,
    pinnedPostId: null,
    statusStoryId: null,
    targetUrl: NEW_WEBSITE_COMMUNITY_URL,
    postText: DEFAULT_MIGRATION_POST_TEXT,
    notificationText: DEFAULT_MIGRATION_NOTIFICATION_TEXT,
    autoKeepAtTop: true,
    lastBoostedAt: 0,
    notificationsSentCount: 0,
  });

  const [loadingState, setLoadingState] = useState(true);
  const [isLaunchingAll, setIsLaunchingAll] = useState(false);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [isUpdatingStory, setIsUpdatingStory] = useState(false);
  const [isSendingNotifs, setIsSendingNotifs] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [postBannerPreview, setPostBannerPreview] = useState<string>('');
  const [storyBannerPreview, setStoryBannerPreview] = useState<string>('');
  const [activePreviewTab, setActivePreviewTab] = useState<'post' | 'story' | 'seo'>('post');
  const [postExistsInDb, setPostExistsInDb] = useState(false);
  const [storyExistsInDb, setStoryExistsInDb] = useState(false);

  const loadHubStatus = async () => {
    setLoadingState(true);
    try {
      const hubState = await getMigrationHubState();
      setState(hubState);

      if (hubState.pinnedPostId) {
        const pSnap = await getDoc(doc(db, 'posts', hubState.pinnedPostId));
        setPostExistsInDb(pSnap.exists());
      } else {
        setPostExistsInDb(false);
      }

      if (hubState.statusStoryId) {
        const sSnap = await getDoc(doc(db, 'admin_statuses', hubState.statusStoryId));
        setStoryExistsInDb(sSnap.exists());
      } else {
        setStoryExistsInDb(false);
      }
    } catch (e) {
      console.error('Error loading migration hub status:', e);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    loadHubStatus();
  }, []);

  useEffect(() => {
    try {
      setPostBannerPreview(generateMigrationPostBannerDataUrl(state.targetUrl));
      setStoryBannerPreview(generateMigrationStatusStoryDataUrl(state.targetUrl));
    } catch (e) {
      console.error('Failed to generate preview banners:', e);
    }
  }, [state.targetUrl]);

  const handleLaunchAllChannels = async () => {
    if (!adminUid) return;
    setIsLaunchingAll(true);
    const toastId = toast.loading('Purani website ke liye teeno Migration Channels live kiye ja rahe hain...');
    try {
      // 1. Publish Pinned Post with native clickable Open button
      const postId = await publishMigrationPinnedPost({
        adminUid,
        targetUrl: state.targetUrl,
        postText: state.postText,
        existingPostId: state.pinnedPostId,
      });

      // 2. Publish Admin Status Story
      const storyId = await publishMigrationStatusStory({
        adminUid,
        targetUrl: state.targetUrl,
        existingStatusId: state.statusStoryId,
      });

      // 3. Broadcast In-App Bell Notification to all users
      const sentCount = await broadcastMigrationNotifications({
        adminUid,
        adminAvatar,
        pinnedPostId: postId,
        notificationText: state.notificationText,
      });

      const nowIso = new Date().toISOString();
      const updatedState: MigrationHubState = {
        ...state,
        isActive: true,
        pinnedPostId: postId,
        statusStoryId: storyId,
        lastBoostedAt: Date.now(),
        lastLaunchedAt: nowIso,
        notificationsSentCount: (state.notificationsSentCount || 0) + sentCount,
      };

      await setDoc(doc(db, 'metadata', 'migration_hub'), updatedState, { merge: true });
      setState(updatedState);
      setPostExistsInDb(true);
      setStoryExistsInDb(true);

      toast.success(
        `🎉 Teeno Channels Live! Pinned Post + Status Story + ${sentCount} Users ko Notification bhej diya gaya!`,
        { id: toastId, duration: 6000 }
      );
    } catch (err: any) {
      console.error('Failed to launch migration channels:', err);
      toast.error('Error: ' + (err?.message || 'Could not launch migration bridge'), { id: toastId });
    } finally {
      setIsLaunchingAll(false);
    }
  };

  const handlePublishPostOnly = async () => {
    if (!adminUid) return;
    setIsUpdatingPost(true);
    const toastId = toast.loading('Pinned Migration Post update ho raha hai...');
    try {
      const postId = await publishMigrationPinnedPost({
        adminUid,
        targetUrl: state.targetUrl,
        postText: state.postText,
        existingPostId: state.pinnedPostId,
      });
      const updatedState = {
        ...state,
        isActive: true,
        pinnedPostId: postId,
        lastBoostedAt: Date.now(),
      };
      await setDoc(doc(db, 'metadata', 'migration_hub'), updatedState, { merge: true });
      setState(updatedState);
      setPostExistsInDb(true);
      toast.success('📌 Pinned Post purani website par #1 par live ho gaya! (Nayi website par hidden hai)', {
        id: toastId,
      });
    } catch (err: any) {
      toast.error('Failed: ' + (err?.message || 'Error'), { id: toastId });
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const handlePublishStoryOnly = async () => {
    if (!adminUid) return;
    setIsUpdatingStory(true);
    const toastId = toast.loading('Admin Status Story publish ho rahi hai...');
    try {
      const storyId = await publishMigrationStatusStory({
        adminUid,
        targetUrl: state.targetUrl,
        existingStatusId: state.statusStoryId,
      });
      const updatedState = {
        ...state,
        isActive: true,
        statusStoryId: storyId,
        lastBoostedAt: Date.now(),
      };
      await setDoc(doc(db, 'metadata', 'migration_hub'), updatedState, { merge: true });
      setState(updatedState);
      setStoryExistsInDb(true);
      toast.success('📸 Status Story purani website par live ho gayi! (Nayi website par hidden hai)', {
        id: toastId,
      });
    } catch (err: any) {
      toast.error('Failed: ' + (err?.message || 'Error'), { id: toastId });
    } finally {
      setIsUpdatingStory(false);
    }
  };

  const handleSendNotificationsOnly = async () => {
    if (!adminUid) return;
    setIsSendingNotifs(true);
    const toastId = toast.loading('Sabhi students ko Bell Notification bheja ja raha hai...');
    try {
      let postId = state.pinnedPostId;
      if (!postId || !postExistsInDb) {
        postId = await publishMigrationPinnedPost({
          adminUid,
          targetUrl: state.targetUrl,
          postText: state.postText,
          existingPostId: state.pinnedPostId,
        });
        setPostExistsInDb(true);
      }

      const sentCount = await broadcastMigrationNotifications({
        adminUid,
        adminAvatar,
        pinnedPostId: postId,
        notificationText: state.notificationText,
      });

      const updatedState = {
        ...state,
        isActive: true,
        pinnedPostId: postId,
        notificationsSentCount: (state.notificationsSentCount || 0) + sentCount,
      };
      await setDoc(doc(db, 'metadata', 'migration_hub'), updatedState, { merge: true });
      setState(updatedState);
      toast.success(`🔔 ${sentCount} students ke Notification Bell me nayi website ka alert bhej diya gaya!`, {
        id: toastId,
      });
    } catch (err: any) {
      toast.error('Failed: ' + (err?.message || 'Error'), { id: toastId });
    } finally {
      setIsSendingNotifs(false);
    }
  };

  const handleBoostNow = async () => {
    setIsBoosting(true);
    try {
      const ok = await boostMigrationToTop();
      if (ok) {
        setState((prev) => ({ ...prev, lastBoostedAt: Date.now() }));
        toast.success('⚡ Migration Post & Status ko wapas #1 Top par boost kar diya gaya!');
      } else {
        toast.error('Pehle Migration Bridge ko Launch karein.');
      }
    } finally {
      setIsBoosting(false);
    }
  };

  const handleDeactivateAll = async () => {
    if (!window.confirm('Kya aap purani website se Pinned Migration Post aur Status Story hatana chahte hain?')) {
      return;
    }
    setIsDeactivating(true);
    const toastId = toast.loading('Removing migration notices...');
    try {
      await deactivateMigrationBridge();
      setState((prev) => ({
        ...prev,
        isActive: false,
        pinnedPostId: null,
        statusStoryId: null,
      }));
      setPostExistsInDb(false);
      setStoryExistsInDb(false);
      toast.success('Migration notices hata diye gaye hain.', { id: toastId });
    } catch (err: any) {
      toast.error('Error: ' + (err?.message || 'Failed'), { id: toastId });
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 rounded-2xl p-6 text-white border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Rocket className="w-3.5 h-3.5 text-sky-400" />
              <span>Shared Database Bridge + Google SEO Canonical</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Purani Website (ai.studio) se Nayi Website (Netlify) Par Traffic Shift Karein
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Aapke paas purani website (<code className="text-amber-300 font-mono">jee-11-community.ai.studio</code>) ke code ka access nahi hai, lekin <strong>dono websites ka Firebase Database bilkul same hai!</strong> Yahan se 1-Click me purani website par <strong>Top Pinned Post (with clickable &quot;Open ↗&quot; button)</strong>, <strong>Admin Status Story</strong>, aur <strong>Bell Notification</strong> lagayein — jo <strong>nayi website par apne-aap chhupa rahega!</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={handleLaunchAllChannels}
              disabled={isLaunchingAll || loadingState}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {isLaunchingAll ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Rocket className="w-5 h-5" />
              )}
              <span>
                {postExistsInDb && storyExistsInDb
                  ? '🔄 Update & Re-Broadcast All 3 Channels'
                  : '🚀 1-Click Launch All 3 Channels'}
              </span>
            </button>

            {state.isActive && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBoostNow}
                  disabled={isBoosting}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg border border-white/15 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Refresh timestamp so it stays in top 20 on old site"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBoosting ? 'animate-spin' : ''}`} />
                  <span>Boost to #1</span>
                </button>
                <button
                  onClick={handleDeactivateAll}
                  disabled={isDeactivating}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold rounded-lg border border-red-400/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Deactivate & Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Turn Off</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Status Strip */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">1. Top Pinned Post</div>
              <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                {postExistsInDb ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Live on Old Site
                  </span>
                ) : (
                  <span className="text-amber-300">Not Published Yet</span>
                )}
              </div>
            </div>
            <Pin className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">2. Admin Status Story</div>
              <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                {storyExistsInDb ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Live on Old Site
                  </span>
                ) : (
                  <span className="text-amber-300">Not Published Yet</span>
                )}
              </div>
            </div>
            <ImageIcon className="w-5 h-5 text-sky-400" />
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">3. Bell Notifications</div>
              <div className="text-sm font-bold mt-0.5 text-white">
                {state.notificationsSentCount || 0} Sent{' '}
                {totalUsersCount > 0 && (
                  <span className="text-xs text-slate-400 font-normal">({totalUsersCount} users)</span>
                )}
              </div>
            </div>
            <Bell className="w-5 h-5 text-amber-400" />
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-semibold uppercase">4. New Site Filter</div>
              <div className="text-sm font-bold mt-0.5 text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Auto-Hidden Here
              </div>
            </div>
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Individual Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Channel 1: Pinned Post */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Pin className="w-4 h-4" /> Channel 1: Top Pinned Post
              </span>
              {postExistsInDb && (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
              Pinned Post + Direct &quot;Open ↗&quot; Button
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Purani website ke sabse upar <strong>Pinned Messages</strong> me ek HD Banner aur सीधा clickable <strong>&quot;Open ↗&quot;</strong> button lagata hai jisse student 1 tap me nayi website khol sakta hai.
            </p>
          </div>
          <button
            onClick={handlePublishPostOnly}
            disabled={isUpdatingPost}
            className="mt-4 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isUpdatingPost ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pin className="w-4 h-4" />}
            <span>{postExistsInDb ? 'Update Pinned Post' : 'Publish Pinned Post'}</span>
          </button>
        </div>

        {/* Channel 2: Admin Status Story */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" /> Channel 2: Admin Status
              </span>
              {storyExistsInDb && (
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
              Full-Screen Admin Story Poster
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Purani website ke top <strong>Admin Status</strong> circle me ek glowing ring aur full-screen poster lagata hai jisme <code className="font-mono">jee-community.netlify.app</code> aur saare naye features dikhte hain.
            </p>
          </div>
          <button
            onClick={handlePublishStoryOnly}
            disabled={isUpdatingStory}
            className="mt-4 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isUpdatingStory ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            <span>{storyExistsInDb ? 'Refresh Status Story' : 'Publish Status Story'}</span>
          </button>
        </div>

        {/* Channel 3: In-App Notification */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> Channel 3: Bell Alert
              </span>
              {(state.notificationsSentCount || 0) > 0 && (
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded">
                  {state.notificationsSentCount} Sent
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1.5">
              Red-Dot Bell Notification to All Users
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Purani website kholne wale har student ke <strong>Notification Bell (🔔)</strong> me red dot alert bhejta hai. Uspe click karte hi user seedha Pinned Migration Post par scroll ho jata hai!
            </p>
          </div>
          <button
            onClick={handleSendNotificationsOnly}
            disabled={isSendingNotifs}
            className="mt-4 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSendingNotifs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            <span>Send Bell Notification to All Users</span>
          </button>
        </div>
      </div>

      {/* Customization & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customize Text & Link */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Customize Migration Link & Message
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Purani website par dikhne wala link aur message yahan se edit karein
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  targetUrl: NEW_WEBSITE_COMMUNITY_URL,
                  postText: DEFAULT_MIGRATION_POST_TEXT,
                  notificationText: DEFAULT_MIGRATION_NOTIFICATION_TEXT,
                }))
              }
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Reset Default
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              New Website Target Link (Jahan students ko bhejna hai)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={state.targetUrl}
                onChange={(e) => setState((prev) => ({ ...prev, targetUrl: e.target.value }))}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <a
                href={state.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <span>Test</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pinned Post Announcement Message
            </label>
            <textarea
              rows={9}
              value={state.postText}
              onChange={(e) => setState((prev) => ({ ...prev, postText: e.target.value }))}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Bell Notification Short Message
            </label>
            <input
              type="text"
              value={state.notificationText}
              onChange={(e) => setState((prev) => ({ ...prev, notificationText: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <div>
              <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                ⚡ Auto-Keep at #1 on Old Website
              </div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400">
                Naye doubts aane par bhi Pinned Post hamesha top 20 query me #1 par bana rahega
              </div>
            </div>
            <input
              type="checkbox"
              checked={state.autoKeepAtTop}
              onChange={async (e) => {
                const nextVal = e.target.checked;
                setState((prev) => ({ ...prev, autoKeepAtTop: nextVal }));
                await setDoc(doc(db, 'metadata', 'migration_hub'), { autoKeepAtTop: nextVal }, { merge: true });
              }}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Live Preview of Old Website View & Google SEO */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Purani Website Par Kaisa Dikhega? (Live Preview)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Old site (<code className="font-mono">jee-11-community.ai.studio</code>) ke users ko ye dikhega:
              </p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold">
              <button
                onClick={() => setActivePreviewTab('post')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreviewTab === 'post'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📌 Pinned Post
              </button>
              <button
                onClick={() => setActivePreviewTab('story')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreviewTab === 'story'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📸 Status Story
              </button>
              <button
                onClick={() => setActivePreviewTab('seo')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  activePreviewTab === 'seo'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                🔍 Google SEO
              </button>
            </div>
          </div>

          {activePreviewTab === 'post' && (
            <div className="border-2 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-slate-800/50 rounded-xl p-4 relative space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm border-2 border-blue-400">
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Admin</span>
                      <span className="text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-1.5 py-0.5 rounded uppercase">
                        Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">just now • Visible on Old Website</div>
                  </div>
                </div>
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 mr-1" /> Important
                </span>
              </div>

              <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700">
                {state.postText}
              </p>

              {postBannerPreview && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={postBannerPreview}
                    alt="Migration Post Banner Preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Exact replica of how the old website renders post.pdfUrl as a clickable Open button */}
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-3 border border-indigo-200 dark:border-slate-700 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-indigo-100 dark:bg-indigo-950 p-2 rounded-lg text-indigo-600 shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      1-Tap Redirect Button on Old Website
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{state.targetUrl}</p>
                  </div>
                </div>
                <a
                  href={state.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/80 px-3.5 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0"
                >
                  Open <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>
          )}

          {activePreviewTab === 'story' && (
            <div className="flex flex-col items-center justify-center bg-slate-950 rounded-xl p-4 border border-slate-800">
              {storyBannerPreview ? (
                <img
                  src={storyBannerPreview}
                  alt="Admin Status Story Preview"
                  className="max-h-[420px] w-auto rounded-xl border border-white/15 shadow-2xl"
                />
              ) : (
                <div className="py-12 text-slate-400 text-sm">Generating preview...</div>
              )}
              <p className="text-xs text-slate-400 mt-3 text-center">
                Purani website par upar <strong>Admin Status</strong> par click karte hi ye full-screen poster dikhega.
              </p>
            </div>
          )}

          {activePreviewTab === 'seo' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-sm">
                  <Search className="w-4 h-4" />
                  <span>Google Search Canonical & Sitemap Active!</span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                  Har page (<code className="font-mono">/</code>, <code className="font-mono">/community</code>, <code className="font-mono">/notes</code>, <code className="font-mono">/study-room</code>, <code className="font-mono">/calculator</code>, <code className="font-mono">/campus</code>) par dynamic <code className="font-mono">&lt;link rel=&quot;canonical&quot; href=&quot;https://jee-community.netlify.app/...&quot;&gt;</code> aur Schema.org JSON-LD lag chuka hai.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  💡 Google Search me Nayi Website ko #1 par jaldi kaise layein?
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>
                    Sabse pehle upar <strong>&quot;🚀 1-Click Launch All 3 Channels&quot;</strong> button dabayein taaki purani site par aane wale sabhi students nayi link par click karein (jab user nayi link kholte hain to Google automatically nayi site ki ranking badha deta hai).
                  </li>
                  <li>
                    Agar aap Google Search Console use karte hain, to wahan apna Sitemap link डाल dein:
                  </li>
                </ol>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs">
                  <span className="truncate text-indigo-600 dark:text-indigo-400">
                    https://jee-community.netlify.app/sitemap.xml
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://jee-community.netlify.app/sitemap.xml');
                      toast.success('Sitemap URL copied!');
                    }}
                    className="ml-2 text-slate-500 hover:text-slate-800 flex items-center gap-1 font-sans font-bold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="truncate">
                  <span className="text-slate-500">Purani Website Link: </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{OLD_WEBSITE_URL}</span>
                </div>
                <a
                  href={OLD_WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline font-bold flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Check Old Site</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
