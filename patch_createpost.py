import re

with open("src/components/CreatePostModal.tsx", "r") as f:
    content = f.read()

# Add maxLength to textarea
old_textarea = """          <textarea
            className="w-full h-32 resize-none outline-none text-gray-800 dark:text-slate-200 placeholder-gray-400 text-lg"
            placeholder="What do you want to share with the community?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>"""

new_textarea = """          <textarea
            className="w-full h-32 resize-none outline-none text-gray-800 dark:text-slate-200 placeholder-gray-400 text-lg bg-transparent"
            placeholder="What do you want to share with the community?"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <div className="text-right text-xs text-gray-400 font-medium">
            {text.length}/1000
          </div>"""

if old_textarea in content:
    content = content.replace(old_textarea, new_textarea)
    with open("src/components/CreatePostModal.tsx", "w") as f:
        f.write(content)
    print("Patched CreatePostModal.tsx textarea")
else:
    print("Could not find textarea to patch")
