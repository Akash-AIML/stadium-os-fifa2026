import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Bottom-right zoom control buttons. */
export function MapControls({ onZoomIn, onZoomOut }: Readonly<MapControlsProps>) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
      <motion.button
        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <ZoomIn className="w-5 h-5" />
      </motion.button>
      <motion.button
        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <ZoomOut className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
