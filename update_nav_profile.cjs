const fs = require('fs');
let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

content = content.replace(
  /<button onClick=\{logout\} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white\/10 hover:border-yoru-accent transition-all duration-300 shadow-lg">[\s\S]*?<\/button>/,
  `<Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-yoru-accent transition-all duration-300 shadow-lg block">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-yoru-surface-elevated flex items-center justify-center">
                        <User className="w-5 h-5 text-yoru-text-muted" />
                      </div>
                    )}
                  </Link>`
);

fs.writeFileSync('src/components/Navigation.tsx', content);
