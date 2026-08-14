const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  /match \/watchProgress\/\{progressId\} \{[\s\S]*?\}/,
  \`match /watchProgress/{progressId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }\`
);
fs.writeFileSync('firestore.rules', rules);
