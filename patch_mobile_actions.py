import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Add state
state_match = r'  const \[editingMessageId, setEditingMessageId\] = useState<string \| null>\(null\);'
new_state = """  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);"""
content = re.sub(state_match, new_state, content, count=1)

# Add onClick to bubble
bubble_match = r'drag="x"'
new_bubble = 'onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}\n                                            drag="x"'
content = re.sub(bubble_match, new_bubble, content, count=1)

# Modify Quick Actions
old_quick = r'className=\{cn\("hidden group-hover:flex items-center gap-1 absolute top-1/2 -translate-y-1/2 z-20", isMe \? "right-full mr-3" : "left-full ml-3"\)\}'
new_quick = r'className={cn("items-center gap-1 absolute top-1/2 -translate-y-1/2 z-20 transition-all", activeMessageId === msg.id ? "flex" : "hidden md:group-hover:flex", isMe ? "right-full mr-3" : "left-full ml-3")}'
content = re.sub(old_quick, new_quick, content, count=1)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
