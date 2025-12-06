export const JING_SI_APHORISMS: string[] = [
  "Gratitude brings joy and contentment.",
  "A kind heart is a source of endless blessings.",
  "Let compassion be the language of your life.",
  "In giving, we receive the greatest happiness.",
  "A peaceful mind creates a peaceful world."
];

export function getRandomAphorism() {
  if (JING_SI_APHORISMS.length === 0) {
    return "";
  }
  const index = Math.floor(Math.random() * JING_SI_APHORISMS.length);
  return JING_SI_APHORISMS[index];
}


