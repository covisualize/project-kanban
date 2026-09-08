import type { Card, CardStatus } from "./types";

/** Group cards into columns using existing `status` values. */
export function groupCardsByStatus(
  cards: Card[],
): Record<CardStatus, Card[]> {
  const grouped: Record<CardStatus, Card[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  for (const card of cards) {
    grouped[card.status].push(card);
  }
  return grouped;
}
