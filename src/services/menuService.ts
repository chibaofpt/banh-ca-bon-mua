import type { MenuData, DailyItem, SeasonalItem } from '@/src/lib/types/menu';
import { deriveTags } from '@/src/utils/deriveTags';

/**
 * fetchMenu handles the retrieval and initial transformation of menu data.
 * - Fetches from the static menu.json file in public storage.
 * - Automatically derives 'tags' from item descriptions.
 * - Assigns consistent 'type' discriminators ('daily' | 'seasonal').
 * 
 * Note: When a backend API is available, only the fetch URL needs updating to '/api/menu'.
 */
export const fetchMenu = async (): Promise<MenuData> => {
  const res = await fetch('/data/menu.json');
  const raw = await res.json();

  const transformed: MenuData = {
    contact: raw.contact,
    daily: raw.daily.map((item: any) => ({
      ...item,
      type: 'daily' as const,
      tags: deriveTags(item.description),
    })),
    seasonal: raw.seasonal.map((item: any) => ({
      ...item,
      type: 'seasonal' as const,
      tags: deriveTags(item.description),
    })),
    addons: raw.addons,
  };

  return transformed;
};
