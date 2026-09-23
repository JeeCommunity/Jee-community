import re

with open('src/components/AdminStatusRow.tsx', 'r') as f:
    content = f.read()

# 1. Update handleReply to log error
old_reply = """      if (type === 'text') {
        setReplyText('');
        toast.success("Reply sent!");
      } else {
        toast.success("Reaction sent!");
      }
    } catch (e) {
      toast.error("Failed to send reply");
    }"""

new_reply = """      if (type === 'text') {
        setReplyText('');
        toast.success("Reply sent!");
      } else {
        toast.success("Reaction sent!");
      }
    } catch (e: any) {
      console.error("Reply error:", e);
      toast.error("Failed to send reply: " + (e.message || ''));
    }"""
content = content.replace(old_reply, new_reply)

# Let's fix the profile?.name
content = content.replace("senderName: profile?.name || 'User',", "senderName: profile?.fullName || 'User',")

# 2. Fix the video progress bar
# Let's completely rewrite the Status Viewer AnimatePresence block
