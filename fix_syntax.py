with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

import re
# We want to remove:
#   return () => {
#      window.speechSynthesis.cancel();
#      audio.pause();
#      audio.currentTime = 0;
#    };
#  }, [college]);
content = re.sub(r"  return \(\) => \{.*?  \}, \[college\]\);", "", content, flags=re.DOTALL)

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
