with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

start = content.find('{/* Main Banner */}')
end = content.find('{/* Today\'s Goals Accordion */}')
print(content[start:end])
