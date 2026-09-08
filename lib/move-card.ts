import { groupCardsByStatus } from "./group-cards";
import type { Card, CardStatus } from "./types";
import { CARD_STATUSES } from "./types";

export type CardPositionPatch = {
  id: string;
  status: CardStatus;
  order: number;
};

export type BoardDragResult = {
  cards: Card[];
  patches: CardPositionPatch[];
};

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

function isColumnId(id: string): id is CardStatus {
  return (CARD_STATUSES as readonly string[]).includes(id);
}

function emptyResult(cards: Card[]): BoardDragResult {
  return { cards, patches: [] };
}

/**
 * Reindex column arrays to 0..n-1 and diff against the previous card list.
 */
function commitColumns(
  previous: Card[],
  columns: Record<CardStatus, Card[]>,
): BoardDragResult {
  const byId = new Map(previous.map((card) => [card.id, card]));
  const cards: Card[] = [];
  const patches: CardPositionPatch[] = [];
  for (const status of CARD_STATUSES) {
    columns[status].forEach((card, order) => {
      const next: Card = { ...card, status, order };
      cards.push(next);
      const prev = byId.get(card.id);
      if (!prev || prev.status !== status || prev.order !== order) {
        patches.push({ id: card.id, status, order });
      }
    });
  }
  return { cards, patches };
}

/**
 * Apply a board drop. `overId` is a column status (append) or a card id
 * (insert at that card). Returns the next card list plus PATCH payloads
 * for rows whose `status` or `order` changed.
 */
export function applyBoardDrag(
  cards: Card[],
  activeId: string,
  overId: string,
): BoardDragResult {
  if (activeId === overId) return emptyResult(cards);

  const moving = cards.find((card) => card.id === activeId);
  if (!moving) return emptyResult(cards);

  const toStatus = isColumnId(overId)
    ? overId
    : cards.find((card) => card.id === overId)?.status;
  if (!toStatus) return emptyResult(cards);

  const columns = groupCardsByStatus(cards);

  if (moving.status === toStatus) {
    if (isColumnId(overId)) return emptyResult(cards);
    const column = columns[toStatus];
    const fromIndex = column.findIndex((card) => card.id === activeId);
    const toIndex = column.findIndex((card) => card.id === overId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return emptyResult(cards);
    }
    columns[toStatus] = arrayMove(column, fromIndex, toIndex);
  } else {
    columns[moving.status] = columns[moving.status].filter(
      (card) => card.id !== activeId,
    );
    const dest = columns[toStatus];
    const insertAt = isColumnId(overId)
      ? dest.length
      : dest.findIndex((card) => card.id === overId);
    const index = insertAt < 0 ? dest.length : insertAt;
    columns[toStatus] = [
      ...dest.slice(0, index),
      { ...moving, status: toStatus },
      ...dest.slice(index),
    ];
  }

  return commitColumns(cards, columns);
}
