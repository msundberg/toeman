import { v4 as uuidv4 } from 'uuid';
import { Category, TodoItem } from '../types';

export function parse(content: string): Category[] {
  const categories: Category[] = [];
  const lines = content.split('\n');
  let currentCategory: Category | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      currentCategory = {
        id: uuidv4(),
        name: headingMatch[1].trim(),
        items: [],
      };
      categories.push(currentCategory);
      continue;
    }

    const itemMatch = line.match(/^-\s+\[([ x])\]\s+(.*)$/);
    if (itemMatch && currentCategory) {
      const item: TodoItem = {
        id: uuidv4(),
        text: itemMatch[2],
        done: itemMatch[1] === 'x',
      };
      currentCategory.items.push(item);
    }
  }

  return categories;
}

export function serialize(categories: Category[]): string {
  const parts: string[] = [];

  for (const category of categories) {
    parts.push(`## ${category.name}`);
    parts.push('');
    for (const item of category.items) {
      const check = item.done ? 'x' : ' ';
      parts.push(`- [${check}] ${item.text}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}
