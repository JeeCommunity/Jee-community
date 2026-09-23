import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# Add firebase storage imports
if "import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';" not in content:
    content = content.replace("import { db } from '../firebase';", "import { db, storage } from '../firebase';\nimport { ref, uploadBytes, getDownloadURL } from 'firebase/storage';")

if "import { storage } from '../firebase';" not in content and "import { db, storage } from '../firebase';" not in content:
    content = content.replace("import { db } from '../firebase';", "import { db, storage } from '../firebase';")

# Add ChevronDown
if "ChevronDown" not in content and "lucide-react" in content:
    content = content.replace("MoreVertical", "MoreVertical, ChevronDown")

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
