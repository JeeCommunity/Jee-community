import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Add fetchedUsers state
state_block = """  const [messages, setMessages] = useState<any[]>([]);"""
new_state_block = """  const [messages, setMessages] = useState<any[]>([]);
  const [fetchedUsers, setFetchedUsers] = useState<Record<string, any>>({});
  const [isUploading, setIsUploading] = useState(false);"""
content = content.replace(state_block, new_state_block)

# 2. Add effect to fetch users
effect_block = """  // Load messages when group selected
  useEffect(() => {
    if (!activeGroup) return;"""

new_effect_block = """  // Load messages and members when group selected
  useEffect(() => {
    if (!activeGroup) return;
    
    const fetchMembers = async () => {
       const newUsers = { ...fetchedUsers };
       let updated = false;
       for (const mId of activeGroup.members || []) {
           if (!newUsers[mId] && !usersData[mId]) {
               try {
                   const d = await getDoc(doc(db, 'users', mId));
                   if (d.exists()) {
                       newUsers[mId] = d.data();
                       updated = true;
                   }
               } catch(e) {}
           }
       }
       if (updated) setFetchedUsers(newUsers);
    };
    fetchMembers();
"""
content = content.replace(effect_block, new_effect_block)

# 3. Update groupMembers mapping
map_block = """    const groupMembers = activeGroup.members.map((memberId: string) => {
      const session = sessions.find((s: any) => s.id === memberId) || { id: memberId, isStudying: false, goals: [] };
      const uData = usersData[memberId] || {};"""

new_map_block = """    const groupMembers = activeGroup.members.map((memberId: string) => {
      const session = sessions.find((s: any) => s.id === memberId) || { id: memberId, isStudying: false, goals: [] };
      const uData = fetchedUsers[memberId] || usersData[memberId] || {};"""
content = content.replace(map_block, new_map_block)


# 4. Implement handleFileClick
file_click_block = """  const handleFileClick = () => {
     toast("File uploads require Firebase Storage configuration.", { icon: '📎' });
  };"""

new_file_click_block = """  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileClick = () => {
     fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          return;
      }
      
      setIsUploading(true);
      const loadingToast = toast.loading("Uploading file...");
      
      try {
          const fileUrl = await uploadFileToCloudinary(file);
          
          await addDoc(collection(db, 'study_groups', activeGroup.id, 'messages'), {
             text: file.name,
             fileUrl: fileUrl,
             fileName: file.name,
             fileType: file.type,
             senderId: user?.uid,
             senderName: profile?.fullName || "Anonymous",
             senderPhoto: profile?.photoURL || null,
             createdAt: serverTimestamp()
          });
          
          toast.success("File sent!");
      } catch(error) {
          console.error("Upload error:", error);
          toast.error("Failed to upload file");
      } finally {
          setIsUploading(false);
          toast.dismiss(loadingToast);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };"""
content = content.replace(file_click_block, new_file_click_block)

# 5. Make sure addDoc is imported
if "addDoc" not in content:
    content = content.replace("import { uploadFileToCloudinary", "import { addDoc } from 'firebase/firestore';\nimport { uploadFileToCloudinary")


# 6. Make sure to render the hidden file input
form_start_block = """                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">"""
new_form_start_block = """                       <form onSubmit={handleSendMessage} className="flex items-end gap-2 relative z-10">
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />"""
content = content.replace(form_start_block, new_form_start_block)


with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
