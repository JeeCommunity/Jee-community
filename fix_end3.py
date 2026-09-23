with open("src/pages/Campus.tsx", "r") as f:
    text = f.read()

import re
text = re.sub(r'</div>;}$', '</div>\n  );\n}', text.strip())

with open("src/pages/Campus.tsx", "w") as f:
    f.write(text)
