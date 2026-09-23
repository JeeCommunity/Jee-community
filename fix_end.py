with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

if content.endswith("    </div>;}"):
    content = content[:-10] + "    </div>\n  );\n}"
else:
    content = content.replace("    </div>;}", "    </div>\n  );\n}")

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
