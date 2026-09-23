const fs = require('fs');

let file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf8');

// Ensure StickyNote or NotepadText is imported
if (!code.includes('StickyNote')) {
  code = code.replace(
    `Library, Trash2, CalendarDays, ExternalLink`,
    `Library, Trash2, CalendarDays, ExternalLink, StickyNote`
  );
}

const desktopNotesLink = `<Link
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
              </Link>`;

const desktopMyNotesLink = `              <Link
                to="/my-notes"
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="My Notes"
              >
                <StickyNote className="w-5 h-5" />
                <span className="hidden lg:inline">My Notes</span>
              </Link>`;

const mobileNotesLink = `<Link to="/notes" onClick={() => {
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
                </Link>`;

const mobileMyNotesLink = `<Link to="/my-notes" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <StickyNote className="w-5 h-5" />
                  <span>My Notes</span>
                </Link>`;

if (code.includes(desktopNotesLink) && !code.includes('to="/my-notes"')) {
  code = code.replace(desktopNotesLink, desktopNotesLink + '\n' + desktopMyNotesLink);
  code = code.replace(mobileNotesLink, mobileNotesLink + '\n' + mobileMyNotesLink);
  fs.writeFileSync(file, code);
  console.log("Patched Layout.tsx");
} else {
  console.log("Could not patch Layout.tsx perfectly, check substrings.");
}
