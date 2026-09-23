with open("src/index.css", "r") as f:
    content = f.read()

import re

# Remove the keyframes dogWalk
content = re.sub(r"@keyframes dogWalk\s*\{\s*0%\s*\{\s*transform:\s*translateX\(-100%\);\s*\}\s*100%\s*\{\s*transform:\s*translateX\(100vw\);\s*\}\s*\}", "", content)

with open("src/index.css", "w") as f:
    f.write(content)
