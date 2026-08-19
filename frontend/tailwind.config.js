/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#fff7ef',
        ink: '#241f2e',
        mut: '#6f6880',
        line: '#f0e5d7',
        violet: {
          DEFAULT: '#7b5cf0',
          dark: '#6a49e6',
          light: '#eae1ff',
          faint: '#f4efff',
          glow: 'rgba(123,92,240,0.32)',
        },
        coral: {
          DEFAULT: '#ff6a4d',
          dark: '#ff5233',
          light: '#ffe3dc',
          faint: '#ffe9e3',
          glow: 'rgba(255,106,77,0.34)',
        },
        teal: {
          DEFAULT: '#0fb3a3',
          dark: '#0d9d8f',
          light: '#dcf7ea',
          ink: '#0b6b52',
          sub: '#0d7a5d',
        },
        amber: {
          DEFAULT: '#f9a825',
          light: '#fff1cc',
          ink: '#7a5300',
          sub: '#856000',
        },
        lilac: {
          DEFAULT: '#eae1ff',
          ink: '#54407f',
          sub: '#5c4a86',
        },
        blush: {
          DEFAULT: '#ffe3dc',
          ink: '#9c3a22',
          sub: '#a4462f',
        },
        mint: {
          DEFAULT: '#dcf7ea',
          ink: '#0b6b52',
          sub: '#0d7a5d',
        },
        lemon: {
          DEFAULT: '#fff1cc',
          ink: '#7a5300',
          sub: '#856000',
        },
        sky: { DEFAULT: '#2f9bff', light: '#ddeeff' },
        pink: { DEFAULT: '#ff5fa2' },
        lime: { DEFAULT: '#7fc244' },
        surface: '#fffdfa',
        paper: '#fffaf3',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '999px',
        card: '22px',
        form: '26px',
        inp: '14px',
        logo: '12px',
      },
      boxShadow: {
        card: '0 6px 18px rgba(36,31,46,0.05)',
        modal: '0 14px 40px rgba(36,31,46,0.07)',
        nav: '0 6px 16px rgba(123,92,240,0.32)',
        btn: '0 8px 20px rgba(255,106,77,0.34)',
        'btn-violet': '0 8px 18px rgba(123,92,240,0.3)',
      },
    },
  },
  plugins: [],
}
