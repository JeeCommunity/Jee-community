import { sendGlobalNotification } from "../lib/notifications";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { getCampusProgress, getDailyCoins, getDailyXP, getCollegeLevelRequired } from "../lib/campusEconomy";
import { updateSessionWithEconomy } from "../lib/updateSession";
import { createNotification } from "../lib/notifications";
import { useAuth } from "../AuthContext";
import {
  Bell,
  PictureInPicture,
  Play,
  Pause,
  Square,
  Users,
  BookOpen,
  Clock,
  Target,
  Check,
  X,
  Plus,
  CheckCircle2,
  XCircle,
  Circle,
  Trash2,
  Edit2,
  PlayCircle,
  StopCircle,
  MoreVertical,
  Crown, Flame, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn, getFirstName, getLocalDate } from "../lib/utils";
import { resolveSessionState, getWeekMonday } from "../lib/sessionUtils";

import StudyGroups from "../components/StudyGroups";
import PrivateStudyGroups from "../components/PrivateStudyGroups";
import UserProfileModal from "../components/UserProfileModal";
import toast from "react-hot-toast";

interface Goal {
  id: string;
  text: string;
  status: "pending" | "completed" | "failed";
  createdAt?: number;
  accumulatedTime?: number;
}

interface Subject {
  id: string;
  name: string;
  accumulatedTime: number;
}



export default function LiveStudy() {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';
  const [sessions, setSessions] = useState<any[]>([]);
  const [mySession, setMySession] = useState<any>(null);
  const [campusStats, setCampusStats] = useState({ totalCoins: 0, totalXP: 0 });
  const [now, setNow] = useState(Date.now());
  const [goalInput, setGoalInput] = useState("");
  const [showGoalsMenu, setShowGoalsMenu] = useState(false);
  const [cheerCooldowns, setCheerCooldowns] = useState<Record<string, boolean>>({});

  const handleCheer = async (targetUserId: string, cheerType: 'cheer_fire' | 'cheer_clap') => {
    if (cheerCooldowns[targetUserId] || !user || !profile) return;
    
    // Set 60s cooldown
    setCheerCooldowns(prev => ({ ...prev, [targetUserId]: true }));
    setTimeout(() => {
      setCheerCooldowns(prev => ({ ...prev, [targetUserId]: false }));
    }, 60000);

    try {
      await createNotification({
        recipientId: targetUserId,
        senderId: user.uid,
        senderName: getFirstName(profile.fullName),
        senderAvatar: profile.photoURL || '',
        type: cheerType
      });
      toast.success(cheerType === 'cheer_fire' ? "Fire emoji sent! 🔥" : "Claps sent! 👏");
    } catch (e: any) {
      console.error(e?.message || 'Error');
      toast.error("Failed to send cheer");
    }
  };

  const [goals, setGoals] = useState<Goal[]>([]);
  const [usersData, setUsersData] = useState<Record<string, any>>({});
  const [notifyMessage, setNotifyMessage] = useState<string>("");
  const [pipWindow, setPipWindow] = useState<any>(null);
  const [isEditingSubjects, setIsEditingSubjects] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedUserForProfile, setSelectedUserForProfile] =
    useState<any>(null);
  const [selectedUserSession, setSelectedUserSession] = useState<any>(null);

  const [todayStr, setTodayStr] = useState(new Date().toDateString());
  const [showRulesModal, setShowRulesModal] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTodayStr(new Date().toDateString());
    }, 60000); // Check every minute for day change
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mySession && mySession.goals) {
      const todaysGoals = mySession.goals.filter((g: Goal) => {
        if (!g.createdAt) return false;
        return new Date(g.createdAt).toDateString() === todayStr;
      });
      setGoals(todaysGoals);
    }
  }, [mySession, todayStr]);
  const filteredSessions = sessions.filter((s) => {
    const c = s.communityType;
    if (c !== "JEE" && c !== "Both" && c) return false;
    return true;
  });

  useEffect(() => {
    if (!user) return;
    const fetchUserStats = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.campus) {
            setCampusStats({
              totalCoins: data.campus.totalCoins || 0,
              totalXP: data.campus.totalXP || 0
            });
          }
        }
      } catch (err) {}
    };
    
    fetchUserStats();
  }, [user]);

  const liveCoins = React.useMemo(() => {
    if (!mySession) return campusStats.totalCoins;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
       oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveCoins = getDailyCoins(currentDailyTime / 60) - getDailyCoins(oldDailyTime / 60);
    return campusStats.totalCoins + Math.max(0, addedLiveCoins);
  }, [mySession, campusStats.totalCoins, now]);




  const liveXP = React.useMemo(() => {
    if (!mySession) return campusStats.totalXP;
    const todayDate = getLocalDate();
    let oldDailyTime = 0;
    if (mySession.dailyDate === todayDate) {
       oldDailyTime = mySession.accumulatedTime || 0;
    }
    const currentDailyTime = getSessionTime(mySession);
    const addedLiveXP = getDailyXP(currentDailyTime / 60) - getDailyXP(oldDailyTime / 60);
    return campusStats.totalXP + Math.max(0, addedLiveXP);
  }, [mySession, campusStats.totalXP, now]);

  const { currentLevel, nextCollege, requiredCoinsForNext } = React.useMemo(() => getCampusProgress(liveXP, liveCoins), [liveXP, liveCoins]);

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"global" | "groups">("global");
  const [checkInCountdown, setCheckInCountdown] = useState(60);
  const lastCheckInTimeRef = React.useRef<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleConfirmStudy = () => {
    lastCheckInTimeRef.current = Date.now();
    setShowCheckIn(false);
    setCheckInCountdown(60);
  };

  useEffect(() => {
    let checkInTimer: any = null;
    if (mySession?.isStudying) {
      if (!lastCheckInTimeRef.current) {
        lastCheckInTimeRef.current = Date.now();
      }
      checkInTimer = setInterval(() => {
        const now = Date.now();
        
        // Check midnight reset
        const currentLocalDay = new Date().toDateString();
        if (mySession.dailyDate && new Date(now).toDateString() !== new Date(mySession.startTime || now).toDateString()) {
           handleStop();
           return;
        }

        // Auto-stop if slot reaches 3 hours (10800 seconds)
        const timeStudiedInSlot = Math.floor((now - (mySession.startTime || now)) / 1000);
        if (timeStudiedInSlot >= 3 * 3600) {
           handleStop();
           return;
        }

        if (!showCheckIn) {
          // Check if 2 hours have passed without check-in
          if (now - lastCheckInTimeRef.current >= 2 * 60 * 60 * 1000) {
            setShowCheckIn(true);
            setCheckInCountdown(60);
          }
        }
      }, 5000); // Check every 5 seconds
    } else {
      setShowCheckIn(false);
    }
    return () => {
      if (checkInTimer) clearInterval(checkInTimer);
    };
  }, [mySession?.isStudying, showCheckIn, mySession?.startTime, mySession?.dailyDate]);

  useEffect(() => {
    let countdownTimer: any = null;
    if (showCheckIn) {
      countdownTimer = setInterval(() => {
        setCheckInCountdown((prev) => {
          if (prev <= 1) {
            handleStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [showCheckIn]);

  useEffect(() => {
    if (!user) return;
    
    // Polling for the current user's session and all active sessions
    const todayDate = getLocalDate();
    const myRef = doc(db, "study_sessions", user.uid);
    const q = query(collection(db, "study_sessions"), where("dailyDate", "==", todayDate), limit(100));

    const unsubMy = onSnapshot(myRef, (myDocSnap) => {
        if (myDocSnap.exists()) {
          setMySession({ id: myDocSnap.id, ...myDocSnap.data() });
        } else {
          setMySession(null);
        }
    });

    const fetchAllSessions = async () => {
        try {
          const snap = await getDocs(q);
          const allSessions: any[] = [];
          const todayDate = getLocalDate();
          
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            
            // Retroactive cleanup of stale sessions (>3 hours)
            if (data.isStudying && data.startTime) {
              const elapsedSeconds = Math.floor((Date.now() - data.startTime) / 1000);
              if (elapsedSeconds >= 3 * 3600) {
                data.isStudying = false;
                data.accumulatedTime = Math.min(18 * 3600, (data.accumulatedTime || 0) + (3 * 3600));
                
                // Cleanup goals as well
                if (data.goals && data.activeGoalId) {
                  data.goals = data.goals.map((g: any) => {
                    if (g.id === data.activeGoalId) {
                      return { ...g, accumulatedTime: (g.accumulatedTime || 0) + (3 * 3600) };
                    }
                    return g;
                  });
                }
              }
            }
            
            const hasStudiedToday = data.dailyDate === todayDate && (data.accumulatedTime > 0 || data.isStudying);
            if (data.isStudying || hasStudiedToday) {
              allSessions.push({ id: docSnap.id, ...data });
            }
          });

          setSessions(
            allSessions.sort((a, b) => {
              const getSessionTimeLocal = (s: any) => {
                let total = s.accumulatedTime || 0;
                if (s.dailyDate !== todayDate) return 0;
                if (s.isStudying && s.startTime) {
                  let t = Math.floor((Date.now() - s.startTime) / 1000);
                  if (t > 3 * 3600) t = 3 * 3600;
                  total += t;
                }
                return total;
              };
              return getSessionTimeLocal(b) - getSessionTimeLocal(a);
            })
          );
        } catch (err) {
          console.error("Error fetching live sessions", err);
        }
    };
    
    fetchAllSessions();
    // Expose for refresh
    (window as any).refreshLiveStudySessions = fetchAllSessions;
    
    // Refresh leaderboard every 5 minutes to keep it somewhat updated without killing quota
    const refreshTimer = setInterval(fetchAllSessions, 5 * 60 * 1000);

    
    return () => {
      unsubMy();
      clearInterval(refreshTimer);
    };
  }, [user]);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const studySessionRef = React.useRef<any>(null);
  const handleStartRef = React.useRef<any>(null);
  const handleStopRef = React.useRef<any>(null);

  useEffect(() => {
    handleStartRef.current = handleStart;
    handleStopRef.current = handleStop;
  });
  const nowRef = React.useRef<number>(Date.now());

  useEffect(() => {
    studySessionRef.current = mySession;
  }, [mySession]);

  const pipTimerRef = React.useRef<any>(null);

  const updateCanvasTimer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let timeStr = "00:00:00";
    if (studySessionRef.current) {
      const session = studySessionRef.current;
      const todayDate = getLocalDate();
      let totalSeconds = session.accumulatedTime || 0;
      if (session.dailyDate !== todayDate) {
        totalSeconds = 0;
        if (session.isStudying && session.startTime) {
          const now = new Date();
          const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const startForToday = Math.max(session.startTime, midnight);
          totalSeconds += Math.floor((Date.now() - startForToday) / 1000);
        }
      } else {
        if (session.isStudying && session.startTime) {
          totalSeconds += Math.floor((Date.now() - session.startTime) / 1000);
        }
      }
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      timeStr = [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
    }

    // Draw main timer text (Large & Crisp)
    ctx.fillStyle = "#818cf8"; // Indigo color
    ctx.font = "bold 90px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(timeStr, canvas.width / 2, canvas.height / 2 + 20);

    // Draw top title
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("Live Study Room", canvas.width / 2, 50);

    // Draw dot indicator
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 130, 42, 8, 0, 2 * Math.PI);
    ctx.fillStyle = studySessionRef.current?.isStudying ? "#22c55e" : "#ef4444";
    ctx.fill();
  };

  useEffect(() => {
    nowRef.current = now;
  }, [now]);

  useEffect(() => {
    if (videoRef.current) {
      if (mySession?.isStudying) {
        videoRef.current
          .play()
          .catch((e) =>
            console.log("Video play error:", e?.message || "Error"),
          );
        if ("mediaSession" in navigator)
          navigator.mediaSession.playbackState = "playing";
      } else {
        // Update canvas one last time before pausing so it shows the red indicator
        updateCanvasTimer();
        setTimeout(() => {
          if (videoRef.current) videoRef.current.pause();
          if ("mediaSession" in navigator)
            navigator.mediaSession.playbackState = "paused";
        }, 50);
      }
    }
  }, [mySession?.isStudying]);

  const togglePip = async () => {
    if ("documentPictureInPicture" in window) {
      if (pipWindow) {
        pipWindow.close();
        return;
      }
      try {
        const dpip = (window as any).documentPictureInPicture;
        const pip = await dpip.requestWindow({ width: 220, height: 120 });

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules]
              .map((rule) => rule.cssText)
              .join("");
            const style = document.createElement("style");
            style.textContent = cssRules;
            pip.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = styleSheet.type;
            link.media = styleSheet.media.mediaText;
            link.href = styleSheet.href;
            pip.document.head.appendChild(link);
          }
        });

        pip.document.body.style.margin = "0";
        pip.document.body.style.backgroundColor = "#0f172a";
        pip.addEventListener("pagehide", () => setPipWindow(null));
        setPipWindow(pip);
        return;
      } catch (error) {
        console.error(
          "Doc PiP failed, trying Video Canvas",
          error?.message || "Error",
        );
      }
    }

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
      return;
    }

    try {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
        // High resolution canvas for crisp text in PIP
        canvasRef.current.width = 600;
        canvasRef.current.height = 240;
      }
      if (!videoRef.current) {
        videoRef.current = document.createElement("video");
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;

        const stream = (canvasRef.current as any).captureStream ? (canvasRef.current as any).captureStream(10) : null;
        if (!stream) {
           alert("Picture-in-Picture is not supported on this browser (missing captureStream).");
           return;
        }
        videoRef.current.srcObject = stream;

        videoRef.current.addEventListener("leavepictureinpicture", () => {
          if (pipTimerRef.current) {
            clearInterval(pipTimerRef.current);
            pipTimerRef.current = null;
          }
        });

        videoRef.current.addEventListener("pause", () => {
          if (handleStopRef.current) handleStopRef.current();
        });

        videoRef.current.addEventListener("play", () => {
          if (handleStartRef.current) handleStartRef.current();
        });

        if ("mediaSession" in navigator) {
          navigator.mediaSession.setActionHandler("play", () => {
            if (handleStartRef.current) handleStartRef.current();
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            if (handleStopRef.current) handleStopRef.current();
          });
        }
      }

      updateCanvasTimer();

      await videoRef.current.play();
      await videoRef.current.requestPictureInPicture();

      if (pipTimerRef.current) {
        clearInterval(pipTimerRef.current);
      }
      pipTimerRef.current = setInterval(() => {
        updateCanvasTimer();
      }, 1000);
    } catch (err) {
      console.error("Video PiP failed:", err?.message || "Error");
      alert(
        "Picture-in-Picture mode might not be supported on this device/browser.",
      );
    }
  };

  const spawnNotification = () => {
    setNotifyMessage("");
    if (!("Notification" in window) || !window.Notification) {
      setNotifyMessage(
        "Notifications API not supported on this browser/device.",
      );
      return;
    }

    try {
      Notification.requestPermission()
        .then(async (permission) => {
          if (permission === "granted") {
            try {
              new Notification("Live Study Room", {
                body: "Session is running in background!",
                tag: "study-timer",
              });
              setNotifyMessage("Notification sent! Check your tray.");
            } catch (e) {
              // Mobile Chrome often requires a service worker for notifications
              try {
                if ("serviceWorker" in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  if (regs.length > 0) {
                    regs[0].showNotification("Live Study Room", {
                      body: "Session is running in background!",
                      tag: "study-timer",
                    });
                    setNotifyMessage(
                      "Background Notification sent via Service Worker!",
                    );
                    return;
                  }
                }
              } catch (swErr) {}
              setNotifyMessage(
                'Mobile browsers usually require you to "Add to Home Screen" for background notifications.',
              );
            }
          } else {
            setNotifyMessage(
              'Permission Denied. In preview mode, open the app in a "New Tab" to allow notifications.',
            );
          }
        })
        .catch((err) => {
          setNotifyMessage(
            "Failed to request notification permission. Try opening in a new tab.",
          );
        });
    } catch (err) {
      setNotifyMessage(
        "Notifications blocked by the browser. Try opening in a new tab.",
      );
    }

    // Clear message after 6 seconds
    setTimeout(() => {
      setNotifyMessage("");
    }, 6000);
  };

  const handleStart = async (goalId?: string) => {
    if (!user || !profile) return;

    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();
    
    if (snap.exists()) {
      const data = snap.data();
      const { baseTime } = resolveSessionState(data, todayDate);
      if (baseTime >= 18 * 3600) {
        alert("You have reached the maximum study limit of 18 hours for today! Take a break and come back tomorrow.");
        return;
      }
    }

    lastCheckInTimeRef.current = Date.now();
    setShowCheckIn(false);
    setCheckInCountdown(60);

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        fullName: profile.fullName,
        username: profile.username,
        photoURL: profile.photoURL || null,
        role: profile.role || "user",
        goals: mySession?.goals || [],
        isStudying: true,
        activeGoalId: goalId || null,
        communityType: "JEE",
        startTime: Date.now(),
        accumulatedTime: 0,
        dailyDate: todayDate,
        weeklyData: {
            [todayDate]: { accumulatedTime: 0, goals: mySession?.goals || [] }
        },
        lastUpdated: serverTimestamp(),
      });
      return;
    }

    const data = snap.data();
    const { baseTime, currentGoals, weeklyData, addedCoins, addedXP } = resolveSessionState(data, todayDate);
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };

    await updateDoc(ref, {
      goals: currentGoals,
      isStudying: true,
      activeGoalId: goalId || null,
      communityType: "JEE",
      startTime: Date.now(),
      fullName: profile.fullName,
      username: profile.username,
      photoURL: profile.photoURL || null,
      role: profile?.role || "user",
      dailyDate: todayDate,
      accumulatedTime: baseTime,
      weeklyData,
      lastUpdated: serverTimestamp(),
    });
  };

  const handleStop = async (uidToStop?: string) => {
    setShowCheckIn(false);
    const targetUid = typeof uidToStop === "string" ? uidToStop : user?.uid;
    if (!targetUid) return;
    const ref = doc(db, "study_sessions", targetUid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    
    const data = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, addedCoins, addedXP } = resolveSessionState(data, todayDate);

    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: currentGoals };

    await updateSessionWithEconomy(ref, {
      isStudying: false,
      activeGoalId: null,
      accumulatedTime: baseTime,
      goals: currentGoals,
      dailyDate: todayDate,
      weeklyData,
      lastUpdated: serverTimestamp(),
    }, addedCoins, addedXP, targetUid);
  };

  const getGoalTime = (goal: Goal) => {
    let total = goal.accumulatedTime || 0;
    const todayDate = getLocalDate();
    if (mySession?.dailyDate !== todayDate) {
      return 0;
    }
    if (
      mySession?.isStudying &&
      mySession?.activeGoalId === goal.id &&
      mySession?.startTime
    ) {
      total += Math.floor((Date.now() - mySession.startTime) / 1000);
    }
    return total;
  };

  const clearGoals = async () => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying, addedCoins, addedXP } = resolveSessionState(sData, todayDate);
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: [] };

    await updateSessionWithEconomy(ref, {
      goals: [],
      activeGoalId: null,
      accumulatedTime: baseTime,
      dailyDate: todayDate,
      weeklyData,
      startTime: newStartTime,
      lastUpdated: serverTimestamp(),
    }, addedCoins, addedXP, user.uid);
  };

  const addGoal = async () => {
    if (!goalInput.trim() || !user) return;
    const newGoal: Goal = {
      id: Date.now().toString(),
      text: goalInput.trim(),
      status: "pending",
      createdAt: Date.now(),
    };
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    const todayDate = getLocalDate();

    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        fullName: profile?.fullName || "User",
        username: profile?.username || "user",
        photoURL: profile?.photoURL || null,
        role: profile?.role || "user",
        goals: [newGoal],
        isStudying: false,
        activeGoalId: null,
        communityType: "JEE",
        startTime: null,
        accumulatedTime: 0,
        dailyDate: todayDate,
        weeklyData: {
            [todayDate]: { accumulatedTime: 0, goals: [newGoal] }
        },
        lastUpdated: serverTimestamp(),
      });
    } else {
      const sData = snap.data();
      const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying, addedCoins, addedXP } = resolveSessionState(sData, todayDate);
      const updatedGoals = [...currentGoals, newGoal];
      
      weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
      
      await updateSessionWithEconomy(ref, { 
          goals: updatedGoals,
          accumulatedTime: baseTime,
          dailyDate: todayDate,
          weeklyData,
          startTime: newStartTime,
          lastUpdated: serverTimestamp()
      }, addedCoins, addedXP, user.uid);
    }
    setGoalInput("");
  };

  const updateGoalStatus = async (
    goalId: string,
    status: "pending" | "completed" | "failed",
  ) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying, addedCoins, addedXP } = resolveSessionState(sData, todayDate);
    
    const updatedGoals = currentGoals.map((g: Goal) =>
      g.id === goalId ? { ...g, status } : g,
    );
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
    
    const updates: any = { 
        goals: updatedGoals,
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        startTime: newStartTime,
        lastUpdated: serverTimestamp()
    };
    
    if (activeGoalId === goalId && status !== "pending") {
      updates.activeGoalId = null;
    }
    
    await updateSessionWithEconomy(ref, updates, addedCoins, addedXP, user.uid);
  };

  const removeGoal = async (goalId: string) => {
    if (!user) return;
    const ref = doc(db, "study_sessions", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    
    const sData = snap.data();
    const todayDate = getLocalDate();
    
    const { baseTime, currentGoals, weeklyData, activeGoalId, newStartTime, isStudying, addedCoins, addedXP } = resolveSessionState(sData, todayDate);
    
    const updatedGoals = currentGoals.filter((g: Goal) => g.id !== goalId);
    
    weeklyData[todayDate] = { accumulatedTime: baseTime, goals: updatedGoals };
    
    const updates: any = { 
        goals: updatedGoals,
        accumulatedTime: baseTime,
        dailyDate: todayDate,
        weeklyData,
        startTime: newStartTime,
        lastUpdated: serverTimestamp()
    };
    
    if (activeGoalId === goalId) {
      updates.activeGoalId = null;
    }
    
    await updateSessionWithEconomy(ref, updates, addedCoins, addedXP, user.uid);
  };

  const handleAdminStopSession = async (uid: string) => {
    if (!user || profile?.role !== "admin") return;
    const ref = doc(db, "study_sessions", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const s = snap.data();
      const timeStudied = s.isStudying
        ? Math.floor((Date.now() - s.startTime) / 1000)
        : 0;
      await updateDoc(ref, {
        isStudying: false,
        activeGoalId: null,
        accumulatedTime: (s.accumulatedTime || 0) + timeStudied,
        lastUpdated: serverTimestamp(),
      });

      toast.success("User session stopped");
    }
  };
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  function getSessionTime(s: any) {
    const todayDate = getLocalDate();
    let total = s.accumulatedTime || 0;
    
    if (s.dailyDate !== todayDate) {
      total = 0;
      if (s.isStudying && s.startTime) {
        const nowDate = new Date();
        const totalTimeStudied = Math.floor((nowDate.getTime() - s.startTime) / 1000);
        let effectiveEndTime = nowDate.getTime();
        if (totalTimeStudied > 3 * 3600) {
           effectiveEndTime = s.startTime + 3 * 3600 * 1000;
        }

        const midnight = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
        
        let timeStudiedToday = 0;
        if (effectiveEndTime > midnight) {
           timeStudiedToday = Math.max(0, Math.floor((effectiveEndTime - midnight) / 1000));
        }
        total += timeStudiedToday;
      }
    } else {
      if (s.isStudying && s.startTime) {
        let t = Math.floor((Date.now() - s.startTime) / 1000);
        if (t > 3 * 3600) {
           t = 3 * 3600;
        }
        total += t;
      }
    }
    
    return Math.min(total, 18 * 3600);
  };


  const displaySessions = [...filteredSessions];
  if (user && mySession && !displaySessions.find(s => s.id === user.uid)) {
    displaySessions.push(mySession);
  }

  const handleUserClick = (userId: string) => {
    const session = displaySessions.find((s) => s.id === userId);
    if (session) {
      const uData = usersData[userId] || {};
      setSelectedUserSession(session);
      setSelectedUserForProfile({
         uid: session.id,
         fullName: session.fullName || uData.fullName || session.userName || uData.userName,
         photoURL: session.photoURL || uData.photoURL || session.userPhoto || uData.userPhoto,
         role: session.role || uData.role,
         targetExam: uData.targetExam,
         ...uData
      });
    }
  };

  const isMyStudying = mySession?.isStudying;

  return (
    <div className="w-full max-w-lg mx-auto md:max-w-4xl space-y-4 pb-20">
      
      {/* Main Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[20px] p-1 text-white shadow-lg relative overflow-hidden mb-6">
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-md rounded-[16px] p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2 mb-1.5">
              Live Study Room
            </h2>
            <p className="text-blue-100/90 text-xs font-medium leading-relaxed max-w-[260px] mx-auto md:mx-0">
              Study together, set daily goals, and see your friends' screen time live.
            </p>
            
            <button 
              onClick={() => setShowRulesModal(true)}
              className="mt-3.5 inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-[0_0_15px_rgba(251,191,36,0.4)] hover:bg-amber-300 active:scale-95 uppercase tracking-wider mx-auto md:mx-0"
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              Important: Study Rules
            </button>
          </div>
          
          <div className="w-full md:w-auto bg-black/20 rounded-2xl p-4 md:p-5 border border-white/10 flex flex-col items-center shadow-inner min-w-[240px]">
            <div className="text-4xl md:text-5xl font-mono font-black tracking-tight tabular-nums drop-shadow-sm mb-1 text-white">
              {formatTime(mySession ? getSessionTime(mySession) : 0)}
            </div>
            <div className="text-blue-200/70 font-bold tracking-widest uppercase text-[9px] mb-3">
              MY STUDY TIME • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {nextCollege && requiredCoinsForNext && (
              <div className="w-full bg-slate-900/40 rounded-xl p-3 border border-slate-700/50 mb-3 shadow-inner flex flex-col gap-3">
                <div className="text-xs font-bold text-slate-300">Next: {nextCollege.name}</div>
                
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className="text-slate-400">Coins</span>
                    <span className="text-yellow-400">{Math.max(0, requiredCoinsForNext - liveCoins).toLocaleString()} Left</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                      style={{ width: `${Math.min(100, (liveCoins / requiredCoinsForNext) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                    <span className="text-slate-400">Level</span>
                    <span className="text-blue-400">{Math.max(0, (nextCollege ? getCollegeLevelRequired(nextCollege.id) : 0) - currentLevel)} Left</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${Math.min(100, (currentLevel / (nextCollege ? getCollegeLevelRequired(nextCollege.id) : 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col w-full gap-2 mt-1">
              <div className="flex items-center gap-2 w-full">
                {mySession?.isStudying ? (
                  <button onClick={() => handleStop()} className="flex-1 bg-red-500 hover:bg-red-600 transition-all py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop Session
                  </button>
                ) : (
                  <button onClick={() => handleStart()} className="flex-1 bg-green-500 hover:bg-green-600 transition-all py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <Play className="w-3.5 h-3.5 fill-current" /> Start Session
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full">
                <button onClick={togglePip} className="flex-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <PictureInPicture className="w-3 h-3" /> PiP
                </button>
                <button onClick={spawnNotification} className="flex-1 bg-white/10 dark:bg-slate-900/10 hover:bg-white/20 dark:hover:bg-slate-900/20 transition-colors py-2 rounded-xl text-[11px] font-semibold text-white flex items-center justify-center gap-1.5">
                  <Bell className="w-3 h-3" /> Notify
                </button>
              </div>
            </div>
            

          </div>
        </div>
      </div>

      {/* Today's Goals Accordion */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-4">
        <button onClick={() => setShowGoalsMenu(!showGoalsMenu)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-indigo-500" /> 
            <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">Today's Goals</span>
            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{goals.length}</span>
          </div>
          {showGoalsMenu ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        
        {showGoalsMenu && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-4 gap-2">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate min-w-0">Manage your goals for today</span>
              <button onClick={() => clearGoals()} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors shrink-0">Clear All</button>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a study goal..."
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoal()}
                className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              <button
                onClick={addGoal}
                disabled={!goalInput.trim()}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center w-12 h-12"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
                 {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map((g) => {
                  const isGoalActive = mySession?.isStudying && mySession?.activeGoalId === g.id;
                  return (
                    <div key={g.id} className={cn("flex flex-col gap-3 p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900", isGoalActive ? "border-indigo-200 shadow-sm ring-1 ring-indigo-100" : g.status === "completed" ? "border-green-200 opacity-75" : g.status === "failed" ? "border-red-200 opacity-75" : "border-slate-100 dark:border-slate-800 hover:border-indigo-100")}>
                      
                      {/* Top: Goal Text */}
                      <span className={cn("font-semibold text-[15px]", g.status === "completed" ? "text-green-700 line-through" : g.status === "failed" ? "text-red-700 line-through" : isGoalActive ? "text-indigo-900" : "text-slate-700 dark:text-slate-300")}>
                        {g.text}
                      </span>
                      
                      {/* Bottom: Controls */}
                      <div className="flex items-center justify-between mt-1">
                        
                        {/* Left: Play and Time */}
                        <div className="flex items-center gap-3">
                          {isGoalActive ? (
                            <button onClick={() => handleStop()} className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors shrink-0" title="Stop">
                              <Square className="w-4 h-4 fill-current" />
                            </button>
                          ) : (
                            <button onClick={() => handleStart(g.id)} className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors shrink-0" title="Start">
                              <Play className="w-4 h-4 ml-0.5 fill-current" />
                            </button>
                          )}
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400 tracking-tight">
                              {formatTime(getGoalTime(g))}
                            </span>
                            {g.createdAt && (
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                                {new Date(g.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Right: Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => updateGoalStatus(g.id, g.status === "completed" ? "pending" : "completed")} className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors", g.status === "completed" ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-green-100 hover:text-green-600")} title="Mark Completed">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => updateGoalStatus(g.id, g.status === "failed" ? "pending" : "failed")} className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-colors", g.status === "failed" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-100 hover:text-red-600")} title="Mark Failed">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeGoal(g.id)} className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors ml-1" title="Delete Goal">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 rounded-[24px] p-2 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab('global')}
          className={cn("flex-1 py-3 text-sm font-bold rounded-2xl transition-colors", activeTab === 'global' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800")}
        >
          Global Study Room
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          className={cn(
            "flex-1 py-3 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2",
            activeTab === 'groups' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 cursor-pointer"
          )}
        >
          Study with Friends
        </button>
      </div>

      {/* Active Students List */}
      {activeTab === "global" ? (
      <div className="bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-5 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Active Students
          </h3>
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-bold">
             {filteredSessions.filter(s => s.isStudying).length} Online
          </span>
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No active students.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {displaySessions.map(s => ({ fullName: "Unknown User", role: "student", ...s, ...(usersData[s.id] || {}) })).sort((a, b) => {
              return getSessionTime(b) - getSessionTime(a);
            }).map((s, idx) => {
              const isMe = s.id === user?.uid;
              const totalSessionTime = getSessionTime(s);
              const isAdmin = s.role === 'admin' || (s.id === '33i0xJtN9HNA9hQZ5j0N31U2u9p2');
              
              return (
                <div key={s.id} onClick={() => handleUserClick(s.id)} className={cn("flex items-start gap-4 py-4 px-4 border-b border-slate-50 last:border-0 transition-colors", idx === 0 ? "bg-yellow-50/30" : "")}>
                  {/* Left: Avatar with rank */}
                  <div className="relative shrink-0 mt-1">
                     <div className={cn("w-14 h-14 rounded-full overflow-hidden shadow-sm flex items-center justify-center font-bold text-xl", 
                        isAdmin ? "border-[2px] border-blue-500 text-blue-600 bg-blue-100" :
                        idx === 0 ? "border-[3px] border-yellow-400 text-yellow-600 bg-yellow-100" :
                        idx === 1 ? "border-[3px] border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800" :
                        idx === 2 ? "border-[3px] border-orange-400 text-orange-600 bg-orange-100" :
                        "border-2 border-slate-200 dark:border-slate-700 text-indigo-600 bg-indigo-50")}>
                       {(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} alt={s.fullName || s.userName} className="w-full h-full object-cover" /> : getFirstName(s.fullName || s.userName || "Unknown User").charAt(0).toUpperCase()}
                     </div>
                     {s.isStudying && (
                       <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10"></span>
                     )}
                     
                     {/* Rank Badges */}
                     {idx === 0 && (
                       <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1 shadow-sm border-2 border-white z-10">
                          <Crown className="w-3.5 h-3.5 fill-current" />
                       </div>
                     )}
                     {idx === 1 && (
                       <div className="absolute -top-1 -right-1 bg-slate-300 text-slate-700 dark:text-slate-300 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm border border-white z-10">
                          #2
                       </div>
                     )}
                     {idx === 2 && (
                       <div className="absolute -top-1 -right-1 bg-orange-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm border border-white z-10">
                          #3
                       </div>
                     )}
                     
                     {/* Admin Diamond */}
                     {isAdmin && (
                       <div className="absolute -top-1.5 -left-1.5 text-cyan-400 drop-shadow-sm z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/></svg>
                       </div>
                     )}
                  </div>
                  
                  {/* Middle: Name and Goal */}
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate text-base">
                         {getFirstName(s.fullName || s.userName || "Unknown User")}
                       </h4>
                       {isAdmin && (
                         <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                           ADMIN
                         </span>
                       )}
                       {isMe && (
                         <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                           YOU
                         </span>
                       )}
                       {/* Add the Class tag if available */}
                       {(!isAdmin && !isMe && s.userClass && s.userClass !== "N/A") && (
                         <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                           {s.userClass}
                         </span>
                       )}
                     </div>
                     
                     <div className="flex flex-wrap items-center gap-1.5">
                       {s.goals && s.goals.length > 0 ? (
                         s.goals.map((g: any, i: number) => {
                           const isGoalActive = g.id === s.activeGoalId && s.isStudying;
                           const isGoalCompleted = g.status === 'completed';
                           const isGoalFailed = g.status === 'failed';
                           return (
                             <div key={g.id || i} className={cn("flex items-center text-[11px] font-medium border px-2 py-0.5 rounded-full w-fit max-w-full",
                                 isGoalCompleted ? "border-green-200 text-green-700 bg-green-50" :
                                 isGoalFailed ? "border-red-200 text-red-700 bg-red-50" :
                                 isGoalActive ? "border-indigo-200 text-indigo-700 bg-indigo-50" : 
                                 "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900")}>
                               {isGoalCompleted ? (
                                 <div className="mr-1.5 flex items-center justify-center shrink-0">
                                   <CheckCircle2 className="w-3 h-3 text-green-600" />
                                 </div>
                               ) : isGoalFailed ? (
                                 <div className="mr-1.5 flex items-center justify-center shrink-0">
                                   <XCircle className="w-3 h-3 text-red-600" />
                                 </div>
                               ) : (
                                 <div className={cn("w-2 h-2 mr-1.5 rounded-full shrink-0 border-[1.5px]", 
                                   isGoalActive ? "border-indigo-500 bg-indigo-100" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900")} />
                               )}
                               <span className={cn("truncate", (isGoalCompleted || isGoalFailed) && "line-through")}>{g.text}</span>
                             </div>
                           );
                         })
                       ) : (
                         <div className="flex items-center text-[11px] font-medium text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded-full w-fit italic">
                           No goals set
                         </div>
                       )}
                     </div>
                     
                     {/* Cheers */}
                     {!isMe && s.isStudying && (
                       <div className="flex gap-1.5 mt-2.5" onClick={(e) => e.stopPropagation()}>
                         <button disabled={cheerCooldowns[s.id]} onClick={() => handleCheer(s.id, 'cheer_fire')} className="w-8 h-8 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center text-sm disabled:opacity-50 transition-colors border border-orange-100/50">🔥</button>
                         <button disabled={cheerCooldowns[s.id]} onClick={() => handleCheer(s.id, 'cheer_clap')} className="w-8 h-8 rounded-full bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center text-sm disabled:opacity-50 transition-colors border border-yellow-100/50">👏</button>
                       </div>
                     )}
                  </div>
                  
                  {/* Right: Time and Status */}
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <div className="text-xl font-mono font-black text-slate-700 dark:text-slate-300 tracking-tight">
                      {formatTime(totalSessionTime)}
                    </div>
                    
                    {!s.isStudying ? (
                      <div className="text-[10px] font-black text-slate-400 tracking-widest mt-1 uppercase">
                         PAUSED
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 mt-1 mb-1.5">
                           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                           <span className="text-[10px] font-black text-green-600 tracking-widest uppercase">
                             STUDYING
                           </span>
                        </div>
                        
                        {(profile?.role === "admin" || (user?.uid === '33i0xJtN9HNA9hQZ5j0N31U2u9p2')) && !isMe && (
                           <button onClick={(e) => { e.stopPropagation(); handleStop(s.id); }} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors px-4 py-1.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm mt-1">
                             <Square className="w-3 h-3 fill-current" /> Stop
                           </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      ) : (
        <PrivateStudyGroups sessions={displaySessions} usersData={usersData} getSessionTime={getSessionTime} formatTime={formatTime} handleUserClick={handleUserClick} />
      )}

      {/* Ad placement below member list */}
      <div className="flex justify-center my-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-sm border border-slate-100 dark:border-slate-800 p-2">
      </div>

      {showRulesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                Study Room Rules
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">18 Hours Daily Limit</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    You can study up to 18 hours per day to maintain healthy habits.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">3-Hour Slots</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    To prevent fake study time, the timer automatically stops every 3 hours. You must manually start it again to continue.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Midnight Reset</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Daily time and goals automatically reset at 12:00 AM local time.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedUserForProfile && (
        <UserProfileModal
          user={selectedUserForProfile}
          session={selectedUserSession}
          onClose={() => {
            setSelectedUserForProfile(null);
            setSelectedUserSession(null);
          }}
        />
      )}

      {pipWindow &&
        createPortal(
          <div
            className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white p-4"
            style={{
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0f172a",
              color: "white",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: "#94a3b8",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isMyStudying ? (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#22c55e",
                    borderRadius: "50%",
                    animation: "pulse 2s infinite",
                  }}
                ></div>
              ) : (
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                  }}
                ></div>
              )}
              Live Study Timer
            </div>
            <div
              style={{
                fontSize: "32px",
                fontFamily: "monospace",
                fontWeight: "bold",
                color: "#818cf8",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(getSessionTime(mySession))}
            </div>
            <div style={{ marginTop: "12px", display: "flex", gap: "12px" }}>
              {isMyStudying ? (
                <button
                  onClick={() => handleStop()}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
                  }}
                >
                  Stop Session
                </button>
              ) : (
                <button
                  onClick={() => handleStart()}
                  style={{
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(34, 197, 94, 0.2)",
                  }}
                >
                  Start Session
                </button>
              )}
            </div>
          </div>,
          pipWindow.document.body,
        )}
    </div>
  );
}

