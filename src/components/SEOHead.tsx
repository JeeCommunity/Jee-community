import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://jee-community.netlify.app';

const ROUTE_SEO_MAP: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  '/': {
    title: 'JEE Community (Official) — Free JEE Main & Advanced Doubt Solving, Notes Hub & Live Study Rooms',
    description:
      'Official JEE Community (jee-community.netlify.app) — India’s #1 student community for Class 11, Class 12 & Droppers. Solve Physics, Chemistry & Maths doubts, download handwritten notes, and join Live Study Rooms.',
  },
  '/community': {
    title: 'JEE Community Feed — Ask Physics, Chemistry & Maths Doubts | JEE 11 & 12 Community',
    description:
      'Join the official JEE Community discussion feed at jee-community.netlify.app/community. Post JEE Main & Advanced doubts, get step-by-step AI + peer solutions, and access topper notes.',
  },
  '/study-room': {
    title: 'Live Study Rooms & Pomodoro Timer — JEE Community',
    description:
      'Study live with serious IIT JEE & NEET aspirants. Track daily study hours, maintain streaks, and climb the JEE Community leaderboard.',
  },
  '/notes': {
    title: 'Notes Hub — Free IIT JEE Handwritten Notes, Formula Sheets & PYQs | JEE Community',
    description:
      'Download free Physics, Chemistry, and Mathematics handwritten notes, short notes, and chapter-wise formula sheets curated by JEE toppers.',
  },
  '/error-notes': {
    title: 'My Error Notes & Mistake Tracker — JEE Community',
    description:
      'Save and revise your mock test mistakes, tricky JEE numericals, and important formulas in your personal Error Notes notebook.',
  },
  '/calculator': {
    title: 'JEE Main Rank, Percentile & IIT College Predictor — JEE Community',
    description:
      'Calculate your expected JEE Main percentile and rank from marks, and explore IIT/NIT cutoffs with the JEE Community Calculator.',
  },
  '/campus': {
    title: 'IIT Campus Explorer & Virtual Map — JEE Community',
    description:
      'Explore top IIT campuses, branches, and student life to stay motivated for your dream IIT goal.',
  },
  '/about': {
    title: 'About JEE Community — Official Student Platform for IIT JEE Aspirants',
    description:
      'Learn about JEE Community, India’s collaborative preparation platform for JEE Main and Advanced aspirants.',
  },
};

export default function SEOHead() {
  const location = useLocation();

  useEffect(() => {
    const cleanPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '');
    const canonicalUrl = `${BASE_URL}${cleanPath === '/' ? '/' : cleanPath}`;

    const meta = ROUTE_SEO_MAP[cleanPath] || {
      title: 'JEE Community — IIT JEE Doubt Solving, Notes Hub & Live Study Rooms',
      description:
        'Official JEE Community platform (jee-community.netlify.app) for JEE Main & Advanced aspirants. Free doubt solving, handwritten notes, and live study groups.',
    };

    document.title = meta.title;

    // Update or create canonical link
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);

    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector<HTMLMetaElement>(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    setMetaContent('meta[name="description"]', meta.description);
    setMetaContent('meta[name="title"]', meta.title);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.description);
    setMetaContent('meta[name="twitter:url"]', canonicalUrl);
  }, [location.pathname]);

  return null;
}
