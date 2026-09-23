import re

with open('firestore.rules', 'r') as f:
    content = f.read()

old_rules = """      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
        allow delete: if request.auth != null;
      }"""

new_rules = """      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
        allow delete: if request.auth != null;
      }
      match /typing/{uid} {
        allow read, write: if request.auth != null;
      }"""

content = content.replace(old_rules, new_rules)

with open('firestore.rules', 'w') as f:
    f.write(content)

