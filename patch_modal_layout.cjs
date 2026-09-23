const fs = require('fs');

let file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('MyNotesAnnouncementModal')) {
    code = code.replace(
        `import NotesHubAnnouncementModal from './NotesHubAnnouncementModal';`,
        `import NotesHubAnnouncementModal from './NotesHubAnnouncementModal';\nimport MyNotesAnnouncementModal from './MyNotesAnnouncementModal';`
    );

    code = code.replace(
        `<NotesHubAnnouncementModal />`,
        `<NotesHubAnnouncementModal />\n      <MyNotesAnnouncementModal />`
    );
    
    fs.writeFileSync(file, code);
    console.log("Added modal to Layout");
}
