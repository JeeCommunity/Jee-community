import re
with open("index.html", "r") as f:
    content = f.read()

replacement = """    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="JEE Comm" />
    <link rel="manifest" href="/manifest.json" />"""

new_content = re.sub(r'    <link rel="icon" type="image/svg\+xml" href="/favicon.svg" />\s*<link rel="manifest" href="/manifest.json" />', replacement, content)

with open("index.html", "w") as f:
    f.write(new_content)
