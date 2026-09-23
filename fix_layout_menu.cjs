const fs = require('fs');
let file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove from Mobile Top Bar (lines 243-246)
const mobileTopBarWrongLink = `<Link to="/my-notes" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <StickyNote className="w-5 h-5" />
                  <span>My Notes</span>
                </Link>`;
if (code.includes(mobileTopBarWrongLink)) {
    code = code.replace(mobileTopBarWrongLink, '');
    console.log("Removed from mobile top bar");
}

// 2. Remove from Desktop Top Bar
const desktopTopBarLink = `<Link
                to="/my-notes"
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="My Notes"
              >
                <StickyNote className="w-5 h-5" />
                <span className="hidden lg:inline">My Notes</span>
              </Link>`;
if (code.includes(desktopTopBarLink)) {
    code = code.replace(desktopTopBarLink, '');
    console.log("Removed from desktop top bar");
}

// 3. Add to Mobile Menu (below Notes Hub)
const mobileMenuNotesHub = `                  <div className="flex items-center gap-2">
                    <span>Notes Hub</span>
                    {showNotesBadge && <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse shadow-sm">New</span>}
                  </div>
                </Link>`;

const mobileMenuMyNotes = `
                <Link to="/my-notes" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <StickyNote className="w-5 h-5" />
                  <span>My Notes</span>
                </Link>`;

if (code.includes(mobileMenuNotesHub) && !code.includes('<span>My Notes</span>')) {
    code = code.replace(mobileMenuNotesHub, mobileMenuNotesHub + mobileMenuMyNotes);
    console.log("Added to mobile menu");
}

// 4. Add to Profile Dropdown (above LogOut)
const logoutButton = `<button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>`;

const profileMyNotes = `                    <Link to="/my-notes" className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 flex items-center" onClick={() => setShowDropdown(false)}>
                      <StickyNote className="w-4 h-4 mr-2" />
                      My Notes
                    </Link>`;

if (code.includes(logoutButton) && !code.includes('StickyNote className="w-4 h-4 mr-2"')) {
    code = code.replace(logoutButton, profileMyNotes + '\\n                    ' + logoutButton);
    console.log("Added to profile dropdown");
}

fs.writeFileSync(file, code);
console.log("Done");
