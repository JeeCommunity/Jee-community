import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

# Pattern for mobile top nav
old_badge_mobile = """              {activeStudentsCount > 0 && (
                <span className="absolute top-1 -right-2 px-1 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200 shadow-sm leading-none z-10">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-0.5 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}"""

new_badge_mobile = """              {activeStudentsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                  <span className="w-1 h-1 bg-white rounded-full mr-0.5 animate-pulse"></span>
                  {activeStudentsCount}
                </span>
              )}"""

# Pattern for desktop top nav
old_badge_desktop = """                  {activeStudentsCount > 0 && (
                    <span className="absolute -top-1.5 -right-3.5 px-1 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200 shadow-sm leading-none z-10">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-0.5 animate-pulse"></span>
                      {activeStudentsCount}
                    </span>
                  )}"""

new_badge_desktop = """                  {activeStudentsCount > 0 && (
                    <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                      <span className="w-1 h-1 bg-white rounded-full mr-0.5 animate-pulse"></span>
                      {activeStudentsCount}
                    </span>
                  )}"""

# Pattern for mobile menu
old_badge_menu = """                      {activeStudentsCount > 0 && (
                        <span className="absolute -top-2 -right-4 px-1 py-0.5 text-[9px] font-bold bg-red-100 text-red-600 rounded-full flex items-center border border-red-200 shadow-sm leading-none z-10">
                          <span className="w-1 h-1 bg-red-500 rounded-full mr-0.5 animate-pulse"></span>
                          {activeStudentsCount}
                        </span>
                      )}"""

new_badge_menu = """                      {activeStudentsCount > 0 && (
                        <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm leading-none z-10">
                          <span className="w-1 h-1 bg-white rounded-full mr-0.5 animate-pulse"></span>
                          {activeStudentsCount}
                        </span>
                      )}"""

if old_badge_mobile in content:
    content = content.replace(old_badge_mobile, new_badge_mobile)
    print("Replaced mobile top nav badge")
else:
    print("Mobile top nav badge not found")

if old_badge_desktop in content:
    content = content.replace(old_badge_desktop, new_badge_desktop)
    print("Replaced desktop top nav badge")
else:
    print("Desktop top nav badge not found")

if old_badge_menu in content:
    content = content.replace(old_badge_menu, new_badge_menu)
    print("Replaced mobile menu badge")
else:
    print("Mobile menu badge not found")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
