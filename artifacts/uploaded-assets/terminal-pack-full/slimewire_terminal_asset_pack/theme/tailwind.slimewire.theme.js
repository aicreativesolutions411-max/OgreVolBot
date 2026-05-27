
/** Merge into your existing tailwind.config.js theme.extend. */
module.exports = {
  colors: {
    sw: {
      bg: '#020402',
      elevated: '#050805',
      panel: '#061006',
      panel2: '#0b160b',
      panel3: '#101c10',
      border: '#1c3516',
      borderBright: '#b6ff00',
      borderMuted: '#28451d',
      lime: '#b6ff00',
      lime2: '#7cff00',
      lime3: '#5eff00',
      text: '#e8fbe2',
      muted: '#9bb894',
      dim: '#5d7658',
      red: '#ff4d4d',
      amber: '#ffd166',
      cyan: '#23d6ff',
      purple: '#8a5cff',
    },
  },
  boxShadow: {
    'sw-panel': '0 20px 80px rgba(0,0,0,.55)',
    'sw-glow-sm': '0 0 16px rgba(182,255,0,.25)',
    'sw-glow-md': '0 0 32px rgba(182,255,0,.32)',
    'sw-glow-lg': '0 0 54px rgba(182,255,0,.35)',
  },
  borderRadius: {
    'sw-xs': '8px',
    'sw-sm': '12px',
    'sw-md': '16px',
    'sw-lg': '22px',
    'sw-xl': '32px',
  },
};
