with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

start = content.find('const handleStop = async (uidToStop?: string) => {')
end = content.find('await updateDoc(ref, updatePayload);', start)
print(content[start:start+200])
