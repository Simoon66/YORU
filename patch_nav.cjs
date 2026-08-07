const fs = require('fs');
let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// Replace Logo component
content = content.replace(
  /export const Logo =[\s\S]*?<\/div>\n\s*\);\n/g,
  `export const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-3 group", className)}>
    <div className="relative w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-shadow duration-500">
      <div className="w-3.5 h-3.5 bg-yoru-bg rotate-45 rounded-[2px] transition-transform duration-500 group-hover:rotate-90" />
    </div>
    <span className="text-xl md:text-2xl font-black tracking-[0.25em] text-white">
      YORU
    </span>
  </div>
);
`
);

fs.writeFileSync('src/components/Navigation.tsx', content);
