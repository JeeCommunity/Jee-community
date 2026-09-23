import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Fix imports
target1 = """import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Pin, Reply, X, Clock, Play, Settings, Pencil } from 'lucide-react';"""
replacement1 = """import { Users, Plus, KeyRound, LogOut, ArrowLeft, Loader2, Copy, Home, MessageSquare, Paperclip, Image as ImageIcon, FileText, Send, MoreVertical, Pin, Reply, X, Clock, Play, Settings, Pencil, Trash2 } from 'lucide-react';"""
if target1 in content:
    content = content.replace(target1, replacement1)

# Fix useRef and add state variables
target2 = """  const [typingUsers, setTypingUsers] = useState<{name: string, uid: string, timestamp: number}[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();"""
replacement2 = """  const [typingUsers, setTypingUsers] = useState<{name: string, uid: string, timestamp: number}[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");"""
if target2 in content:
    content = content.replace(target2, replacement2)

# Fix HTMLInputElement
target3 = """const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {"""
replacement3 = """const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {"""
if target3 in content:
    content = content.replace(target3, replacement3)

# Add handleDeleteMessage
target4 = """  const handlePinMessage = async (msgId: string) => {"""
replacement4 = """  const handleDeleteMessage = async (msgId: string) => {
    if (!activeGroup || !user) return;
    try {
      await deleteDoc(doc(db, 'study_groups', activeGroup.id, 'messages', msgId));
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handlePinMessage = async (msgId: string) => {"""
if target4 in content:
    content = content.replace(target4, replacement4)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
