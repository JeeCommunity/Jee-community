# Clickable Links Everywhere & Admin Status Link + Caption Plan

## 1. Goal (Uddeshya)
Website me har jagah (Admin Status Story, Posts, Comments, Study Group Chat, User Profile Bio, Status Replies, Notifications, aur Notes Hub) par sabhi links (`https://`, `http://`, `www.`) ko **clickable** banana taaki koi bhi student link par click karke seedha open kar sake. Sath hi **Admin Status Story** me **Link Button** aur **Caption** add karne ka option dena.

---

## 2. Key Features (Kya-Kya Naya Hoga)

### A. Admin Status Story me Clickable Link Button + Caption
- **Status Upload Modal (`src/components/AdminStatusRow.tsx`)**:
  - Jab Admin ya Manager status ke liye photo/video select karega, ek preview modal khulega jahan wo optional **Caption Text** aur **Clickable Link URL** (jaise `https://...` ya `www....`) daal sakega.
- **Status Viewer me Clickable Button & Caption**:
  - Status dekhte waqt reply bar ke theek upar (`z-30` layer par, taaki next/prev tap overlay use block na kare) **Caption** (clickable links ke sath) aur ek bright **"Open Link ↗" Clickable Button** dikhega.
- **Migration Status Story Update (`src/lib/migrationBridge.ts`)**:
  - Nayi website wale Migration Status Story me bhi `linkUrl` aur `caption` save honge taaki status viewer me direct clickable button kaam kare.

### B. Har Jagah Automatic Clickable Links (`src/lib/linkify.tsx`)
Ek universal `LinkifyText` / `renderTextWithLinks` helper banaya jayega jo text ke andar maujood har link (`https://...`, `http://...`, `www....`) ko pehchan kar clickable `<a target="_blank" rel="noopener noreferrer">` tag me badal dega:
1. **Community Posts (`src/components/PostCard.tsx`)**: Post ke text me `http://`, `https://`, aur `www.` links clickable honge.
2. **Comments & Replies (`src/components/CommentsModal.tsx`)**: Post detail view, sabhi comments, replies, aur Inspector Chulbul messages me links clickable honge.
3. **Study Group Chat (`src/components/PrivateStudyGroups.tsx` & `src/components/AdminStudyGroupModal.tsx`)**: Group chat messages, pinned message, aur reply text me sabhi links clickable honge (chat bubble ke andar high-contrast styling ke sath).
4. **User Profile Bio (`src/components/UserProfileModal.tsx`)**: User ke profile card me unka `Bio` dikhega aur bio ke andar koi bhi link clickable hoga.
5. **Status Replies, Notifications & Notes Hub (`src/pages/StatusReplies.tsx`, `src/components/NotificationsDropdown.tsx`, `src/pages/NotesHub.tsx`)**: Status replies, notification messages, aur PDF note descriptions me bhi links clickable honge.

---

## 3. Files to Create / Update
- `src/lib/linkify.tsx` *(New)* — Universal URL parser aur clickable link renderer component.
- `src/components/AdminStatusRow.tsx` — Status upload me Caption + Link input aur Status Viewer me clickable Link Button + Caption overlay.
- `src/lib/migrationBridge.ts` — Migration status story payload me `linkUrl` aur `caption` support.
- `src/components/PostCard.tsx` — Enhanced clickable links in posts.
- `src/components/CommentsModal.tsx` — Clickable links in post detail, comments, and replies.
- `src/components/PrivateStudyGroups.tsx` & `src/components/AdminStudyGroupModal.tsx` — Clickable links in group chat messages and pinned messages.
- `src/components/UserProfileModal.tsx` — Display user Bio with clickable links.
- `src/pages/StatusReplies.tsx`, `src/components/NotificationsDropdown.tsx`, `src/pages/NotesHub.tsx` — Clickable links in status replies, notifications, and note descriptions.
