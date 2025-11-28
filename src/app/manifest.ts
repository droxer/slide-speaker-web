import type { MetadataRoute } from 'next';
import { PRODUCT_NAME } from '@/constants/product';
import { withAssetRevision } from '@/constants/assetRevision';

const description = `Transform presentations into rich multimedia experiences with ${PRODUCT_NAME}.`;
const icon192 = withAssetRevision('/icons/icon-192.svg');
const icon512 = withAssetRevision('/icons/icon-512.svg');

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: 'SlideSpeaker',
    description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'browser'],
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#0066cc',
    lang: 'en',
    categories: ['productivity', 'presentation', 'multimedia'],
    prefer_related_applications: false,
    icons: [
      {
        src: icon192,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: icon512,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: icon192,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: icon512,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'My Creations',
        url: '/creations',
        description: 'Jump straight to all generated outputs',
      },
      {
        name: 'New Task',
        url: '/tasks',
        description: 'Start a fresh SlideSpeaker AI session',
      },
    ],
  };
}
