import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

old_finally = """      } finally {
          setIsUploading(false);
          toast.dismiss(loadingToast);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }"""

new_finally = """      } finally {
          setIsUploading(false);
          toast.dismiss(loadingToast);
          e.target.value = '';
      }"""

if old_finally in content:
    content = content.replace(old_finally, new_finally)
    with open("src/components/PrivateStudyGroups.tsx", "w") as f:
        f.write(content)
    print("Replaced finally!")
else:
    print("Old finally not found!")
