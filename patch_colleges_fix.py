import re

with open("src/lib/campusEconomy.ts", "r") as f:
    content = f.read()

colleges_match = re.search(r'export const COLLEGES = \[(.*?)\];', content, re.DOTALL)
if colleges_match:
    # Right now, id: 1 is IIT Bombay, id: 54 is NIT Arunachal.
    # We need to reverse it back so id: 1 is NIT Arunachal (easiest)
    colleges_str = colleges_match.group(1)
    colleges = re.findall(r'\{.*?\}', colleges_str)
    colleges.reverse()
    
    new_colleges_str = "\n"
    for i, col in enumerate(colleges):
        name = re.search(r'name:\s*"([^"]+)"', col).group(1)
        ctype = re.search(r'type:\s*"([^"]+)"', col).group(1)
        # progression id goes 1 to 54 (easiest to hardest)
        # display rank goes 54 to 1
        rank = 54 - i
        new_colleges_str += f'  {{ id: {i+1}, rank: {rank}, name: "{name}", type: "{ctype}" }},\n'
    
    new_content = content[:colleges_match.start()] + f"export const COLLEGES = [{new_colleges_str}];" + content[colleges_match.end():]
    
    with open("src/lib/campusEconomy.ts", "w") as f:
        f.write(new_content)
    print("Colleges fixed successfully.")
