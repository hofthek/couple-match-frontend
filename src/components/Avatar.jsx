import './Avatar.css';

const PALETTES = [
  ['#ff3d8a', '#ff1f7a'],
  ['#6b8df5', '#c668d9'],
  ['#f3c969', '#ff1f7a'],
  ['#4ec9a0', '#6b8df5'],
  ['#c668d9', '#ff3d8a'],
  ['#ff1f7a', '#f3c969'],
];

function hashName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 40, variant }) {
  const palette = variant === 'a'
    ? ['#ff3d8a', '#ff1f7a']
    : variant === 'b'
      ? ['#6b8df5', '#c668d9']
      : PALETTES[hashName(name || '') % PALETTES.length];
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.38),
    background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`,
  };
  return (
    <span className="avatar" style={style} aria-label={name || 'Avatar'}>
      {initials(name)}
    </span>
  );
}

export function AvatarPair({ a, b, size = 40 }) {
  return (
    <span className="avatar-pair" style={{ height: size }}>
      <Avatar name={a} size={size} variant="a" />
      <Avatar name={b} size={size} variant="b" />
    </span>
  );
}
