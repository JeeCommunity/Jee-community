import re

with open("src/lib/campusEconomy.ts", "r") as f:
    content = f.read()

colleges_match = re.search(r'export const COLLEGES = \[(.*?)\];', content, re.DOTALL)
if colleges_match:
    colleges_str = colleges_match.group(1)
    # Extract each college dict
    colleges = re.findall(r'\{.*?\}', colleges_str)
    
    # We want to reverse the order of names/types, but keep ids 1 to 54.
    # Current: id: 1 is NIT Arunachal, ..., id: 54 is IIT Bombay
    # We reverse the list
    colleges.reverse()
    
    # Reassign ids
    new_colleges_str = "\n"
    for i, col in enumerate(colleges):
        # find name and type
        name = re.search(r'name:\s*"([^"]+)"', col).group(1)
        ctype = re.search(r'type:\s*"([^"]+)"', col).group(1)
        new_colleges_str += f'  {{ id: {i+1}, name: "{name}", type: "{ctype}" }},\n'
    
    new_content = content[:colleges_match.start()] + f"export const COLLEGES = [{new_colleges_str}];" + content[colleges_match.end():]
    
    with open("src/lib/campusEconomy.ts", "w") as f:
        f.write(new_content)
    print("Colleges reversed successfully.")
else:
    print("Could not find COLLEGES array.")

