with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { AuthProvider } from './AuthContext';", "import { AuthProvider } from './AuthContext';\nimport { ThemeProvider } from './ThemeContext';")
content = content.replace("<BrowserRouter>\n      <AuthProvider>", "<BrowserRouter>\n      <ThemeProvider>\n      <AuthProvider>")
content = content.replace("</AuthProvider>\n    </BrowserRouter>", "</AuthProvider>\n      </ThemeProvider>\n    </BrowserRouter>")

with open('src/App.tsx', 'w') as f:
    f.write(content)
