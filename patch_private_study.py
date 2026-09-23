import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# Add missing imports for file upload and user fetching
imports = """import { uploadFileToCloudinary } from '../lib/cloudinary';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';"""

if "uploadFileToCloudinary" not in content:
    content = content.replace('import { useAuth } from "../AuthContext";', imports + '\nimport { useAuth } from "../AuthContext";')

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
