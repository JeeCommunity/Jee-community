with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

imports = """import { cn, getFirstName, getLocalDate } from '../lib/utils';
import { resolveSessionState } from '../lib/sessionUtils';"""
content = content.replace("import { cn, getFirstName } from '../lib/utils';", imports)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)

print("Imports fixed.")
