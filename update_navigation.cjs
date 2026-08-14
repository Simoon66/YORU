const fs = require('fs');
let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

if (!content.includes('AuthModal')) {
  content = content.replace(
    "import { motion, AnimatePresence } from 'motion/react';",
    "import { motion, AnimatePresence } from 'motion/react';\nimport { AuthModal } from './AuthModal';"
  );
  
  content = content.replace(
    "const [isScrolled, setIsScrolled] = useState(false);",
    "const [isScrolled, setIsScrolled] = useState(false);\n  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);"
  );
  
  content = content.replace(
    /const handleLogin = async \(\) => \{[\s\S]*?\};/,
    "const handleLogin = () => {\n    setIsAuthModalOpen(true);\n  };"
  );
  
  content = content.replace(
    "return (\n    <>",
    "return (\n    <>\n      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />"
  );
  
  fs.writeFileSync('src/components/Navigation.tsx', content);
}
