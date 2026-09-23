import re
with open('src/components/Layout.tsx', 'r') as f:
    text = f.read()

text = text.replace(r"if (outcome === \'accepted\')", "if (outcome === 'accepted')")
text = text.replace(r"app \'JEE Community\' will", "app 'JEE Community' will")

with open('src/components/Layout.tsx', 'w') as f:
    f.write(text)
