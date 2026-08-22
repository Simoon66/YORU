import { UserBadge } from '../types';

export interface SpecialAvatarItem {
  id: string;
  name: string;
  title: string;
  lore: string;
  rarity: string;
  element: string;
  url: string;
  badge: string;
  auraColor: string;
  borderColor: string;
  eventName: string;
  eventDescription: string;
}

export const SPECIAL_EVENT_S1 = {
  id: 'luffy_zoro_s1',
  name: 'Luffy & Zoro Special S1',
  tag: 'Limited Event S1',
  season: 'Season 1 Special',
  description: 'Limited-time Season 1 Special Event! Claim exclusive Monkey D. Luffy and Roronoa Zoro profile avatars to keep in your permanent collection forever.',
  avatars: [
    {
      id: 'event_luffy_s1',
      name: 'Monkey D. Luffy',
      title: 'Sun God / Gear 5',
      lore: 'The Warrior of Liberation who brings smiles and laughter to the world. Wields the absolute freedom of the Mythical Zoan Hito Hito no Mi.',
      rarity: 'Mythic Event S1',
      element: 'Solar Freedom',
      url: 'https://i.imgur.com/ldir3jC.png',
      badge: 'SUN GOD NIKA',
      auraColor: 'from-amber-500/30 via-rose-500/20 to-purple-500/30',
      borderColor: 'border-amber-500/60',
      eventName: 'Luffy & Zoro Special S1',
      eventDescription: 'Season 1 Mythic Avatar: Gear 5 Sun God Liberation'
    },
    {
      id: 'event_zoro_s1',
      name: 'Roronoa Zoro',
      title: 'King of Hell / 3-Sword Style',
      lore: 'The master swordsman of the Straw Hats who tamed the legendary blade Enma. Awakened Conqueror\'s Haki to conquer all who stand before him.',
      rarity: 'Mythic Event S1',
      element: 'Conqueror Hellfire',
      url: 'https://i.imgur.com/s3DmTBC.png',
      badge: 'KING OF HELL',
      auraColor: 'from-emerald-500/30 via-teal-500/20 to-purple-500/30',
      borderColor: 'border-emerald-500/60',
      eventName: 'Luffy & Zoro Special S1',
      eventDescription: 'Season 1 Mythic Avatar: King of Hell Conqueror Haki'
    }
  ],
  badge: {
    id: 'badge_luffy_zoro_s1',
    title: 'Luffy & Zoro S1 Pioneer',
    description: 'Claimed the Season 1 exclusive Luffy & Zoro event reward.',
    icon: 'Crown',
    event: 'Luffy & Zoro Special S1',
    unlockedAt: Date.now()
  } as UserBadge
};

export const SIMOON_ADMIN_AVATAR = {
  id: 'simoon_admin',
  name: 'Simoon (Admin Exclusive)',
  url: 'https://i.imgur.com/nHJox0D.jpeg'
};

export const GIRLS_ANIME_AVATARS = [
  { id: 'girl_1', name: 'Anime Girl 1', url: 'https://i.imgur.com/EF3A6A0.png' },
  { id: 'girl_2', name: 'Anime Girl 2', url: 'https://i.imgur.com/pP1Da9N.png' },
  { id: 'girl_3', name: 'Anime Girl 3', url: 'https://i.imgur.com/UBheUtt.png' },
  { id: 'girl_4', name: 'Anime Girl 4', url: 'https://i.imgur.com/pYOLPdG.png' },
  { id: 'girl_5', name: 'Anime Girl 5', url: 'https://i.imgur.com/VrhB7lp.png' },
  { id: 'girl_6', name: 'Anime Girl 6', url: 'https://i.imgur.com/LFsoGFd.png' },
  { id: 'girl_7', name: 'Anime Girl 7', url: 'https://i.imgur.com/Bzx5L3h.png' },
  { id: 'girl_8', name: 'Anime Girl 8', url: 'https://i.imgur.com/SUw4jTr.png' },
  { id: 'girl_9', name: 'Anime Girl 9', url: 'https://i.imgur.com/Lw3zZvG.png' },
];

export const STANDARD_ANIME_AVATARS = [
  { id: '1', name: 'Anime Avatar 1', url: 'https://i.imgur.com/NCWFUpu.png' },
  { id: '2', name: 'Anime Avatar 2', url: 'https://i.imgur.com/Doknd92.png' },
  { id: '3', name: 'Anime Avatar 3', url: 'https://i.imgur.com/Wa7SSgr.png' },
  { id: '4', name: 'Anime Avatar 4', url: 'https://i.imgur.com/dBirDzX.png' },
  { id: '5', name: 'Anime Avatar 5', url: 'https://i.imgur.com/5i5hJJp.png' },
  { id: '6', name: 'Anime Avatar 6', url: 'https://i.imgur.com/NlP1jD0.png' },
  { id: '7', name: 'Anime Avatar 7', url: 'https://i.imgur.com/BgImE9f.png' },
  { id: '8', name: 'Anime Avatar 8', url: 'https://i.imgur.com/jwaF1Nq.png' },
  { id: '9', name: 'Anime Avatar 9', url: 'https://i.imgur.com/a7KxNqc.png' },
  { id: '10', name: 'Anime Avatar 10', url: 'https://i.imgur.com/7KIKTy8.png' },
  { id: '11', name: 'Anime Avatar 11', url: 'https://i.imgur.com/6yGKVtT.png' },
  { id: '12', name: 'Anime Avatar 12', url: 'https://i.imgur.com/4H4nIzA.png' },
  { id: '13', name: 'Anime Avatar 13', url: 'https://i.imgur.com/PIlT5Fs.png' },
  { id: '14', name: 'Anime Avatar 14', url: 'https://i.imgur.com/zcQgSB4.png' },
  { id: '15', name: 'Anime Avatar 15', url: 'https://i.imgur.com/ej2IGZc.png' },
  { id: '16', name: 'Anime Avatar 16', url: 'https://i.imgur.com/pdvV7x9.png' },
  { id: '17', name: 'Anime Avatar 17', url: 'https://i.imgur.com/k09dSBG.png' },
];
