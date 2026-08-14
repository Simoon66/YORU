const fs = require('fs');
let content = fs.readFileSync('src/pages/Watch.tsx', 'utf8');

// Wrap player and controls in a max-width container
content = content.replace(
  '{/* 1. Player */}',
  '<div className="w-full max-w-[1100px] mx-auto flex flex-col gap-4 md:gap-6">\n        {/* 1. Player */}'
);

content = content.replace(
  '{/* 4. Season Selector */}',
  '</div>\n        {/* 4. Season Selector */}'
);

// Fix Auto Play toggle
content = content.replace(
  `"absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300",
                       autoplay ? "left-[18px]" : "left-[2px]"`,
  `"absolute top-[2px] w-4 h-4 rounded-full shadow-md transition-all duration-300",
                       autoplay ? "left-[18px] bg-black" : "left-[2px] bg-white"`
);

// Fix the container padding again to reduce height overhead
content = content.replace(
  'pt-[60px] md:pt-[72px] pb-32',
  'pt-[60px] md:pt-[72px] pb-24'
);

// Reduce gap between elements to fit more on screen
content = content.replace(
  'gap-6 md:gap-8',
  'gap-4 md:gap-6'
);

fs.writeFileSync('src/pages/Watch.tsx', content);
