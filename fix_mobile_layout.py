import re

with open('src/components/PrivateStudyGroups.tsx', 'r') as f:
    content = f.read()

target = """    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[600px] h-[calc(100vh-140px)] max-h-[800px]">"""
replacement = """    return (
      <div className="bg-white md:rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row md:min-h-[600px] h-[100dvh] md:h-[calc(100vh-140px)] md:max-h-[800px] fixed md:relative inset-0 z-50 md:z-auto">"""

if target in content:
    content = content.replace(target, replacement)

with open('src/components/PrivateStudyGroups.tsx', 'w') as f:
    f.write(content)
