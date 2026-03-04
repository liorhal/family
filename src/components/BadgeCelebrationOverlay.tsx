"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";

interface BadgeCelebrationOverlayProps {
  memberName: string;
  badgeTitles: string[];
  onComplete?: () => void;
}

const DURATION_MS = 3500;

export function BadgeCelebrationOverlay({
  memberName,
  badgeTitles,
  onComplete,
}: BadgeCelebrationOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-black/30 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-100 px-6 py-6 shadow-xl dark:border-amber-500 dark:from-amber-950/95 dark:to-yellow-900/95"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-amber-900 dark:bg-amber-500 dark:text-amber-950">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                  Badge{badgeTitles.length > 1 ? "s" : ""} earned!
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {memberName}
                </p>
              </div>
              <ul className="space-y-1">
                {badgeTitles.map((title) => (
                  <li
                    key={title}
                    className="text-base font-semibold text-amber-800 dark:text-amber-200"
                  >
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
