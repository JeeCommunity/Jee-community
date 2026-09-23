import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Replace the highlightToxicWords function completely
old_func_pattern = re.compile(r"const highlightToxicWords = .*?return text;\n  }\n};", re.DOTALL)
new_func = """const highlightToxicWords = (text: string, toxicWords?: string[], isAdmin?: boolean) => {
  if (!isAdmin || !toxicWords || toxicWords.length === 0 || !text) return text;
  
  try {
    const escapedWords = toxicWords.map(w => w.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));
    const regex = new RegExp('(' + escapedWords.join('|') + ')', 'gi');
    
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => {
          const isToxic = toxicWords.some(w => w.toLowerCase() === part.toLowerCase());
          if (isToxic) {
            return <span key={i} className="text-red-600 bg-red-100 px-1 rounded mx-[1px] font-bold border border-red-200">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  } catch (e) {
    return text;
  }
};"""

content = old_func_pattern.sub(new_func, content, count=1)

# 2. Add isAdmin definition
if "const isAdmin = user?.email ===" not in content:
    content = content.replace(
        "const { user, profile } = useAuth();",
        "const { user, profile } = useAuth();\n  const isAdmin = user?.email === 'aistoryimage1999@gmail.com' || profile?.role === 'admin';"
    )

# 3. Pass isAdmin to highlightToxicWords
content = content.replace(
    "{highlightToxicWords(msg.text, msg.toxicWords)}",
    "{highlightToxicWords(msg.text, msg.toxicWords, isAdmin)}"
)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)

print("Patch applied")
