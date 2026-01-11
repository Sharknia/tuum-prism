export const siteConfig = {
  blog: {
    title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Tuum Prism',
  },
  owner: {
    name: process.env.NEXT_PUBLIC_OWNER_NAME || '@tuum_day',
    description: process.env.NEXT_PUBLIC_OWNER_DESC || '취미로 하는 1인개발',
    avatar:
      process.env.NEXT_PUBLIC_OWNER_AVATAR || '/images/default-profile.svg',
    social: {
      github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB || '',
      email: process.env.NEXT_PUBLIC_SOCIAL_EMAIL || '',
      linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || '',
      x: process.env.NEXT_PUBLIC_SOCIAL_X || '',
      threads: process.env.NEXT_PUBLIC_SOCIAL_THREADS || '',
    },
  },
};

export type SiteConfig = typeof siteConfig;
