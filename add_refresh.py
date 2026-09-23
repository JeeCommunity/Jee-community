import re

with open('src/pages/Community.tsx', 'r') as f:
    content = f.read()

target = """            <InstallAppButton />
          </div>
          {profile?.role === 'admin' && ("""
replacement = """            <InstallAppButton />
            <button 
              onClick={handleRefresh} 
              className={`p-2 rounded-full transition-colors ${isRefreshing ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600 hover:bg-slate-100"}`}
              title="Refresh Feed"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          {profile?.role === 'admin' && ("""

if target in content:
    content = content.replace(target, replacement)

with open('src/pages/Community.tsx', 'w') as f:
    f.write(content)
