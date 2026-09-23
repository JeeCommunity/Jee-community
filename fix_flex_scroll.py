import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<div className="flex-1 flex flex-col min-w-0 relative bg-white">',
    '<div className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-white">'
)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
print("Added min-h-0 to MAIN CONTENT AREA wrapper!")
