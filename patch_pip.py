import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

old_pip = """        const stream = (canvasRef.current as any).captureStream(10);
        videoRef.current.srcObject = stream;"""

new_pip = """        const stream = (canvasRef.current as any).captureStream ? (canvasRef.current as any).captureStream(10) : null;
        if (!stream) {
           alert("Picture-in-Picture is not supported on this browser (missing captureStream).");
           return;
        }
        videoRef.current.srcObject = stream;"""

if old_pip in content:
    content = content.replace(old_pip, new_pip)
    with open('src/pages/LiveStudy.tsx', 'w') as f:
        f.write(content)
    print("Patched pip")
else:
    print("Could not patch pip")
