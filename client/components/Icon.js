export default function Icon({ name, size = 24, color = '#1a2a6c', title }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': title ? undefined : true, role: 'img' };
  const stroke = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const solid = { fill: color };
  switch (name) {
    case 'chat':
      return (
        <svg {...common}>
          {title ? <title>{title}</title> : null}
          <path {...stroke} d="M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H9l-4 3v-3a4 4 0 0 1-4-4V6Z" />
          <path {...stroke} d="M8 9h8M8 12h5" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          {title ? <title>{title}</title> : null}
          <rect {...stroke} x="4" y="10" width="16" height="10" rx="2" />
          <path {...stroke} d="M8 10V7a4 4 0 1 1 8 0v3" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          {title ? <title>{title}</title> : null}
          <rect {...stroke} x="3" y="5" width="18" height="14" rx="2" />
          <path {...stroke} d="M3 9h18" />
          <path {...stroke} d="M7 13h4" />
        </svg>
      );
    case 'mobile':
      return (
        <svg {...common}>
          {title ? <title>{title}</title> : null}
          <rect {...stroke} x="7" y="3" width="10" height="18" rx="2" />
          <circle {...solid} cx="12" cy="17" r="1" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          {title ? <title>{title}</title> : null}
          <circle {...stroke} cx="12" cy="12" r="9" />
          <path {...stroke} d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
        </svg>
      );
    case 'bitcoin':
      return (
        <svg {...common}>
          {title ? <title>{title}</title> : null}
          <circle {...stroke} cx="12" cy="12" r="9" />
          <path {...stroke} d="M9 7h5a3 3 0 1 1 0 6H9h6a3 3 0 1 1 0 6H9" />
        </svg>
      );
    default:
      return null;
  }
}