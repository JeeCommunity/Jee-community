with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

old_block = """      {/* Background Video */}
      <video 
        src="/nit_arunachal_video.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-fill bg-black"
      />"""

new_block = """      {/* Background Video */}
      <video 
        src="/nit_arunachal_new.mp4"
        autoPlay
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover bg-black"
      />"""

content = content.replace(old_block, new_block)

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
