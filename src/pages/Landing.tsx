import { Link, Navigate } from 'react-router-dom';
import { BookOpen, Target, Zap, Trophy, ArrowRight, BrainCircuit, Users, Compass, HelpCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/community" />;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-800 overflow-hidden relative">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4 relative z-10">
        <div className="inline-flex items-center space-x-2 bg-blue-100/50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-blue-200">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>The Ultimate Hub for JEE Aspirants</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6 max-w-4xl leading-[1.1]">
          Crack IIT JEE with the Best <br className="hidden md:block" />
          <span className="text-blue-600">
            JEE Community
          </span>
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium">
          Join the largest free <Link to="/community" className="text-blue-600 hover:underline">JEE Doubt Solving Platform</Link>. Connect with a serious JEE Study Group, solve hard problems, and stay motivated for JEE Main and Advanced.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            to="/login"
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-200 flex items-center justify-center space-x-2 text-lg group"
            aria-label="Join the JEE Community"
          >
            <span>Join Community</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-slate-500 dark:text-slate-400 font-medium text-sm">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <span>Laser Focused</span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Top Ranks</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span>Active Peers</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-slate-900 relative z-10 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Why join our Free JEE Doubt Solving Community?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Everything you need to master concepts and stay ahead in your JEE Preparation.</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <article className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI & Peer JEE Doubt Solver</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Stuck on <strong className="font-semibold text-slate-800 dark:text-slate-200">Physics Doubts</strong>, <strong className="font-semibold text-slate-800 dark:text-slate-200">Chemistry Doubts</strong>, or <strong className="font-semibold text-slate-800 dark:text-slate-200">Mathematics Doubts</strong>? Ask our IIT JEE Community and get step-by-step explanations instantly.
              </p>
            </article>
            <article className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-shadow group md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Join the Best JEE Study Group</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Preparation is a marathon. Surround yourself with driven aspirants in our <Link to="/study-room" className="text-cyan-600 hover:underline font-semibold">Live Study Rooms</Link> who push you to do better every day.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800 relative z-10 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Frequently Asked JEE Questions and Answers</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Learn more about the ultimate JEE Preparation Community.</p>
          </header>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-blue-500 mr-2" />
                What is the JEE Community?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">The JEE Community is a free platform for JEE Main and JEE Advanced aspirants to discuss strategies, share notes, and participate in doubt solving for Physics, Chemistry, and Mathematics.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-indigo-500 mr-2" />
                Is this a free JEE Doubt Solving Platform?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">Yes, our JEE Doubt Solver and community discussion forum are completely free for all students preparing for engineering entrance exams. You can ask and answer as many questions as you need.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-cyan-500 mr-2" />
                Can I ask Physics, Chemistry, and Mathematics doubts here?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">Absolutely! You can post your Physics doubts, Chemistry doubts, and Mathematics doubts to get help from peers and mentors in our JEE Study Group.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 relative z-10">
        <div className="flex justify-center space-x-6 mb-4">
          <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link>
          <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
          <Link to="/disclaimer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Disclaimer</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} JEE Community. Built for future engineers.</p>
        <p className="mt-2 text-xs">The premier IIT JEE Community & Discussion Forum.</p>
      </footer>
    </div>
  );
}
