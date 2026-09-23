import re

with open("src/components/PrivateStudyGroups.tsx", "r") as f:
    content = f.read()

# 1. Add state for showing the FAB
state_block = """  const [replyingTo, setReplyingTo] = useState<any>(null);"""
new_state_block = """  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);"""
content = content.replace(state_block, new_state_block)

# 2. Update handleScroll to set showScrollBottom
scroll_block = """  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      shouldAutoScrollRef.current = true;
    } else {
      shouldAutoScrollRef.current = false;
    }
  };"""
new_scroll_block = """  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
      shouldAutoScrollRef.current = true;
      setShowScrollBottom(false);
    } else {
      shouldAutoScrollRef.current = false;
      setShowScrollBottom(true);
    }
  };
  
  const scrollToBottom = () => {
      if (chatScrollContainerRef.current) {
          chatScrollContainerRef.current.scrollTo({
              top: chatScrollContainerRef.current.scrollHeight,
              behavior: 'smooth'
          });
      }
  };"""
content = content.replace(scroll_block, new_scroll_block)

# 3. Add FAB UI inside the chat area
chat_area_block = """                       <div ref={chatEndRef} className="h-4" />
                    </div>"""
new_chat_area_block = """                       <div ref={chatEndRef} className="h-4" />
                    </div>
                    {showScrollBottom && (
                        <button 
                            onClick={scrollToBottom}
                            className="absolute bottom-20 right-4 md:right-8 w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center shadow-md hover:bg-slate-50 transition-all z-20"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    )}"""
content = content.replace(chat_area_block, new_chat_area_block)

with open("src/components/PrivateStudyGroups.tsx", "w") as f:
    f.write(content)
