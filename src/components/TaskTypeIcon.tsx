/* eslint-disable @next/next/no-img-element */
'use client';

type TaskTypeKey = 'video' | 'audio' | 'podcast' | 'both' | 'unknown';

const ICON_LIBRARY: Record<TaskTypeKey, string[]> = {
  video: ['/video.png'],
  audio: ['/audio.png'],
  podcast: ['/podcast.png'],
  both: ['/video.png', '/podcast.png'],
  unknown: ['/audio.png'],
};

const SIZE_MAP = {
  sm: 18,
  md: 22,
  lg: 28,
} as const;

type TaskTypeIconProps = {
  typeKey?: string | null;
  label: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
};

const normalizeKey = (value?: string | null): TaskTypeKey => {
  const normalized = (value || '').trim().toLowerCase();
  if (
    normalized === 'video' ||
    normalized === 'audio' ||
    normalized === 'podcast' ||
    normalized === 'both'
  ) {
    return normalized;
  }
  return 'unknown';
};

const TaskTypeIcon = ({
  typeKey,
  label,
  size = 'md',
  className,
}: TaskTypeIconProps) => {
  const normalizedKey = normalizeKey(typeKey);
  const icons = ICON_LIBRARY[normalizedKey];
  const dimension = SIZE_MAP[size];
  const hasMultipleIcons = icons.length > 1;

  return (
    <span
      className={[
        'task-type-icon',
        `task-type-icon--${size}`,
        hasMultipleIcons ? 'task-type-icon--stacked' : '',
        className || '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="img"
      aria-label={label}
      title={label}
    >
      {icons.map((src, index) => (
        <img
          key={`${normalizedKey}-${index}`}
          src={src}
          alt=""
          width={dimension}
          height={dimension}
          loading="lazy"
          className="task-type-icon__img"
        />
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default TaskTypeIcon;
