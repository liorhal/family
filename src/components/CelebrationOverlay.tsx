"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isEmojiAvatar } from "@/lib/avatars";

interface CelebrationOverlayProps {
  memberName: string;
  avatarUrl?: string | null;
  onComplete?: () => void;
}

const PARTICLE_COUNT = 24;
const DURATION_MS = 2500;

function AvatarParticle({
  content,
  delay,
  x,
  size,
}: {
  content: React.ReactNode;
  delay: number;
  x: number;
  size: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute flex items-center justify-center rounded-full bg-white/90 shadow-lg dark:bg-slate-800/90"
      style={{
        left: `${x}%`,
        top: -60,
        width: size,
        height: size,
        fontSize: size * 0.6,
      }}
      initial={{ y: 0, opacity: 1, rotate: 0 }}
      animate={{
        y: "100vh",
        opacity: [1, 1, 0],
        rotate: [0, 360, 720],
        transition: {
          duration: 2.5,
          delay,
          ease: "linear",
        },
      }}
      exit={{ opacity: 0 }}
    >
      {content}
    </motion.div>
  );
}

export function CelebrationOverlay({
  memberName,
  avatarUrl,
  onComplete,
}: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, DURATION_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  const renderContent = () => {
    if (avatarUrl && isEmojiAvatar(avatarUrl)) {
      return <span>{avatarUrl}</span>;
    }
    if (avatarUrl && (avatarUrl.startsWith("http") || avatarUrl.startsWith("data:"))) {
      return <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />;
    }
    return (
      <span className="font-bold text-slate-700 dark:text-slate-200">
        {memberName.slice(0, 2).toUpperCase()}
      </span>
    );
  };

  const content = renderContent();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <AvatarParticle
              key={i}
              content={content}
              delay={i * 0.04}
              x={((i * 7 + 13) % 97) + 1}
              size={32 + (i % 4) * 10}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
