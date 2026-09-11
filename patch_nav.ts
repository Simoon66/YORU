import fs from 'fs';

let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
content = content.replace(
  `              <div className="hidden md:flex items-center gap-8">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link 
                      key={link.name} 
                      to={link.path}
                      className="relative group"
                    >
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest transition-colors duration-300",
                        isActive ? "text-white" : "text-yoru-text-muted group-hover:text-white"
                      )}>
                        {link.name}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-yoru-accent rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>`,
  ''
);

fs.writeFileSync('src/components/Navigation.tsx', content);
