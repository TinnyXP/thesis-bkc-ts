import type { Config } from 'tailwindcss';

const { heroui } = require("@heroui/react");

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'scrolling-banner': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-50% - var(--gap)/2))' },
        },
        'scrolling-banner-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-50% - var(--gap)/2))' },
        },
      },
      animation: {
        'scrolling-banner': 'scrolling-banner var(--duration) linear infinite',
        'scrolling-banner-vertical': 'scrolling-banner-vertical var(--duration) linear infinite',
      },
      backgroundColor: {
        'line-color': '#06C755',
        'primary-color': '#10CE50',
      },
      gradientColorStops: {
        'primary-color': '#10CE50',
      },
      textColor: {
        'primary-color': '#10CE50',
      },
      borderColor: {
        'primary-color': '#10CE50',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          layout: {},
          colors: {
            default: {
              DEFAULT: '#EEEEEE',
              foreground: '#323232',
            },
            primary: {
              DEFAULT: '#10CE50',
              foreground: '#FFFFFF',
            },
            danger: {
              DEFAULT: '#FF383C',
              foreground: '#FFFFFF',
            },
            focus: '#808080'
          },
        },
        dark: {
          layout: {},
          colors: {
            default: {
              DEFAULT: '#302F2F',
              foreground: '#FFFFFF',
            },
            primary: {
              DEFAULT: '#10CE50',
              foreground: '#FFFFFF',
            },
            danger: {
              DEFAULT: '#FF383C',
              foreground: '#FFFFFF',
            },
            focus: '#808080'
          }
        },
      }
    }),
    require('@tailwindcss/typography'),
  ],
};
export default config;