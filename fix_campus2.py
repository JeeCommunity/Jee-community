with open("src/pages/Campus.tsx", "r") as f:
    content = f.read()

# Fix the useMemo blocks
content = content.replace("return liveCoins + Math.max(0, addedLiveCoins);\n  }, [mySession, liveCoins, now]);", "return campusStats.totalCoins + Math.max(0, addedLiveCoins);\n  }, [mySession, campusStats.totalCoins, now]);")
content = content.replace("if (!mySession) return liveCoins;", "if (!mySession) return campusStats.totalCoins;")

content = content.replace("return liveXP + Math.max(0, addedLiveXP);\n  }, [mySession, liveXP, now]);", "return campusStats.totalXP + Math.max(0, addedLiveXP);\n  }, [mySession, campusStats.totalXP, now]);")
content = content.replace("if (!mySession) return liveXP;", "if (!mySession) return campusStats.totalXP;")

with open("src/pages/Campus.tsx", "w") as f:
    f.write(content)
