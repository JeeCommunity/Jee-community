with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

start = content.find('{/* Active Students List */}')
end = content.find('{selectedUserForProfile && (')
print(content[start:start+1500])
