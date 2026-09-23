import re

with open("src/components/InstallAppButton.tsx", "r") as f:
    content = f.read()

content = content.replace("window.alert(", "toast.success(")
content = content.replace("import { usePWA } from '../hooks/usePWA';", "import { usePWA } from '../hooks/usePWA';\nimport toast from 'react-hot-toast';")
content = content.replace("toast.success(\"To install the app on iOS", "toast(\"To install the app on iOS", 1)
content = content.replace("toast.success(\"To install the app, please use", "toast(\"To install the app, please use", 1)

with open("src/components/InstallAppButton.tsx", "w") as f:
    f.write(content)

