const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

content = content.replace(
  "import { PlaySquare, ChevronLeft, ChevronRight, Server, LayoutGrid, Info } from 'lucide-react';",
  "import { PlaySquare, ChevronLeft, ChevronRight, Server, LayoutGrid, Info, Check } from 'lucide-react';"
);

const epLinkRepl = `                  <Link
                    key={ep.id}
                    to={\`/watch/\${anime.slug}/\${ep.episodeNumber}?season=\${seasonParam}\`}
                    className={clsx(
                      "flex items-center justify-center aspect-square min-h-[44px] rounded-lg border font-bold text-xs md:text-sm transition-all duration-200 ease-out relative overflow-hidden group",
                      bgClass
                    )}
                    title={ep.title || \`Episode \${ep.episodeNumber}\`}
                  >
                    <span className="relative z-10">{ep.episodeNumber}</span>
                    {isWatched && !isActive && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                        <Check className="w-4 h-4 text-white/70" />
                      </div>
                    )}
                  </Link>`;

content = content.replace(
  /<Link\s*key=\{ep\.id\}[\s\S]*?<\/Link>/m,
  epLinkRepl
);

fs.writeFileSync('src/pages/Watch.tsx', content);
