import fs from 'fs';
let code = fs.readFileSync('src/components/PrivateStudyGroups.tsx', 'utf8');

code = code.replace(
  "import { ShieldAlert, Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Video, Palette, ChevronDown, Pin, Reply, X, Clock, Play, Settings, Pencil, Trash2, Lock } from 'lucide-react';",
  "import { ShieldAlert, Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Video, Palette, ChevronDown, Pin, Reply, X, Clock, Play, Settings, Pencil, Trash2, Lock } from 'lucide-react';\nimport { useNavigate } from 'react-router-dom';"
);

code = code.replace(
  "  const { user, profile } = useAuth();",
  "  const { user, profile } = useAuth();\n  const navigate = useNavigate();"
);

code = code.replace(
  "window.open(`/whiteboard/${activeGroup.id}`, '_blank')",
  "navigate(`/whiteboard/${activeGroup.id}`)"
);

fs.writeFileSync('src/components/PrivateStudyGroups.tsx', code);
console.log("Patched PrivateStudyGroups");
