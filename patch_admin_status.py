import re

with open('src/components/AdminStatusRow.tsx', 'r') as f:
    content = f.read()

# 1. Update accept attribute
content = content.replace('accept="image/*"', 'accept="image/*,video/*"')

# 2. Add type to addDoc
old_adddoc = """      await addDoc(collection(db, 'admin_statuses'), {
        imageUrl: url,
        createdAt: serverTimestamp(),
        authorId: user.uid
      });"""

new_adddoc = """      await addDoc(collection(db, 'admin_statuses'), {
        imageUrl: url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        createdAt: serverTimestamp(),
        authorId: user.uid
      });"""
content = content.replace(old_adddoc, new_adddoc)

# 3. Update thumbnail
old_thumbnail = """<img src={status.imageUrl} alt="Status" className="w-full h-full rounded-full object-cover border-2 border-white" />"""
new_thumbnail = """{status.type === 'video' ? (
              <video src={status.imageUrl} className="w-full h-full rounded-full object-cover border-2 border-white" muted playsInline />
            ) : (
              <img src={status.imageUrl} alt="Status" className="w-full h-full rounded-full object-cover border-2 border-white" />
            )}"""
content = content.replace(old_thumbnail, new_thumbnail)

# 4. Update viewer
old_viewer = """<img 
                src={statuses[activeStatusIndex].imageUrl} 
                alt="Status" 
                className="max-w-full max-h-full object-contain" 
              />"""
new_viewer = """{statuses[activeStatusIndex].type === 'video' ? (
                <video 
                  src={statuses[activeStatusIndex].imageUrl} 
                  autoPlay 
                  playsInline
                  controls
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <img 
                  src={statuses[activeStatusIndex].imageUrl} 
                  alt="Status" 
                  className="max-w-full max-h-full object-contain" 
                />
              )}"""
content = content.replace(old_viewer, new_viewer)

# 5. Update transition duration
old_transition = "transition={idx === activeStatusIndex ? { duration: 5, ease: 'linear' } : { duration: 0 }}"
new_transition = "transition={idx === activeStatusIndex ? { duration: statuses[activeStatusIndex]?.type === 'video' ? 15 : 5, ease: 'linear' } : { duration: 0 }}"
content = content.replace(old_transition, new_transition)

with open('src/components/AdminStatusRow.tsx', 'w') as f:
    f.write(content)
