import type { AdminPlanDay } from '@/src/lib/types';

/**
 * A plan's programme as one piece of text, and back again.
 *
 * Its own module because both ends need it: the edit form opens with the
 * text (a client component rendering a textarea) and the action parses it
 * back (a `'use server'` file, which may only export actions).
 *
 *     # Day one
 *     breakfast | 08:00 | 300 | 15 | 40 | 8 | Idli = 3; Sambar = 1 bowl
 *     lunch     | 13:00 | 500 | 20 | 70 | 12
 */
export function daysAsText(days: AdminPlanDay[]): string {
  return days
    .map((day, index) => {
      const head = `# ${day.label || `Day ${index + 1}`}`;
      const meals = day.meals.map(meal => {
        const items = meal.items.map(item => (item.quantity ? `${item.name} = ${item.quantity}` : item.name)).join('; ');
        return [meal.slot, meal.time, meal.calories, meal.proteinG, meal.carbsG, meal.fatsG, items]
          .join(' | ')
          .replace(/\s*\|\s*$/, '');
      });
      return [head, ...meals].join('\n');
    })
    .join('\n\n');
}

/** An empty plan's starting text, so the box is never a blank the operator has to guess at. */
export const PLAN_TEMPLATE = `# Day one
breakfast | 08:00 | 350 | 18 | 45 | 9 | Oats = 1 cup; Banana = 1
lunch | 13:00 | 550 | 25 | 70 | 14 | Dal = 1 bowl; Brown rice = 1 cup
snack | 17:00 | 180 | 8 | 20 | 6 | Peanut butter toast = 1
dinner | 20:30 | 480 | 24 | 50 | 12 | Paneer bhurji = 1 bowl; Chapati = 2`;
