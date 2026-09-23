import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_complete = 'onClick={() => updateGoalStatus(g.id, "completed")}'
new_complete = 'onClick={() => updateGoalStatus(g.id, g.status === "completed" ? "pending" : "completed")}'

old_failed = 'onClick={() => updateGoalStatus(g.id, "failed")}'
new_failed = 'onClick={() => updateGoalStatus(g.id, g.status === "failed" ? "pending" : "failed")}'

content = content.replace(old_complete, new_complete)
content = content.replace(old_failed, new_failed)

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

print("Patched undo")
