import type { Category, CommunicationCard, WordItem } from '../types';

const SAMPLE_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export const categories: Category[] = [
  {
    id: 'cat-family',
    slug: 'family',
    nameVi: 'Gia đình',
    shortName: 'Gia đình',
    color: '#dbeafe',
    accent: '#2563eb',
    sortOrder: 1
  },
  {
    id: 'cat-food',
    slug: 'food',
    nameVi: 'Ăn uống',
    shortName: 'Ăn uống',
    color: '#dcfce7',
    accent: '#16a34a',
    sortOrder: 2
  },
  {
    id: 'cat-toys',
    slug: 'toys',
    nameVi: 'Đồ chơi',
    shortName: 'Đồ chơi',
    color: '#fef3c7',
    accent: '#d97706',
    sortOrder: 3
  },
  {
    id: 'cat-animals',
    slug: 'animals',
    nameVi: 'Động vật',
    shortName: 'Động vật',
    color: '#ede9fe',
    accent: '#7c3aed',
    sortOrder: 4
  },
  {
    id: 'cat-needs',
    slug: 'needs',
    nameVi: 'Nhu cầu',
    shortName: 'Nhu cầu',
    color: '#fee2e2',
    accent: '#dc2626',
    sortOrder: 5
  },
  {
    id: 'cat-greeting',
    slug: 'greeting',
    nameVi: 'Chào hỏi',
    shortName: 'Chào hỏi',
    color: '#ccfbf1',
    accent: '#0f766e',
    sortOrder: 6
  }
];

export const words: WordItem[] = [
  {
    id: 'word-me',
    categoryId: 'cat-family',
    slug: 'me',
    textVi: 'Mẹ',
    phoneticHint: 'mờ - e - mẹ',
    wordType: 'single_word',
    goalType: 'first_word',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 1
  },
  {
    id: 'word-ba',
    categoryId: 'cat-family',
    slug: 'ba',
    textVi: 'Ba',
    phoneticHint: 'bờ - a - ba',
    wordType: 'single_word',
    goalType: 'first_word',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 2
  },
  {
    id: 'word-ong',
    categoryId: 'cat-family',
    slug: 'ong',
    textVi: 'Ông',
    phoneticHint: 'ông',
    wordType: 'single_word',
    goalType: 'first_word',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 3
  },
  {
    id: 'word-an',
    categoryId: 'cat-food',
    slug: 'an',
    textVi: 'Ăn',
    phraseVi: 'Con muốn ăn',
    phoneticHint: 'ăn',
    wordType: 'single_word',
    goalType: 'request_need',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 1
  },
  {
    id: 'word-uong-nuoc',
    categoryId: 'cat-food',
    slug: 'uong-nuoc',
    textVi: 'Nước',
    phraseVi: 'Con muốn uống nước',
    phoneticHint: 'nước',
    wordType: 'phrase_2_words',
    goalType: 'request_need',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 2
  },
  {
    id: 'word-sua',
    categoryId: 'cat-food',
    slug: 'sua',
    textVi: 'Sữa',
    phraseVi: 'Con muốn sữa',
    phoneticHint: 'sữa',
    wordType: 'single_word',
    goalType: 'request_need',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 3
  },
  {
    id: 'word-bong',
    categoryId: 'cat-toys',
    slug: 'bong',
    textVi: 'Bóng',
    phraseVi: 'Chơi bóng',
    phoneticHint: 'bóng',
    wordType: 'single_word',
    goalType: 'label_object',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1614632537197-38a4705f473e?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 1
  },
  {
    id: 'word-xe',
    categoryId: 'cat-toys',
    slug: 'xe',
    textVi: 'Xe',
    phoneticHint: 'xe',
    wordType: 'single_word',
    goalType: 'label_object',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 2
  },
  {
    id: 'word-cho',
    categoryId: 'cat-animals',
    slug: 'cho',
    textVi: 'Chó',
    phoneticHint: 'chó',
    wordType: 'single_word',
    goalType: 'label_object',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 1
  },
  {
    id: 'word-meo',
    categoryId: 'cat-animals',
    slug: 'meo',
    textVi: 'Mèo',
    phoneticHint: 'mèo',
    wordType: 'single_word',
    goalType: 'label_object',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 2
  },
  {
    id: 'word-giup',
    categoryId: 'cat-needs',
    slug: 'giup',
    textVi: 'Giúp',
    phraseVi: 'Giúp con',
    phoneticHint: 'giúp',
    wordType: 'single_word',
    goalType: 'request_need',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 1
  },
  {
    id: 'word-nua',
    categoryId: 'cat-needs',
    slug: 'nua',
    textVi: 'Nữa',
    phraseVi: 'Con muốn nữa',
    phoneticHint: 'nữa',
    wordType: 'single_word',
    goalType: 'request_need',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 2
  },
  {
    id: 'word-chao',
    categoryId: 'cat-greeting',
    slug: 'chao',
    textVi: 'Chào',
    phraseVi: 'Con chào',
    phoneticHint: 'chào',
    wordType: 'single_word',
    goalType: 'social_greeting',
    difficultyLevel: 1,
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=640&q=80',
    systemVideoUrl: SAMPLE_VIDEO,
    sortOrder: 1
  }
];

export const communicationCards: CommunicationCard[] = [
  {
    id: 'comm-water',
    textVi: 'Nước',
    phraseVi: 'Con muốn uống nước',
    imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=640&q=80',
    intentType: 'request_drink'
  },
  {
    id: 'comm-eat',
    textVi: 'Ăn',
    phraseVi: 'Con muốn ăn',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=640&q=80',
    intentType: 'request_food'
  },
  {
    id: 'comm-help',
    textVi: 'Giúp',
    phraseVi: 'Giúp con',
    imageUrl: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=640&q=80',
    intentType: 'request_help'
  },
  {
    id: 'comm-rest',
    textVi: 'Nghỉ',
    phraseVi: 'Con muốn nghỉ',
    imageUrl: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&w=640&q=80',
    intentType: 'request_break'
  }
];
