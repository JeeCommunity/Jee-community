import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_str = "const isGoalCompleted = g.completed;"
new_str = "const isGoalCompleted = g.status === 'completed';"

content = content.replace(old_str, new_str)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

print("Patched isGoalCompleted")
