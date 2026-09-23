import re
with open('src/pages/Community.tsx', 'r') as f:
    text = f.read()

text = text.replace(
    '</button>\n          </div>\n          \n          <InstallAppButton />',
    '</button>\n            <InstallAppButton />\n          </div>'
)

with open('src/pages/Community.tsx', 'w') as f:
    f.write(text)
