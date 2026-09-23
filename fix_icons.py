import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

import_icons = """import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Pin, Reply, X, Clock, Play, Target, CheckCircle2, Circle, Settings, Pencil, Trash2, MonitorPlay, RefreshCw, LogOut as LogOutIcon, Square, Check } from 'lucide-react';"""

content = re.sub(r"import \{ Users.*?\} from 'lucide-react';", import_icons, content)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

print("Icons fixed.")
