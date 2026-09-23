import re

file_path = "src/pages/Campus.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Change default tab
content = content.replace("useState<'city' | 'collection'>('city')", "useState<'collection' | 'city'>('collection')")

# Swap buttons
buttons = """
        {/* Tabs */}
        <div className="flex items-center gap-2 mt-8 mb-6 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
          <button
            onClick={() => setActiveTab('collection')}
            className={cn(
              "px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'collection' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Building2 className="w-4 h-4" /> Collection
          </button>
          <button
            onClick={() => setActiveTab('city')}
            className={cn(
              "px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2",
              activeTab === 'city' ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <MapPin className="w-4 h-4" /> City View
          </button>
        </div>
"""

# The existing buttons block starts at {/* Tabs */} and ends at </div> before {activeTab === 'city'
# Let's just use regex
old_tabs_pattern = r"\{\/\* Tabs \*\/}.*?<\/div>\s*\{activeTab === 'city'"
new_tabs = buttons.strip() + "\n\n        {activeTab === 'city'"

content = re.sub(old_tabs_pattern, new_tabs, content, flags=re.DOTALL)

with open(file_path, "w") as f:
    f.write(content)
