import re

with open("src/pages/AdminDashboard.tsx", "r") as f:
    content = f.read()

# 1. Add handleBlockGroup logic near handleDeleteGroup
block_logic = """
  const handleBlockGroup = (groupId: string, isCurrentlyBlocked: boolean) => {
    setShowConfirmModal({
      isOpen: true,
      title: isCurrentlyBlocked ? 'Unblock Study Group' : 'Block Study Group',
      message: isCurrentlyBlocked ? 'Are you sure you want to unblock this group? Members will be able to chat again.' : 'Are you sure you want to block this group? Members will be temporarily restricted from chatting.',
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "study_groups", groupId), { isBlocked: !isCurrentlyBlocked });
          setStudyGroups(prev => prev.map(g => g.id === groupId ? { ...g, isBlocked: !isCurrentlyBlocked } : g));
          toast.success(isCurrentlyBlocked ? "Study group unblocked." : "Study group blocked.");
        } catch (e) {
          console.error(e);
          toast.error("Error updating group status.");
        }
        setShowConfirmModal(null);
      }
    });
  };
"""

content = content.replace("const handleDeleteGroup = (groupId: string) => {", block_logic + "\n  const handleDeleteGroup = (groupId: string) => {")

# 2. Add Block/Unblock button in UI
ui_target = """<button 
                        onClick={() => handleDeleteGroup(group.id)}"""
ui_replacement = """<button 
                        onClick={() => handleBlockGroup(group.id, !!group.isBlocked)}
                        className={cn("px-3 py-2 rounded-xl transition-colors", group.isBlocked ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300")}
                        title={group.isBlocked ? "Unblock Group" : "Block Group"}
                      >
                        {group.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group.id)}"""

content = content.replace(ui_target, ui_replacement)

with open("src/pages/AdminDashboard.tsx", "w") as f:
    f.write(content)

print("Patched AdminDashboard.tsx")
