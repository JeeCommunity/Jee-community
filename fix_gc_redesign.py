import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

# Replace the activeGroup block completely
active_group_start = "if (activeGroup) {"
active_group_end_pattern = r"    \);\n  \}\n\n  return \(\n    <div className=\"bg-white rounded-\[20px\] p-6"

match = re.search(active_group_end_pattern, content)
if not match:
    print("Could not find end of activeGroup block")
    exit(1)

# I'll create a new file and just overwrite it using python to ensure safety
