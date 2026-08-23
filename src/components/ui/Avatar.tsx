interface AvatarProps {
  src: string;
  alt?: string;
  emoji?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  ring?: boolean;
  online?: boolean;
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
  '2xl': 'w-28 h-28',
};

const dotSize = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

export function Avatar({ src, emoji, alt = '', size = 'md', ring, online, className = '' }: AvatarProps) {
  const classes = `${sizeMap[size]} rounded-full ${ring ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`;
  const selectedEmoji = emoji || (src.startsWith('emoji:') ? src.slice(6) : undefined);
  const imageSrc = src.startsWith('emoji:') ? '' : src;
  return (
    <div className={`relative inline-block ${className}`}>
      {imageSrc ? (
        <img src={imageSrc} alt={alt} className={`${classes} object-cover bg-ink-100`} />
      ) : (
        <span className={`${classes} flex items-center justify-center bg-ink-900 text-white text-2xl`} aria-label={alt || 'Profile avatar'}>
          {selectedEmoji || <img src="/image-removebg-preview.png" alt="" className="w-2/3 h-2/3" />}
        </span>
      )}
      {online && <span className={`absolute bottom-0 right-0 ${dotSize[size]} bg-success-500 rounded-full ring-2 ring-white`} />}
    </div>
  );
}
