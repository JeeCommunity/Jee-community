with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

import re

old_block = """      {/* Background Video */}
      <video 
        src="/nit_arunachal_video.mp4?v=2"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />"""

new_block = """      {/* Background Video */}
      <video 
        src="/nit_arunachal_video.mp4?v=3"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-fill"
        onError={(e) => console.error("Video failed to load:", e)}
      />"""

content = content.replace(old_block, new_block)

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
