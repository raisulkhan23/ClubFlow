export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="12" className="fill-primary" />
      <path
        d="M15 30.5c0-8 5.5-13 13-13h5"
        stroke="var(--primary-foreground)"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M28 11.5l7.5 6-7.5 6"
        stroke="var(--primary-foreground)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="15" cy="33.5" r="3.2" fill="var(--primary-foreground)" />
    </svg>
  );
}

export function Logo({
  className = "",
  markClass = "size-8",
  showWordmark = true,
}: {
  className?: string;
  markClass?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClass} />
      {showWordmark && (
        <span className="font-display text-lg font-bold leading-none tracking-tight">
          Club<span className="text-primary">Flow</span>
        </span>
      )}
    </span>
  );
}
