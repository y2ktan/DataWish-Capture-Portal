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
    chinese: "施比受更有福",
    english: "To give is better than to receive"
  };
}

/**
 * Get formatted aphorism string for display (both languages)
 */
export function getFormattedAphorism(): string {
  const { chinese, english } = getRandomAphorism();
  return `${chinese}\n${english}`;
}
