import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Wrapper
old1 = """<div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>"""
new1 = """<div key={msg.id} className={cn("flex flex-col max-w-[85%] min-w-0", isMe ? "ml-auto items-end" : "mr-auto items-start")}>"""
content = content.replace(old1, new1)

# 2. inner gap-2
old2 = """<div className="flex items-end gap-2 group relative max-w-full">"""
new2 = """<div className="flex items-end gap-2 group relative max-w-full min-w-0 w-full justify-end">"""
# Wait, for isMe it should be justify-end, for !isMe justify-start?
# Actually, since it's inside items-end or items-start, w-full with justify is not strictly needed if we use min-w-0.
# Let's just do:
new2 = """<div className="flex items-end gap-2 group relative max-w-full min-w-0">"""
content = content.replace(old2, new2)

# 3. gap-1 container
old3 = """<div className={cn("flex flex-col gap-1 relative", isMe ? "items-end" : "items-start")}>"""
new3 = """<div className={cn("flex flex-col gap-1 relative min-w-0 max-w-full", isMe ? "items-end" : "items-start")}>"""
content = content.replace(old3, new3)

# 4. the bubble itself
old4 = """className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full break-words flex flex-col gap-0.5 cursor-pointer md:cursor-default","""
new4 = """className={cn("px-4 py-2.5 rounded-[20px] relative z-10 shadow-sm text-[15px] max-w-full min-w-0 break-words flex flex-col gap-0.5 cursor-pointer md:cursor-default","""
content = content.replace(old4, new4)

# 5. the text
old5 = """{msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</div>}"""
new5 = """{msg.text && <div className="leading-relaxed whitespace-pre-wrap break-words break-all min-w-0 max-w-full" style={{ wordBreak: 'break-word' }}>{msg.text}</div>}"""
content = content.replace(old5, new5)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
print("Min-w-0 patched!")
