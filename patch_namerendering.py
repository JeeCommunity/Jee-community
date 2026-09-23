with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Replace userName with fullName
content = content.replace('...(usersData[s.id] || { userName: "Unknown User", userClass: "N/A", userState: "N/A" })', 
                         '...(usersData[s.id] || { fullName: "Unknown User", userClass: "N/A", userState: "N/A" })')

content = content.replace('{getFirstName(s.userName)}', '{getFirstName(s.fullName || s.userName || "Unknown User")}')
content = content.replace('{s.userPhoto ? <img src={s.userPhoto} alt={s.userName} className="w-full h-full object-cover" /> : getFirstName(s.userName).charAt(0).toUpperCase()}', 
                          '{(s.photoURL || s.userPhoto) ? <img src={s.photoURL || s.userPhoto} alt={s.fullName || s.userName} className="w-full h-full object-cover" /> : getFirstName(s.fullName || s.userName || "Unknown User").charAt(0).toUpperCase()}')

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

print("Patched names")
