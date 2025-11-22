import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';
import {
  Noto_Sans,
  Noto_Sans_SC,
  Noto_Sans_TC,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_Thai,
} from 'next/font/google';
import { defaultLocale, locales, type Locale } from '@/i18n/config';
import { PRODUCT_NAME } from '@/constants/product';
import './globals.scss';

// Load fonts for all supported languages
const notoSans = Noto_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '700'],
});

const themeInitScript = `(() => {
  try {
    const storageKey = 'slidespeaker_ui_theme';
    const stored = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    let themeClass = 'theme-light';
    if (stored === 'dark' || stored === 'light') {
      if (stored === 'dark') themeClass = 'theme-dark';
      else themeClass = 'theme-light'; // light
    } else {
      themeClass = prefersDark ? 'theme-dark' : 'theme-light';
    }

    const legacyClass = themeClass.includes('dark') ? 'dark-theme' : 'light-theme';
    document.body.classList.add(themeClass);
    document.body.classList.add(legacyClass);
  } catch (error) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    let themeClass = 'theme-light';
    themeClass = prefersDark ? 'theme-dark' : 'theme-light';

    const legacyClass = themeClass.includes('dark') ? 'dark-theme' : 'light-theme';
    document.body.classList.add(themeClass);
    document.body.classList.add(legacyClass);
  }
})();`;

const deriveLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (
    cookieLocale &&
    (locales as ReadonlyArray<string>).includes(cookieLocale)
  ) {
    return cookieLocale as Locale;
  }

  const headerStore = await headers();
  const requestPath = headerStore.get('next-url');
  if (requestPath) {
    const [, maybeLocale] = requestPath.split('/');
    if (
      maybeLocale &&
      (locales as ReadonlyArray<string>).includes(maybeLocale)
    ) {
      return maybeLocale as Locale;
    }
  }

  return defaultLocale;
};

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: `Transform presentations into rich multimedia experiences with ${PRODUCT_NAME}.`,
};

// Helper function to get the appropriate font class for the locale
const getFontClass = (locale: Locale): string => {
  switch (locale) {
    case 'zh-CN':
      return notoSansSC.className;
    case 'zh-TW':
      return notoSansTC.className;
    case 'ja':
      return notoSansJP.className;
    case 'ko':
      return notoSansKR.className;
    case 'th':
      return notoSansThai.className;
    case 'en':
    default:
      return notoSans.className;
  }
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = await deriveLocale();
  const fontClass = getFontClass(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={fontClass} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
