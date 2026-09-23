with open("src/pages/Campus.tsx", "r") as f:
    lines = f.readlines()

for i in range(len(lines)-1, -1, -1):
    if "</div>;}" in lines[i]:
        lines[i] = lines[i].replace("</div>;}", "</div>\n  );\n}")
        break

with open("src/pages/Campus.tsx", "w") as f:
    f.writelines(lines)
