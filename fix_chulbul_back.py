import os
import re

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts") or file.endswith(".js"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                content = f.read()
            if "/chulbul.svg" in content:
                content = content.replace("/chulbul.svg", "/chulbul.png")
                with open(path, "w") as f:
                    f.write(content)
                print(f"Fixed {path} back to .png")
