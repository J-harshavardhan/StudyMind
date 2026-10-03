const ICONS = {
  book: '📖',
  bookmark: '🔖',
  briefcase: '💼',
  calculator: '🧮',
  calendar: '🗓️',
  camera: '📷',
  check: '✓',
  code: '</>',
  flask: '⚗',
  folder: '📁',
  globe: '🌐',
  heart: '♥',
  language: '文',
  laptop: '💻',
  lightbulb: '💡',
  music: '♫',
  pen: '🖊',
  pencil: '✎',
  rocket: '🚀',
  school: '🎓',
  star: '★',
  target: '◎',
  terminal: '>_',
  wrench: '🔧'
};

export function categoryIconLabel(icon) {
  return `${ICONS[icon] || '✦'} ${icon || 'category'}`;
}

export default function CategoryIcon({ icon, size = 'medium' }) {
  return (
    <span
      className={`category-icon category-icon-${size}`}
      aria-hidden="true"
    >
      {ICONS[icon] || '✦'}
    </span>
  );
}
