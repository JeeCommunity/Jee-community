with open("src/pages/Campus.tsx", "r") as f:
    lines = f.readlines()

with open("src/pages/Campus.tsx", "w") as f:
    for line in lines:
        if "return () => {" in line and "window.speechSynthesis.cancel();" in "".join(lines):
            continue
        if "window.speechSynthesis.cancel();" in line:
            continue
        if "audio.pause();" in line:
            continue
        if "audio.currentTime = 0;" in line:
            continue
        if "  }, [college]);" in line:
            pass # we'll see
f.close()
