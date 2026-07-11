import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ChatWindow } from '../chat/ChatWindow';

interface MobileChatDrawerProps {
  show: boolean;
  onOpen: () => void;
  onClose: () => void;
  currentZoneId: string | null | undefined;
  /** Hide the FAB when chat tab is active on mobile */
  hideFab: boolean;
}

/** Mobile floating-action button + bottom-sheet chat drawer. */
export function MobileChatDrawer({
  show,
  onOpen,
  onClose,
  currentZoneId,
  hideFab,
}: Readonly<MobileChatDrawerProps>) {
  return (
    <div className="md:hidden">
      {/* FAB */}
      <AnimatePresence>
        {!hideFab && (
          <motion.button
            key="ai-fab"
            className="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={onOpen}
            aria-label="Open AI assistant"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {show && (
          <motion.div
            key="mobile-drawer"
            className="bottom-sheet fixed bottom-0 left-0 right-0 h-[82vh] z-50 flex flex-col overflow-hidden p-4"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          >
            <button
              className="w-10 h-1 rounded-full mx-auto mb-4 cursor-pointer border-0 p-0 block"
              style={{ background: 'hsl(var(--border-strong))' }}
              onClick={onClose}
              aria-label="Close chat"
            />
            <div className="flex-1 min-h-0">
              <ChatWindow currentZoneId={currentZoneId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
