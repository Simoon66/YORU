const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Container padding
content = content.replace(
  'pt-[72px] pb-32',
  'pt-[60px] md:pt-[72px] pb-32'
);
content = content.replace(
  'max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 flex flex-col gap-6 md:gap-8',
  'max-w-[1440px] mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-8 flex flex-col gap-0 md:gap-8'
);

// Breadcrumb (hide on mobile, push under player, or add padding)
content = content.replace(
  '<div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest truncate text-white/50">',
  '<div className="hidden md:flex items-center gap-3 text-xs font-bold uppercase tracking-widest truncate text-white/50 px-4 md:px-0">'
);

// Player
content = content.replace(
  'rounded-xl md:rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 ring-1 ring-white/5',
  'md:rounded-2xl overflow-hidden md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b md:border border-white/5 ring-0 md:ring-1 ring-white/5'
);

// Controls section wrapper
content = content.replace(
  'glass-panel p-6 rounded-xl md:rounded-2xl border border-white/5',
  'p-4 md:p-6 md:glass-panel md:rounded-2xl md:border border-white/5 bg-yoru-surface/30 md:bg-transparent'
);

// Episode title font sizing
content = content.replace(
  'text-2xl md:text-3xl font-black uppercase tracking-widest text-white leading-tight break-words',
  'text-xl md:text-3xl font-black uppercase tracking-wider md:tracking-widest text-white leading-tight break-words line-clamp-2 md:line-clamp-none'
);

fs.writeFileSync('src/pages/Watch.tsx', content);
