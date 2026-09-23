import re

with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

old_img = """      <img 
        src={college.id === 1 ? "/nit_arunachal.png" : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200"}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ animation: 'droneZoom 30s ease-in-out alternate infinite' }}
        alt={college.name}
      />"""

new_video = """      {college.id === 1 ? (
        <video 
          src="/nit_arunachal_video.mp4"
          autoPlay
          loop
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: 'droneZoom 30s ease-in-out alternate infinite' }}
          alt={college.name}
        />
      )}"""

if old_img in content:
    content = content.replace(old_img, new_video)
    with open("src/pages/Campus.tsx", "w") as f:
        f.write(content)
    print("Patched!")
else:
    print("Not found!")
