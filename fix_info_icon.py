import sys

with open('src/pages/LiveStudy.tsx', 'r') as f:
    content = f.read()

target = """  Crown, Flame, ChevronDown, ChevronUp } from "lucide-react";"""
replacement = """  Crown, Flame, ChevronDown, ChevronUp, Info } from "lucide-react";"""

if target in content:
    content = content.replace(target, replacement)
    print("Added Info icon!")

with open('src/pages/LiveStudy.tsx', 'w') as f:
    f.write(content)

