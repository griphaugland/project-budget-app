import { Category } from '@/types/database';

// Default 6 categories as defined in the architecture document
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-essentials',
    user_id: 'test-user',
    name: 'Essentials',
    type: 'fixed',
    color: '#6366F1',
    icon: 'home',
    sort_order: 1,
  },
  {
    id: 'cat-groceries',
    user_id: 'test-user',
    name: 'Groceries',
    type: 'variable',
    color: '#10B981',
    icon: 'cart',
    sort_order: 2,
  },
  {
    id: 'cat-transport',
    user_id: 'test-user',
    name: 'Transport',
    type: 'variable',
    color: '#3B82F6',
    icon: 'car',
    sort_order: 3,
  },
  {
    id: 'cat-food-drink',
    user_id: 'test-user',
    name: 'Food & Drink Out',
    type: 'variable',
    color: '#F59E0B',
    icon: 'restaurant',
    sort_order: 4,
  },
  {
    id: 'cat-subscriptions',
    user_id: 'test-user',
    name: 'Subscriptions',
    type: 'fixed',
    color: '#8B5CF6',
    icon: 'repeat',
    sort_order: 5,
  },
  {
    id: 'cat-pocket-money',
    user_id: 'test-user',
    name: 'Pocket Money',
    type: 'discretionary',
    color: '#EC4899',
    icon: 'wallet',
    sort_order: 6,
  },
];
