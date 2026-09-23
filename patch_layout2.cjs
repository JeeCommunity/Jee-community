const fs = require('fs');

let file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('StickyNote')) {
  code = code.replace(
    `Library, Trash2, CalendarDays, ExternalLink`,
    `Library, Trash2, CalendarDays, ExternalLink, StickyNote`
  );
}

const desktopMyNotesLink = `
              <Link
                to="/my-notes"
                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 relative shrink-0 font-medium"
                title="My Notes"
              >
                <StickyNote className="w-5 h-5" />
                <span className="hidden lg:inline">My Notes</span>
              </Link>
              <Link`;

const mobileMyNotesLink = `<Link to="/my-notes" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-3 py-3 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium transition-colors">
                  <StickyNote className="w-5 h-5" />
                  <span>My Notes</span>
                </Link>
                <Link to="/study-room"`;

if (!code.includes('to="/my-notes"')) {
  code = code.replace(`</Link>
              <Link 
                to="/study-room"`, `</Link>` + desktopMyNotesLink + ` 
                to="/study-room"`);
                
  code = code.replace(`<Link to="/study-room"`, mobileMyNotesLink);
  
  fs.writeFileSync(file, code);
  console.log("Patched Layout.tsx successfully");
} else {
  console.log("Already patched");
}
