export type ProposalStatus =
  | 'idea_pending'      // Step 1: Manager submitted idea, waiting for Super Admin permission to start
  | 'idea_approved'     // Gate 1 Passed: Super Admin allowed Manager to build in AI Feature Sandbox
  | 'idea_rejected'     // Super Admin rejected the idea
  | 'deploy_pending'    // Step 2 Done: Manager built feature in Sandbox, waiting for Super Admin Final Deploy
  | 'deployed'          // Gate 2 Passed: Super Admin approved & deployed to main app
  | 'rolled_back';      // Super Admin clicked 1-Click Rollback after deploy

export type FeatureCategory =
  | 'ai_mini_app'         // Interactive Feature / Mini-App (Calculators, Quizzes, Flashcards, Timers, Custom Widget)
  | 'ui_section'          // UI Section, Custom Card & Theme Accent
  | 'study_countdown'     // Exam Countdown & Study Resource Links
  | 'poll_challenge'      // Community Poll, Challenge & Event
  | 'announcement_banner';// Top Announcement Banner & Pinned Notice

export type TargetPage = 'community' | 'campus' | 'both';

export type AccentColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';

export type MiniAppSubType =
  | 'calculator'
  | 'quiz_flashcards'
  | 'study_checklist_timer'
  | 'custom_widget';

export interface QuizQuestionItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FlashcardItem {
  front: string;
  back: string;
  tag?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  points: number;
}

export interface ResourceLinkItem {
  label: string;
  url: string;
  tag?: string;
}

export interface PollOptionItem {
  id: string;
  text: string;
  votes: number;
}

export interface CalculatorConfig {
  inputLabel: string;
  inputPlaceholder: string;
  minVal: number;
  maxVal: number;
  defaultVal: number;
  secondaryInputLabel?: string;
  secondaryDefaultVal?: number;
  formulaType: 'jee_marks_vs_percentile' | 'study_hours_to_rank' | 'accuracy_score' | 'custom_multiplier';
  customMultiplier?: number;
  resultUnitLabel: string;
  helperNote: string;
}

export interface SandboxFeaturePayload {
  headline: string;
  subtitle: string;
  badgeText: string;
  accentColor: AccentColor;
  ctaText?: string;
  ctaUrl?: string;

  // 1. AI Interactive Mini-App fields
  miniAppType?: MiniAppSubType;
  calculatorConfig?: CalculatorConfig;
  quizItems?: QuizQuestionItem[];
  flashcards?: FlashcardItem[];
  checklistItems?: ChecklistItem[];
  timerMinutes?: number;
  customHtmlWidget?: string;
  superAdminCorePrompt?: string;

  // 2. UI Section / Spotlight Card fields
  bulletPoints?: string[];
  highlightStat?: string;

  // 3. Exam Countdown & Study Links fields
  examName?: string;
  examDateISO?: string;
  motivationalQuote?: string;
  resourceLinks?: ResourceLinkItem[];

  // 4. Poll & Challenge fields
  pollQuestion?: string;
  pollOptions?: PollOptionItem[];
  votedUsers?: Record<string, string>; // uid -> optionId
  challengeTask?: string;
  challengeRewardText?: string;

  // 5. Announcement Banner fields
  bannerIcon?: string;
  isUrgent?: boolean;
}

export interface ManagerProposal {
  id: string;
  title: string;
  ideaDescription: string;
  category: FeatureCategory;
  targetPage: TargetPage;
  status: ProposalStatus;
  managerId: string;
  managerName: string;
  managerUsername?: string;
  aiPromptUsed?: string;
  changeSummaryNote?: string;
  adminFeedback?: string;
  payload: SandboxFeaturePayload;
  createdAt?: any;
  updatedAt?: any;
  deployedAt?: any;
  rolledBackAt?: any;
}

export const FEATURE_CATEGORY_META: Record<
  FeatureCategory,
  { label: string; shortLabel: string; icon: string; desc: string; badgeColor: string }
> = {
  ai_mini_app: {
    label: '⚡ AI Interactive Feature / Mini-App (New Power)',
    shortLabel: '⚡ Interactive Feature',
    icon: '⚡',
    desc: 'Jaise Super Admin banata hai: Custom Calculator, Formula Flashcards, Practice Quiz, Study Timer ya Custom Interactive Tool',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-300 dark:border-violet-800',
  },
  ui_section: {
    label: '🎨 Custom UI Section & Spotlight Card',
    shortLabel: '🎨 UI Section / Card',
    icon: '🎨',
    desc: 'Naya UI section, motivation card, highlight box aur theme color accent',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
  },
  study_countdown: {
    label: '⏳ Exam Countdown & Study Resource Links',
    shortLabel: '⏳ Countdown & Links',
    icon: '⏳',
    desc: 'Live ticking JEE/NEET Exam Countdown timer + PDF Notes, Formula Sheets aur Video links',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  poll_challenge: {
    label: '🏆 Community Poll, Daily Challenge & Event',
    shortLabel: '🏆 Poll & Challenge',
    icon: '🏆',
    desc: 'Students ke liye live interactive voting poll aur daily study target challenge',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  announcement_banner: {
    label: '📢 Top Announcement Banner & Pinned Notice',
    shortLabel: '📢 Top Notice Banner',
    icon: '📢',
    desc: 'Page ke sabse upar important notice, alert banner ya update bar',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
};

export const STATUS_META: Record<
  ProposalStatus,
  { label: string; hinglishDesc: string; colorClass: string }
> = {
  idea_pending: {
    label: '⏳ Step 1: Waiting for Idea Permission',
    hinglishDesc: 'Super Admin ke "Allow Idea" permission ka wait ho raha hai. Abhi Sandbox locked hai.',
    colorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  idea_approved: {
    label: '🛠️ Step 2: Idea Approved — Sandbox Unlocked!',
    hinglishDesc: 'Super Admin ne kaam shuru karne ki permission de di hai! Ab AI Feature Studio me feature banayein.',
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  idea_rejected: {
    label: '❌ Idea Not Approved',
    hinglishDesc: 'Super Admin ne is idea ko approve nahi kiya.',
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
  },
  deploy_pending: {
    label: '🚀 Step 3: Ready for Super Admin Final Deploy',
    hinglishDesc: 'Manager ne Sandbox me feature tayar kar liya hai. Super Admin Live Preview check karke Final Deploy karenge.',
    colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  deployed: {
    label: '🟢 LIVE ON MAIN APP (Deployed)',
    hinglishDesc: 'Super Admin ke permission se ye feature ab Main App par students ke liye Live hai!',
    colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700',
  },
  rolled_back: {
    label: '⏪ Rolled Back (Removed from Live)',
    hinglishDesc: 'Super Admin ne 1-Click Rollback se is feature ko Main App se hata diya hai.',
    colorClass: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
};

export function getDefaultPayloadForCategory(
  category: FeatureCategory,
  title: string,
  description: string
): SandboxFeaturePayload {
  const cleanTitle = title.trim() || 'New JEE Study Feature';
  const cleanDesc = description.trim() || 'Special interactive update for JEE Aspirants.';

  if (category === 'ai_mini_app') {
    return {
      headline: cleanTitle,
      subtitle: cleanDesc,
      badgeText: '⚡ NEW INTERACTIVE TOOL',
      accentColor: 'violet',
      miniAppType: 'calculator',
      calculatorConfig: {
        inputLabel: 'Apna Expected JEE Main Score Dalein (Out of 300)',
        inputPlaceholder: 'e.g. 185',
        minVal: 0,
        maxVal: 300,
        defaultVal: 180,
        formulaType: 'jee_marks_vs_percentile',
        resultUnitLabel: 'Expected Percentile & AIR Rank',
        helperNote: 'Recent JEE Main shift trends ke basis par instant calculation.',
      },
      quizItems: [
        {
          question: 'Rotational Motion: Solid sphere ka Moment of Inertia (axis through center) kya hota hai?',
          options: ['(2/5) MR²', '(2/3) MR²', '(1/2) MR²', 'MR²'],
          correctIndex: 0,
          explanation: 'Solid sphere ke center of mass se guzarne wali axis ke liye I = (2/5)MR² hota hai, jabki hollow sphere ke liye (2/3)MR².',
        },
        {
          question: 'Electrostatics: Equipotential surface aur Electric Field lines ke beech kitna angle hota hai?',
          options: ['0°', '45°', '90° (Perpendicular)', '180°'],
          correctIndex: 2,
          explanation: 'Electric field hamesha equipotential surface ke perpendicular (90°) hoti hai kyunki surface par potential difference zero hota hai.',
        },
        {
          question: 'Calculus: ∫ (1 / x) dx ka integration kya hai?',
          options: ['1 / x² + C', 'ln|x| + C', 'e^x + C', 'x ln(x) + C'],
          correctIndex: 1,
          explanation: '1/x ka antiderivative natural log ln|x| + C hota hai.',
        },
      ],
      flashcards: [
        {
          front: '🔥 Work-Energy Theorem Formula',
          back: 'W_all (Total Work by all forces) = ΔK = ½ m v_f² - ½ m v_i²',
          tag: 'Physics',
        },
        {
          front: '⚡ De Broglie Wavelength (λ)',
          back: 'λ = h / p = h / √(2 m K.E.)  (Electron ke liye: λ ≈ 12.27 / √V Å)',
          tag: 'Modern Physics',
        },
        {
          front: '🧪 Nernst Equation at 298K',
          back: 'E_cell = E°_cell - (0.0591 / n) log₁₀(Q)',
          tag: 'Physical Chem',
        },
      ],
      checklistItems: [
        { id: 'c1', label: '30 PYQs Solve Karein (Physics / Maths)', points: 50 },
        { id: 'c2', label: 'Formula Short Notes 20 Min Revise Karein', points: 30 },
        { id: 'c3', label: '1 Mock Test Analysis / Error Note Update', points: 70 },
      ],
      timerMinutes: 25,
      customHtmlWidget: '',
      superAdminCorePrompt: `Create an interactive "${cleanTitle}" feature on JEE Community: ${cleanDesc}`,
    };
  }

  if (category === 'study_countdown') {
    const targetDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    return {
      headline: cleanTitle,
      subtitle: cleanDesc,
      badgeText: '⏳ EXAM COUNTDOWN & RESOURCES',
      accentColor: 'emerald',
      examName: 'JEE Main Upcoming Session',
      examDateISO: targetDate,
      motivationalQuote: 'Har ek ghanta aapko aapki dream IIT/NIT seat ke kareeb le ja raha hai! Keep grinding 🔥',
      resourceLinks: [
        { label: '📘 Open Notes Hub', url: '/notes', tag: 'Free PDFs' },
        { label: '🧮 JEE Scientific Calculator', url: '/calculator', tag: 'Practice' },
        { label: '🎧 Join Live Study Room', url: '/study-room', tag: 'Focus' },
      ],
    };
  }

  if (category === 'poll_challenge') {
    return {
      headline: cleanTitle,
      subtitle: cleanDesc,
      badgeText: '🏆 DAILY CHALLENGE & POLL',
      accentColor: 'amber',
      pollQuestion: 'Aaj aapka sabse strong focus kis subject par रहने wala hai?',
      pollOptions: [
        { id: 'opt1', text: '⚡ Physics Numericals & PYQs', votes: 14 },
        { id: 'opt2', text: '🧪 Chemistry NCERT + Mechanisms', votes: 11 },
        { id: 'opt3', text: '📐 Mathematics Calculus & Algebra', votes: 16 },
        { id: 'opt4', text: '🎯 Full Mock Test + Revision', votes: 9 },
      ],
      votedUsers: {},
      challengeTask: 'Aaj bina distraction ke kam se kam 4 घंटे Live Study Room me padhai poori karein aur 40 PYQs lagayein!',
      challengeRewardText: '+100 Focus XP Boost Mindset 🔥',
    };
  }

  if (category === 'announcement_banner') {
    return {
      headline: cleanTitle,
      subtitle: cleanDesc,
      badgeText: '📢 IMPORTANT NOTICE',
      accentColor: 'rose',
      bannerIcon: '🚀',
      isUrgent: true,
      ctaText: 'Explore Now',
      ctaUrl: '/notes',
    };
  }

  // Default: ui_section
  return {
    headline: cleanTitle,
    subtitle: cleanDesc,
    badgeText: '✨ FEATURE SPOTLIGHT',
    accentColor: 'indigo',
    bulletPoints: [
      'Chapter-wise High Weightage Formula Revision',
      'Instant AI Doubt Solving & Peer Discussion',
      'Live Study Room Streak & Leaderboards',
    ],
    highlightStat: '🔥 100% Free for JEE Aspirants',
    ctaText: 'Start Studying',
    ctaUrl: '/study-room',
  };
}

export function generateSmartFeatureFallback(
  prompt: string,
  category: FeatureCategory,
  title: string
): SandboxFeaturePayload {
  const p = prompt.toLowerCase();
  const base = getDefaultPayloadForCategory(category, title || prompt.slice(0, 50), prompt);

  // Detect what the manager asked for in Hinglish/English
  if (p.includes('quiz') || p.includes('mcq') || p.includes('test') || p.includes('question') || p.includes('flashcard')) {
    base.miniAppType = 'quiz_flashcards';
    base.badgeText = '🧠 INTERACTIVE QUIZ & FLASHCARDS';
    base.accentColor = 'indigo';
  } else if (p.includes('timer') || p.includes('pomodoro') || p.includes('checklist') || p.includes('tracker') || p.includes('target') || p.includes('goal')) {
    base.miniAppType = 'study_checklist_timer';
    base.badgeText = '⏱️ FOCUS TIMER & TARGET TRACKER';
    base.accentColor = 'emerald';
  } else if (p.includes('custom') || p.includes('table') || p.includes('widget') || p.includes('html') || p.includes('game') || p.includes('periodic') || p.includes('visualizer')) {
    base.miniAppType = 'custom_widget';
    base.badgeText = '💻 INTERACTIVE MINI-APP';
    base.accentColor = 'cyan';
    base.customHtmlWidget = `<div style="font-family: system-ui, sans-serif; padding: 16px; background: linear-gradient(135deg, #0f172a, #1e1b4b); color: white; border-radius: 16px;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
    <h3 style="margin:0; font-size:18px; font-weight:800;">⚡ ${title || 'Interactive JEE Booster Tool'}</h3>
    <span style="background:#6366f1; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700;">Interactive</span>
  </div>
  <p style="margin:0 0 14px; font-size:13px; color:#cbd5e1;">${prompt}</p>
  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:14px;">
    <div style="background:rgba(255,255,255,0.08); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.12);">
      <div style="font-size:11px; color:#94a3b8;">High Weightage</div>
      <div style="font-size:15px; font-weight:700; margin-top:4px;"> Mechanics & Optics</div>
    </div>
    <div style="background:rgba(255,255,255,0.08); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.12);">
      <div style="font-size:11px; color:#94a3b8;">Chemistry Boost</div>
      <div style="font-size:15px; font-weight:700; margin-top:4px;">🧪 GOC & Coordination</div>
    </div>
    <div style="background:rgba(255,255,255,0.08); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.12);">
      <div style="font-size:11px; color:#94a3b8;">Maths Scorer</div>
      <div style="font-size:15px; font-weight:700; margin-top:4px;">📐 Vectors, 3D & Matrices</div>
    </div>
  </div>
  <button onclick="const el=document.getElementById('tip-box'); el.style.display = el.style.display==='none' ? 'block' : 'none';" style="background:#10b981; color:white; border:none; padding:10px 16px; border-radius:10px; font-weight:700; cursor:pointer; font-size:13px;">
    🎯 Click for Today's Secret Rank Booster Tip
  </button>
  <div id="tip-box" style="display:none; margin-top:12px; padding:12px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); border-radius:10px; font-size:13px;">
    ✅ <strong>Topper Tip:</strong> Last 5 years ke PYQs ko timer laga kar solve karne se speed 40% tak badhti hai!
  </div>
</div>`;
  } else if (p.includes('rank') || p.includes('percentile') || p.includes('marks') || p.includes('calc') || p.includes('score')) {
    base.miniAppType = 'calculator';
    base.badgeText = '🧮 RANK & PERCENTILE PREDICTOR';
    base.accentColor = 'violet';
  }

  return base;
}
