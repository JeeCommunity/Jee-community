import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# Replace both occurrences of the filter
content = content.replace('.filter((m: any) => m.fullName !== "Unknown User")', '')

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
