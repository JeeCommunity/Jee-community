with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

import re
content = re.sub(r"  useEffect\(\(\) => \{\n    // Video handles audio and animation for NIT Arunachal Pradesh\n    ", "", content, flags=re.DOTALL)

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
