import re

with open('src/components/AdminStatusRow.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';", "import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';")

# 2. Add progress state
if "const [uploadProgress, setUploadProgress] = useState(0);" not in content:
    content = content.replace("const [isUploading, setIsUploading] = useState(false);", "const [isUploading, setIsUploading] = useState(false);\n  const [uploadProgress, setUploadProgress] = useState(0);")

# 3. Update handleFileSelect
old_upload = """    setIsUploading(true);
    try {
      const fileRef = ref(storage, `admin_statuses/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      await addDoc(collection(db, 'admin_statuses'), {
        imageUrl: url,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        createdAt: serverTimestamp(),
        authorId: user.uid
      });
      toast.success("Status posted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload status");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }"""

new_upload = """    // Max size 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File is too large (max 50MB)");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const fileRef = ref(storage, `admin_statuses/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error(error);
          toast.error("Failed to upload status");
          setIsUploading(false);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'admin_statuses'), {
              imageUrl: url,
              type: file.type.startsWith('video/') ? 'video' : 'image',
              createdAt: serverTimestamp(),
              authorId: user.uid
            });
            toast.success("Status posted!");
          } catch (e) {
             toast.error("Failed to save status");
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload status");
      setIsUploading(false);
    }"""
content = content.replace(old_upload, new_upload)

# 4. Update the spinner to show progress
old_spinner = """{isUploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : ("""

new_spinner = """{isUploading ? (
              <div className="flex flex-col items-center justify-center absolute inset-0 bg-white/80 rounded-full z-10">
                <div className="text-[10px] font-bold text-blue-600">{Math.round(uploadProgress)}%</div>
                <div className="w-8 h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
                   <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : ("""

content = content.replace(old_spinner, new_spinner)

with open('src/components/AdminStatusRow.tsx', 'w') as f:
    f.write(content)
