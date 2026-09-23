with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

content = content.replace('src="/nit_arunachal_video.mp4"', 'src="/nit_arunachal_video.mp4?v=2"')

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
