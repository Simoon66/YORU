import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const ShortcutsModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      // Toggle on '?' (Shift + /)
      if (e.key === '?') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shortcuts = [
    { key: '?', description: 'Toggle Shortcuts Modal' },
    { key: 'Space', description: 'Play / Pause Video' },
    { key: 'Arrow Right', description: 'Forward 10 Seconds' },
    { key: 'Arrow Left', description: 'Rewind 10 Seconds' },
    { key: 'Arrow Up', description: 'Volume Up' },
    { key: 'Arrow Down', description: 'Volume Down' },
    { key: 'F', description: 'Toggle Fullscreen' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-12 h-12 rounded-full bg-yoru-surface-elevated border border-yoru-border text-yoru-text-muted hover:text-white hover:border-yoru-accent shadow-2xl flex items-center justify-center transition-all z-40"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-yoru-bg border border-yoru-border shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-yoru-border bg-yoru-surface">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-yoru-accent" />
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">Keyboard Shortcuts</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-yoru-text-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {shortcuts.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-b border-yoru-border/50 last:border-0">
                    <span className="text-sm text-yoru-text-muted">{s.description}</span>
                    <kbd className="px-2 py-1 bg-yoru-surface-elevated border border-yoru-border rounded-md text-xs font-mono text-white">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
