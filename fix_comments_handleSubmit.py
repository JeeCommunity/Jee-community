import re

with open('src/components/CommentsModal.tsx', 'r') as f:
    content = f.read()

pattern2 = re.compile(r'      setImageFile\(null\);\n      \n    \} catch \(error: any\) \{', re.DOTALL)
replacement2 = """      setImageFile(null);
      await fetchComments();
      
    } catch (error: any) {"""
content = pattern2.sub(replacement2, content)

with open('src/components/CommentsModal.tsx', 'w') as f:
    f.write(content)
