with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

content = content.replace(
    r"const escapedWords = toxicWords.map(w => w.replace(/[.*+?^${}()|[]]/g, '$&'));",
    r"const escapedWords = toxicWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));"
)

# wait let's just replace the whole try block again using safe methods
import re

old_block = re.search(r"try \{\n    const escapedWords =.*?\n    const regex = new RegExp", content, re.DOTALL).group(0)

new_block = r"""try {
    const escapedWords = toxicWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp"""

content = content.replace(old_block, new_block)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
