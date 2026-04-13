import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function ClipboardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="7" y="4" width="10" height="4" rx="1" />
      <rect x="5" y="6" width="14" height="14" rx="2" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}

export function ChartBarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 20h16" />
      <rect x="6" y="10" width="3" height="8" rx="1" />
      <rect x="11" y="7" width="3" height="11" rx="1" />
      <rect x="16" y="4" width="3" height="14" rx="1" />
    </svg>
  );
}

export function CogIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      <path d="M19 12a7.6 7.6 0 0 0-.06-.94l2-1.56-2-3.46-2.45.75a7.9 7.9 0 0 0-1.62-.94L14.5 3h-5l-.37 2.85c-.57.22-1.12.53-1.62.94l-2.45-.75-2 3.46 2 1.56A7.6 7.6 0 0 0 5 12c0 .32.02.63.06.94l-2 1.56 2 3.46 2.45-.75c.5.4 1.05.72 1.62.94L9.5 21h5l.37-2.85c.57-.22 1.12-.53 1.62-.94l2.45.75 2-3.46-2-1.56c.04-.31.06-.62.06-.94Z" />
    </svg>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h9m-3 0v3m-3-3v2" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z" />
      <path d="m19 14 .8 2 .2.8.8.2 2 .8-2 .8-.8.2-.2.8-.8 2-.8-2-.2-.8-.8-.2-2-.8 2-.8.8-.2.2-.8.8-2Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="2.5" />
      <path d="M4.5 16a4.5 4.5 0 0 1 9 0" />
      <circle cx="17" cy="9" r="2" />
      <path d="M14.5 16a3.5 3.5 0 0 1 7 0" />
    </svg>
  );
}

