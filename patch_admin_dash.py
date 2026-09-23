import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { Users, ShieldAlert, BarChart2, MessageSquare, Link as LinkIcon, Download, Check, X, LogOut, Loader2, ArrowLeft } from 'lucide-react';", "import { Users, ShieldAlert, BarChart2, MessageSquare, Link as LinkIcon, Download, Check, X, LogOut, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';")

new_btn = """              <button 
                onClick={() => navigate('/status-replies')}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium border border-slate-200"
              >
                <MessageCircle className="w-5 h-5 text-indigo-500" />
                View Status Replies
              </button>
"""
# Find a good place to inject the button. Let's find "Sign Out" or something in the dashboard sidebar/buttons
# Actually, let's just append it after some existing button in the admin dashboard.
