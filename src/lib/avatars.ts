/** Predefined avatar options (emoji). Stored in member.avatar_url */
export const AVATAR_OPTIONS = [
  "👤", "👩", "👨", "👧", "👦", "👴", "👵", "🧒", "🧑", "👶",
  "🦸", "🦹", "🧙", "🧚", "🧜", "🧝", "🦊", "🐻", "🐼", "🐨",
  "🦁", "🐯", "🐸", "🐵", "🐶", "🐱", "⚽", "🏀", "🎾", "🎯",
  "🎨", "🎭", "🎪", "🎸", "🎹", "📚", "🌟", "⭐", "🔥", "💎",
] as const;

export type AvatarOption = (typeof AVATAR_OPTIONS)[number];

export function isEmojiAvatar(value: string | null | undefined): boolean {
  if (!value) return false;
  return AVATAR_OPTIONS.includes(value as AvatarOption) || value.length <= 4;
}
