import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

old_drag = """  const handleDragEnd = (event: any, info: any, msg: any, isMe: boolean) => {
     const threshold = 50;
     if (isMe && info.offset.x < -threshold) {
         setReplyingTo(msg);
     } else if (!isMe && info.offset.x > threshold) {
         setReplyingTo(msg);
     }
  };"""

new_drag = """  const handleDragEnd = (event: any, info: any, msg: any, isMe: boolean) => {
     const threshold = 50;
     if (Math.abs(info.offset.x) > threshold) {
         setReplyingTo(msg);
     }
  };"""

content = content.replace(old_drag, new_drag)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
