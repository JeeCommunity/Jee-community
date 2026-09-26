import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {  LogOut, Search, User as UserIcon, ArrowLeft, UserCircle, ShieldAlert, Home , Headphones , Sun, Moon, Star, Zap, Calculator, Library } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth, db } from '../firebase';
import { doc, collection, query, where, getDoc, getCountFromServer, getDocs, onSnapshot, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useState, useRef, useEffect  , useMemo } from 'react';
import { Trophy, MonitorPlay, StickyNote, FileText, Building2, MessageSquareQuote, Share2, Download, ExternalLink, BookOpen } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import FeedbackModal from './FeedbackModal';
import WhatsNewModal from './WhatsNewModal';
import ShareAppModal from './ShareAppModal';
import AITutorChat from './AITutorChat';
import NotificationsDropdown from './NotificationsDropdown';
import NotificationPromptModal from './NotificationPromptModal';
import NotesHubAnnouncementModal from './NotesHubAnnouncementModal';
import MyNotesAnnouncementModal from './MyNotesAnnouncementModal';
import { getFirstName, getLocalDate } from '../lib/utils';
import { getCampusProgress, getDailyCoins, getDailyXP } from '../lib/campusEconomy';
import { useTheme } from '../ThemeContext';

export default function Layout() {

  const { theme, toggleTheme } = useTheme();
  const { user, profile } = useAuth();
  const currentCommunity = 'JEE';
  const currentCommunityShort = 'JC';
  const navigate = useNavigate();
  const location = useLocation();
  const isCampus = location.pathname === '/campus';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCalcTooltip, setShowCalcTooltip] = useState(false);
  const [showCalcBadge, setShowCalcBadge] = useState(false);
  const [showNotesBadge, setShowNotesBadge] = useState(false);

  useEffect(() => {
    const clickedMenu = localStorage.getItem('hasClickedMenuForCalc');
    const clickedCalc = localStorage.getItem('hasClickedCalcLink');
    if (!clickedMenu && !clickedCalc) setShowCalcTooltip(true);
    if (!clickedCalc) setShowCalcBadge(true);
    
    const clickedNotes = localStorage.getItem('hasClickedNotesLink');
    if (!clickedNotes) setShowNotesBadge(true);
  }, []);

  useEffect(() => {
    const handleClick = () => {
      if (showCalcTooltip) {
        setShowCalcTooltip(false);
        localStorage.setItem('hasClickedMenuForCalc', 'true');
      }
    };
    if (showCalcTooltip) {
      setTimeout(() => window.addEventListener('click', handleClick), 100);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [showCalcTooltip]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { isInstallable, installPWA } = usePWA();
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mySession, setMySession] = useState<any>(null);
  const [campusStats, setCampusStats] = useState({ totalXP: 0, totalCoins: 0 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "study_sessions", user.uid));
        if (docSnap.exists()) {
          setMySession(docSnap.data());
        } else {
          setMySession(null);
        }
        
        const statsSnap = await getDoc(doc(db, "users", user.uid));
        if (statsSnap.exists()) {
          const data = statsSnap.data();
          if (data.campus) {
            setCampusStats({
              totalXP: data.campus.totalXP || 0,
              totalCoins: data.campus.totalCoins || 0
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserData();
  }, [user]);

  const getSessionTime = (s: any) => {
    if (!s) return 0;
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const midnight = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        total += Math.floor((Date.now() - Math.max(s.startTime, midnight)) / 1000);
      }
    } else {
      if (s.isStudying && s.startTime) {
        total += Math.floor((Date.now() - s.startTime) / 1000);
      }
    }
    return total;
  };

  const liveCoins = useMemo(() => {
    if (!mySession) return campusStats.totalCoins;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
      oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveCoins = getDailyCoins(currentDailyTime / 60) - getDailyCoins(oldDailyTime / 60);
    return campusStats.totalCoins + max(0, addedLiveCoins);
  }, [mySession, campusStats.totalCoins, now]);

  const liveXP = useMemo(() => {
    if (!mySession) return campusStats.totalXP;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
      oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveXP = getDailyXP(currentDailyTime / 60) - getDailyXP(oldDailyTime / 60);
    return campusStats.totalXP + max(0, addedLiveXP);
  }, [mySession, campusStats.totalXP, now]);

  const { currentLevel } = getCampusProgress(liveXP, liveCoins);

  function max(a: number, b: number) { return Math.max(a, b); }

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'study_sessions'), 
      where('isStudying', '==', true),
      limit(100)
    );
    const fetchActiveCount = async () => {
      try {
        const snap = await getDocs(q);
        let count = 0;
        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.isStudying) {
            let isReallyActive = true;
            if (data.startTime) {
              const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
              if (elapsedSeconds >= 3 * 3600) {
                isReallyActive = false;
              }
            }
            if (isReallyActive) {
              const c = data.communityType || "JEE";
              if (c === currentCommunity || c === "Both") {
                count++;
              }
            }
          }
        });
        setActiveStudentsCount(count);
      } catch (error) {
        console.error("Error fetching active sessions:", error);
      }
    };
    
    fetchActiveCount();
    
    // Optionally refresh every 5 minutes instead of live to save reads
    const timer = setInterval(fetchActiveCount, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [user, currentCommunity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut(auth);
    navigate('/');
  };

  const showBackButton = location.pathname !== '/' && location.pathname !== '/community' && location.pathname !== '/study-room' && location.pathname !== '/campus';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white flex flex-col font-sans">
      
      {user ? (
        <header className={`h-16 flex md:hidden items-center justify-between px-4 shrink-0 z-50 sticky top-0 ${isCampus ? "bg-[#070B14] border-b border-white/5" : "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"}`}>
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <button onClick={() => navigate(-1)} className={`p-1 -ml-1 transition-colors rounded-full ${isCampus ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800"}`} title="Go back">
                <ArrowLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="relative">
                <button className={`p-1 ${isCampus ? "text-slate-300" : ""}`} onClick={() => {
                  setIsMobileMenuOpen(true);
                  if (showCalcTooltip) {
                    setShowCalcTooltip(false);
                    localStorage.setItem('hasClickedMenuForCalc', 'true');
                  }
                }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
                {showCalcTooltip && (
                  <div className="absolute top-10 left-0 w-max max-w-[200px] bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg animate-bounce z-[60]">
                    <div className="absolute -top-1.5 left-3 w-3 h-3 bg-blue-600 transform rotate-45"></div>
                    🚀 New JEE Calculator Added Here!
                  </div>
                )}
              </div>
            )}
            <Link to="/community" className="flex flex-col">
              <h1 className={`text-[15px] font-bold leading-tight ${isCampus ? "text-white" : "text-slate-900 dark:text-white"}`}>{currentCommunity} Community</h1>
              <span className={`text-[11px] ${isCampus ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>Doubt & Study Groups</span>
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <NotificationsDropdown />
            
                <Link to="/study-room" className="relative p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 mr-2">
              <MonitorPlay className="w-5 h-5" />
              {activeStudentsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 text-[8px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm leading-none z-10">
                  <span className="w-1 h-1 bg-white dark:bg-slate-900 rounded-full mr-0.5 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}
            </Link>
            <Link to="/campus" className={`flex items-center gap-1.5 px-2 py-1 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'} rounded-full cursor-pointer`}>
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 ${isCampus ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                <span className="text-[11px] font-bold">{Math.floor(liveCoins).toLocaleString()}</span>
              </div>
              <div className={`w-px h-3 ${isCampus ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
              <div className="flex items-center gap-1">
                <Zap className={`w-3 h-3 ${isCampus ? 'text-blue-400' : 'text-blue-500'} fill-current`} />
                <span className="text-[10px] font-bold">Lvl {currentLevel}</span>
              </div>
            </Link>
          </div>
        </header>
      ) : null}
      <header className={`h-16 items-center justify-between px-6 shrink-0 z-50 sticky top-0 ${user ? 'hidden md:flex' : 'flex'} ${isCampus ? "bg-[#070B14] border-b border-white/5" : "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm"}`}>

        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800" title="Go back">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Link to={user ? "/community" : "/"} className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200/50 group-hover:shadow-blue-300 transition-all">
                <span className="font-black text-lg tracking-tighter">{currentCommunityShort}</span>
              </div>
              <span className={`font-black text-xl tracking-tight ${isCampus ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                {currentCommunity} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Community</span>
              </span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center space-x-6">
              
              <Link 
                to="/calculator"
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="JEE Calculator"
              >
                <Calculator className="w-5 h-5" />
                <span className="hidden lg:inline">Calculator</span>
              </Link>
              <Link 
                to="/notes"
                onClick={() => {
                  if (showNotesBadge) {
                    setShowNotesBadge(false);
                    localStorage.setItem('hasClickedNotesLink', 'true');
                  }
                }}
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="Notes Hub"
              >
                <Library className="w-5 h-5" />
                <span className="hidden lg:inline">Notes Hub</span>
                {showNotesBadge && (
                  <span className="absolute 1 top-0.5 right-0 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                )}
              </Link>
              
              <Link 
                to="/study-room"
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="Live Study Room"
              >
                <div className="relative">
                  <MonitorPlay className="w-5 h-5" />
                  {activeStudentsCount > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                      <span className="w-1 h-1 bg-white dark:bg-slate-900 rounded-full mr-0.5 animate-pulse"></span>
                      {activeStudentsCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline">Live Room</span>
              </Link>
              <Link to="/campus" className={`flex items-center gap-3 px-4 py-1.5 ${isCampus ? 'bg-[#0A101D]/80 border border-white/5 text-white' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'} rounded-full hover:opacity-80 transition-opacity cursor-pointer mx-2`}>
                <div className="flex items-center gap-1.5">
                  <Star className={`w-4 h-4 ${isCampus ? 'text-yellow-400' : 'text-yellow-500'} fill-current`} />
                  <span className="text-sm font-bold">{Math.floor(liveCoins).toLocaleString()}</span>
                </div>
                <div className={`w-px h-4 ${isCampus ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                <div className="flex items-center gap-1.5">
                  <Zap className={`w-4 h-4 ${isCampus ? 'text-blue-400' : 'text-blue-500'} fill-current`} />
                  <span className="text-sm font-bold">Lvl {currentLevel}</span>
                </div>
              </Link>
              
              
              <div className="flex items-center justify-center shrink-0">
                <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center relative shrink-0">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-center shrink-0">
                <NotificationsDropdown />
              </div>
              <div className="relative border-l border-slate-200 dark:border-slate-700 pl-6" ref={dropdownRef}>
                <button 
                  className="flex items-center space-x-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-medium text-xs">
                      {getFirstName(profile?.fullName)?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <span className="text-sm font-semibold hidden sm:block">{getFirstName(profile?.fullName) || 'User'}</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-1 border border-slate-200 dark:border-slate-700 transition-all">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{getFirstName(profile?.fullName) || 'User'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{profile?.username || 'setup_profile'}</p>
                    </div>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); navigate('/setup-profile'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <UserCircle className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                    {user?.email === 'aistoryimage1999@gmail.com' && (
                      <button 
                        onClick={() => { setIsDropdownOpen(false); navigate('/admin'); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Admin Panel
                      </button>
                    )}
                    <button 
                      onClick={() => { setIsDropdownOpen(false); setIsFeedbackModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <MessageSquareQuote className="w-4 h-4 mr-2" />
                      Send Feedback
                    </button>
                    <button 
                      onClick={() => { setIsDropdownOpen(false); setIsShareModalOpen(true); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share App
                    </button>
                    <button 
                      onClick={async () => { 
                        setIsDropdownOpen(false); 
                        const outcome = await installPWA(); 
                        if (outcome === 'accepted') {
                          window.alert("Installation started! The app 'JEE Community' will be added to your home screen or app drawer shortly.");
                        } else {
                          window.alert("To install the app, tap your browser's menu (⋮) and choose 'Install app' or 'Add to Home Screen'.");
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center font-medium"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Latest Version
                    </button>
                    <a 
                      href="https://jee-community.netlify.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Use Latest Version App
                    </a>
                    <Link to="/error-notes" className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-slate-800 flex items-center font-medium" onClick={() => setIsDropdownOpen(false)}>
                      <BookOpen className="w-4 h-4 mr-2 text-red-500" />
                      📕 Error Notes
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {!user && (
            <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
              <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors"
                aria-label="Menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-12 right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-1 border border-slate-200 dark:border-slate-700 transition-all z-50">
                  <button 
                    onClick={async () => { 
                      setIsDropdownOpen(false); 
                      const outcome = await installPWA(); 
                      if (outcome === 'accepted') {
                        window.alert("Installation started! The app 'JEE Community' will be added to your home screen or app drawer shortly.");
                      } else {
                        window.alert("To install the app, tap your browser's menu (⋮) and choose 'Install app' or 'Add to Home Screen'.");
                      }
                    }} 
                    className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Latest Version
                  </button>
                  <a 
                    href="https://jee-community.netlify.app" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => setIsDropdownOpen(false)} 
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Use Latest Version App
                  </a>
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>
                  <Link to="/about" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">About Us</Link>
                  <Link to="/privacy" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">Privacy Policy</Link>
                  <Link to="/terms" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">Terms of Service</Link>
                  <Link to="/disclaimer" onClick={() => setIsDropdownOpen(false)} className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">Disclaimer</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={`flex-1 max-w-4xl w-full mx-auto flex flex-col ${location.pathname === '/community' ? '' : 'p-4 md:p-6'}`}>
        <Outlet />
        {user && (
          <footer className="mt-auto pt-8 pb-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-center space-x-6 mb-2">
              <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link>
              <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
              <Link to="/disclaimer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Disclaimer</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} JEE Community. All rights reserved.</p>
          </footer>
        )}
      </main>

      <WhatsNewModal />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
      <ShareAppModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
      <AITutorChat />
      <NotificationPromptModal />
      <NotesHubAnnouncementModal />
      <MyNotesAnnouncementModal />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-left">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200/50">
                  <span className="font-black text-lg tracking-tighter">{currentCommunityShort}</span>
                </div>
                <span className={`font-black text-xl tracking-tight ${isCampus ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>{currentCommunity} Community</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
              {profile && (
                <div className="px-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={profile.fullName} className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {getFirstName(profile.fullName)?.[0]?.toUpperCase() || <UserIcon className="w-6 h-6" />}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white">{profile.fullName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">@{profile.username}</span>
                  </div>
                </div>
              )}
              
              <div className="px-3 space-y-1">
                <div className="flex flex-col">
                  <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                    <Search className="w-5 h-5" />
                    <span>Community Feed</span>
                  </Link>
                  <div className="pl-11 pr-3 flex flex-wrap gap-2 pb-2">
                    {['All', 'Physics', 'Chemistry', 'Maths', 'Doubts', 'Notes', 'General'].map(tag => (
                      <Link 
                        key={tag} 
                        to={`/community?tag=${tag}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-600 dark:text-slate-400 hover:text-blue-700 rounded-md text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
                <Link to="/campus" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <Building2 className="w-5 h-5" />
                  <span>My Campus</span>
                </Link>
                <Link to="/calculator" onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (showCalcBadge) {
                    setShowCalcBadge(false);
                    localStorage.setItem('hasClickedCalcLink', 'true');
                  }
                }} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <Calculator className="w-5 h-5" />
                  <div className="flex items-center gap-2">
                    <span>JEE Calculator</span>
                    {showCalcBadge && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shadow-sm">New</span>}
                  </div>
                </Link>
                <Link to="/notes" onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (showNotesBadge) {
                    setShowNotesBadge(false);
                    localStorage.setItem('hasClickedNotesLink', 'true');
                  }
                }} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <Library className="w-5 h-5" />
                  <div className="flex items-center gap-2">
                    <span>Notes Hub</span>
                    {showNotesBadge && <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shadow-sm">New</span>}
                  </div>
                </Link>
                <Link to="/error-notes" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-700 rounded-lg font-medium transition-colors">
                  <BookOpen className="w-5 h-5 text-red-500" />
                  <span>📕 Error Notes</span>
                </Link>
                <Link to="/study-room" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg font-medium transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <MonitorPlay className="w-5 h-5" />
                      {activeStudentsCount > 0 && (
                        <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                          <span className="w-1 h-1 bg-white dark:bg-slate-900 rounded-full mr-0.5 animate-pulse"></span>
                          {activeStudentsCount}
                        </span>
                      )}
                    </div>
                    <span>Live Study Room</span>
                  </div>
                </Link>
              </div>
              
              <div className="mt-6 px-3 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-4">
                <Link to="/setup-profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg font-medium transition-colors">
                  <UserCircle className="w-5 h-5" />
                  <span>Edit Profile</span>
                </Link>
                <button onClick={() => { setIsMobileMenuOpen(false); setIsFeedbackModalOpen(true); }} className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg font-medium transition-colors text-left">
                  <MessageSquareQuote className="w-5 h-5" />
                  <span>Send Feedback</span>
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); setIsShareModalOpen(true); }} className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg font-medium transition-colors text-left">
                  <Share2 className="w-5 h-5" />
                  <span>Share App</span>
                </button>
                <button onClick={async () => { 
                  setIsMobileMenuOpen(false); 
                  const outcome = await installPWA(); 
                  if (outcome === 'accepted') {
                    window.alert("Installation started! The app 'JEE Community' will be added to your home screen or app drawer shortly."); 
                  } else {
                    window.alert("To install the app, tap your browser menu (⋮) and choose 'Install app' or 'Add to Home Screen'.");
                  }
                }} className="w-full flex items-center space-x-3 px-3 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors text-left">
                  <Download className="w-5 h-5" />
                  <span>Download Latest Version</span>
                </button>
                <a href="https://jee-community.netlify.app" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center space-x-3 px-3 py-3 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg font-medium transition-colors text-left">
                  <ExternalLink className="w-5 h-5" />
                  <span>Use Latest Version App</span>
                </a>
                {user?.email === 'aistoryimage1999@gmail.com' && (
                  <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                    <ShieldAlert className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button onClick={() => { setIsMobileMenuOpen(false); toggleTheme(); }} className="w-full flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg font-medium transition-colors text-left">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
