import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# Replace Cloudinary import with Firebase Storage imports
old_import = "import { uploadFileToCloudinary } from '../lib/cloudinary';"
new_import = "import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';\nimport { storage } from '../firebase';"
content = content.replace(old_import, new_import)

# Update handleFileUpload
old_upload = """      try {
          const fileUrl = await uploadFileToCloudinary(file);
          
          await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {"""

new_upload = """      try {
          if (!storage) throw new Error("Firebase Storage is not configured");
          
          // Use Firebase Storage
          const fileRef = ref(storage, `study_groups/${activeGroup.id}/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          const fileUrl = await getDownloadURL(fileRef);
          
          await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {"""
content = content.replace(old_upload, new_upload)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
