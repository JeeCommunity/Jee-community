import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Fix 1: useRef argument
content = content.replace(
    'const typingTimeoutRef = useRef<NodeJS.Timeout>();',
    'const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);'
)

# Fix 2: import deleteDoc
if 'deleteDoc' not in content.split('from \'firebase/firestore\'')[0]:
    content = content.replace(
        'addDoc } from \'firebase/firestore\';',
        'addDoc, deleteDoc } from \'firebase/firestore\';'
    )

# Fix 3: ChangeEvent
content = content.replace(
    'const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {',
    'const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {'
)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

