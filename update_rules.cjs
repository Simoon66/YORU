const fs = require('fs');

let content = fs.readFileSync('firestore.rules', 'utf-8');

const newIsAdmin = `    function isAdmin() {
      return (request.auth != null && request.auth.token != null && request.auth.token.email != null && (request.auth.token.email == 'simoonabdulla@gmail.com' || request.auth.token.email == 'titumamma2425@gmail.com')) || 
             (isSignedIn() && getUserRole() == 'admin');
    }`;

content = content.replace(
  /function isAdmin\(\) \{[\s\S]*?\}/,
  newIsAdmin
);

fs.writeFileSync('firestore.rules', content);
