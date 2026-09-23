import re

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

# Remove the badge from the banner
start_idx = content.find('{/* Main Banner */}')
end_idx = content.find('{/* Today\'s Goals Accordion */}')

if start_idx != -1 and end_idx != -1:
    banner = content[start_idx:end_idx]
    
    # We want to remove the badge that shows "Live Session Active" or "Session Paused"
    badge_start = banner.find('<div className="inline-flex items-center justify-center gap-2 bg-blue-500/30')
    badge_end = banner.find('</div>', badge_start) + 6
    
    if badge_start != -1 and badge_end != -1:
        # Actually, let's just make it only show when studying.
        # So we wrap it in {mySession?.isStudying && ( ... )}
        badge_content = banner[badge_start:badge_end]
        
        # Or just remove it completely? The user said "session paused lik diye usko hata do". 
        # I'll just remove the whole badge.
        new_banner = banner[:badge_start] + banner[badge_end:]
        
        content = content[:start_idx] + new_banner + content[end_idx:]
        
        with open('src/pages/LiveStudy.tsx', 'w') as f:
            f.write(content)
        print("Removed badge from banner")
    else:
        print("Could not find badge in banner")
else:
    print("Could not find banner")

