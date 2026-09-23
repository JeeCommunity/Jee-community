const fs = require('fs');
let code = fs.readFileSync('src/pages/NotesHub.tsx', 'utf8');

code = code.replace(`          </button>
        </div>
      </div>`, `          </button>
          </div>
        </div>
      </div>`);

fs.writeFileSync('src/pages/NotesHub.tsx', code);
