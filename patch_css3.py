with open("src/index.css", "r") as f:
    content = f.read()

import re
content = re.sub(r"@keyframes dogWalk\s*\{[^}]+\}", "", content)

with open("src/index.css", "w") as f:
    f.write(content)
