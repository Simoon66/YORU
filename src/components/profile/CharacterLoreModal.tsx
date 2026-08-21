import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Flame, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface CharacterLoreModalProps {
  avatar: any | null;
  onClose: () => void;
  onEquip: (url: string) => void;
  isEquipped?: boolean;
}

export const CharacterLoreModal: React.FC<CharacterLoreModalProps> = ({
  avatar,
  onClose,
  onEquip,
  isEquipped = false
}) => {
  return (
    <AnimatePresence>
      {avatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-[#0E1018] border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-6 overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-yoru-accent p-1 bg-black/60 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {avatar.rarity}
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-wider mt-2">
                  {avatar.name}
                </h3>
                <p className="text-xs font-bold text-rose-400">
                  {avatar.title}
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block mb-1">
                  Character Lore
                </span>
                <p className="text-xs text-white/80 leading-relaxed">
                  {avatar.lore}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block">Element / Aura</span>
                  <span className="font-semibold text-white">{avatar.element}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yoru-text-muted block">Status</span>
                  <span className="font-semibold text-emerald-400">Permanently Owned</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    onEquip(avatar.url);
                    onClose();
                  }}
                  className={`w-full font-bold ${
                    isEquipped
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white'
                  }`}
                >
                  {isEquipped ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <Check className="w-4 h-4" /> Currently Equipped
                    </span>
                  ) : (
                    'Equip as Active Avatar'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
