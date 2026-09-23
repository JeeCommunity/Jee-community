import re

def try_replace(filename, replacements):
    with open(filename, 'r') as f:
        content = f.read()
    
    modified = False
    for i, (t, r) in enumerate(replacements):
        if t in content:
            content = content.replace(t, r)
            modified = True
            print(f"Replaced {i} in {filename}")
        else:
            print(f"Failed to find {i} in {filename}")
            
    if modified:
        with open(filename, 'w') as f:
            f.write(content)

# We will just rewrite the python scripts to use regex or be more loose with whitespace.
