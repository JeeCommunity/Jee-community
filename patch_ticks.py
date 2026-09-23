import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

target = r"\{msg\.createdAt\?\.toDate \? msg\.createdAt\.toDate\(\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\) : ''\}"
replacement = """{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                      {isMe && (
                                                          msg.readBy?.length > 1 
                                                            ? <CheckCheck className="w-3.5 h-3.5 text-cyan-300 ml-0.5" /> 
                                                            : <Check className="w-3 h-3 opacity-70 ml-0.5" />
                                                      )}"""

content = re.sub(target, replacement, content)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
