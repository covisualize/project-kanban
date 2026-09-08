/**
 * Reset data/kanban.sqlite to the demo project and cards.
 * Usage: npm run seed
 */
import { DEMO_PROJECT_ID, getStore } from "../lib/kanban";

const store = getStore();
store.resetDemo();

const project = store.getProject(DEMO_PROJECT_ID);
const cards = store.listCards(DEMO_PROJECT_ID);

console.log(`Seeded project ${project.id} (${project.name}) with ${cards.length} cards.`);
for (const card of cards) {
  console.log(`  [${card.status}] ${card.id} — ${card.title}`);
}
