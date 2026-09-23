with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

import re

old_block = """      {/* Background Video */}
      <video 
        src="/nit_arunachal_video.mp4?v=4"
        autoPlay
        loop
        playsInline
        controls
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onError={(e) => console.error("Video failed to load:", e)}
      />"""

new_block = """      {/* Background Video */}
      <video 
        src="/nit_arunachal_video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-fill bg-black"
      />"""

content = content.replace(old_block, new_block)

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
