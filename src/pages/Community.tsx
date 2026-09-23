import NotificationPromptModal from '../components/NotificationPromptModal';
import React from "react";
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { Plus, Search, RefreshCw, Pin, ChevronUp } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import PostCard from '../components/PostCard';
import AdminStatusRow from '../components/AdminStatusRow';
import CreatePostModal from '../components/CreatePostModal';
import InstallAppButton from '../components/InstallAppButton';
import { cn } from '../lib/utils';

const TAGS = ['All', 'Physics', 'Chemistry', 'Maths', 'Doubts', 'Notes', 'General'];

export default function Community() {
  const { user, profile, loading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTag = searchParams.get('tag') || 'All';
  const setSelectedTag = (tag) => {
    setSearchParams({ tag });
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecentButton, setShowRecentButton] = useState(false);

  const fetchPosts = async () => {
    if (!user) return;
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPosts(postsData);
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowRecentButton(true);
      } else {
        setShowRecentButton(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRecentPostsClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Also scroll the html/body just in case
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return <Navigate to="/setup-profile" />;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPosts();
    setIsRefreshing(false);
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'mine' && p.authorId !== user.uid) return false;
    if (selectedTag !== 'All' && p.tag !== selectedTag) return false;
    if (searchQuery && !p.text?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Community segregation
    const postCommunity = p.communityType || 'JEE';
    if (postCommunity !== 'JEE' && postCommunity !== 'Both') return false;

    return true;
  }).sort((a, b) => {
    const aPinned = a.isPinned ? 1 : 0;
    const bPinned = b.isPinned ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    // Fallback to createdAt if needed, though they should already be sorted from Firestore
    return 0;
  });

  return (
    
    <div className="pb-24 flex-1 flex flex-col w-full bg-slate-100 dark:bg-slate-800 min-h-screen">
      <NotificationPromptModal />

      {/* Recent Posts Floating Button */}
      {showRecentButton && (
        <div className="fixed top-[80px] left-0 right-0 flex justify-center z-40 pointer-events-none">
          <button
            onClick={handleRecentPostsClick}
            disabled={isRefreshing}
            className="pointer-events-auto bg-[#3D404A] text-white px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] flex items-center space-x-1.5 hover:bg-[#4b4e5a] transition-all transform hover:scale-105 active:scale-95 text-[13px] font-medium"
          >
            {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronUp className="w-4 h-4" />}
            <span>Recent Posts</span>
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Tabs */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 justify-between flex-wrap">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn(
                "py-3 text-[15px] font-medium transition-all relative", 
                activeTab === 'all' 
                  ? "text-blue-700" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300"
              )}
            >
              All Posts
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-md"></div>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('mine')}
              className={cn(
                "py-3 text-[15px] font-medium transition-all relative", 
                activeTab === 'mine' 
                  ? "text-blue-700" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300"
              )}
            >
              My Posts
              {activeTab === 'mine' && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-indigo-600 rounded-t-md"></div>
              )}
            </button>
            <InstallAppButton />
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5E51D9] hover:bg-[#4e42c2] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 my-2"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>+ Ask Doubt</span>
            </button>
          </div>

        </div>
        
        {/* Admin Status Row */}
        <AdminStatusRow />

        {/* Feed */}
        <div className="w-full">
          {error && (
            <div className="mx-4 mb-4 p-4 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 text-sm text-center">
              {error}
            </div>
          )}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              No posts found.
            </div>
          ) : (
            <>
              {/* Pinned Posts Section */}
              {filteredPosts.filter(p => p.isPinned).length > 0 && (
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent -mx-4 -mt-4 rounded-3xl -z-10 blur-xl pointer-events-none" />
                  <div className="flex items-center mb-3 px-4">
                    <Pin className="w-4 h-4 text-indigo-600 mr-2 fill-indigo-100" />
                    <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Pinned Messages</h3>
                  </div>
                  <div className="space-y-4">
                    {filteredPosts.filter(p => p.isPinned).map(post => (
                      <div key={post.id} className="transform transition-all">
                        <PostCard post={post} initialShowComments={post.id === searchParams.get('postId')} />
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6" />
                </div>
              )}
              
              {/* Normal Posts Section */}
              <div className="space-y-2">
                {filteredPosts.filter(p => !p.isPinned).map((post, index) => (
                  <React.Fragment key={post.id}>
                    <div>
                      <PostCard post={post} initialShowComments={post.id === searchParams.get('postId')} />
                    </div>
                    {index === 9 && (
                      <div className="my-4 overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2">
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </>
          )}
        </div>

        {!profile?.isBlocked && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 bg-[#5E51D9] hover:bg-[#4d40c6] text-white rounded-full shadow-2xl flex items-center justify-center gap-2 px-5 py-3.5 hover:scale-105 active:scale-95 transition-all z-40 font-bold text-sm border-2 border-white/20"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            <span>Post Doubt</span>
          </button>
        )}

        {!profile?.isBlocked && (
          <CreatePostModal 
             isOpen={isModalOpen} 
             onClose={() => setIsModalOpen(false)} 
             onSuccess={(newPost) => {
               if (newPost) {
                 setPosts(prev => [newPost, ...prev]);
                 window.scrollTo({ top: 0, behavior: 'smooth' });
               } else {
                 fetchPosts();
               }
             }}
             currentCommunity="JEE"
          />
        )}
      </div>



    </div>
  );
}
