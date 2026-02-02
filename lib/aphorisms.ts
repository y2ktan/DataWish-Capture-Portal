import { Aphorism } from "@/models/Aphorism";

export interface BilingualAphorism {
  chinese: string;
  english: string;
}

/**
 * Get a random bilingual aphorism from the database
 */
export function getRandomAphorism(): BilingualAphorism {
  const aphorism = Aphorism.getRandomAphorism();
  if (aphorism) {
    return aphorism;
  }
  // Fallback if database is empty
  return {
    chinese: "新年快乐，万事如意",
    english: "Happy New Year, may all your wishes come true"
  };
}

/**
 * Get formatted aphorism string for display (both languages)
 */
export function getFormattedAphorism(): string {
  const { chinese, english } = getRandomAphorism();
  return `${chinese}\n${english}`;
}
