export default function StoreIcon() {
  return (
    <svg
      className="store-icon"
      viewBox="0 0 76 66"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="awn-clip">
          <rect x="0" y="0" width="76" height="30" rx="5" />
        </clipPath>
        <clipPath id="win-clip">
          <rect x="10" y="35" width="56" height="20" />
        </clipPath>
      </defs>

      {/* Awning */}
      <rect x="0" y="0" width="76" height="30" rx="5" fill="var(--color-primary)" />
      <g clipPath="url(#awn-clip)" opacity="0.2">
        <line x1="-4" y1="30" x2="18" y2="0" stroke="white" strokeWidth="10" />
        <line x1="14" y1="30" x2="36" y2="0" stroke="white" strokeWidth="10" />
        <line x1="32" y1="30" x2="54" y2="0" stroke="white" strokeWidth="10" />
        <line x1="50" y1="30" x2="72" y2="0" stroke="white" strokeWidth="10" />
        <line x1="68" y1="30" x2="90" y2="0" stroke="white" strokeWidth="10" />
      </g>
      {/* Awning lip */}
      <rect x="0" y="26" width="76" height="5" fill="var(--color-accent)" />

      {/* Facade */}
      <rect x="4" y="30" width="68" height="36" rx="3" fill="#F8F8F8" />
      <rect x="4" y="30" width="68" height="36" rx="3" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" />

      {/* Service window */}
      <rect x="10" y="35" width="56" height="20" rx="2" fill="#D6E8F5" />
      <rect x="10" y="35" width="56" height="20" rx="2" fill="none" stroke="var(--color-primary)" strokeWidth="1" />

      {/* Shelf line */}
      <line x1="10" y1="46" x2="66" y2="46" stroke="var(--color-primary)" strokeWidth="0.8" opacity="0.3" />

      {/* Shelf items clipped inside window */}
      <g clipPath="url(#win-clip)">
        <rect x="14" y="38" width="6" height="8" rx="1" fill="#E05252" />
        <rect x="22" y="39" width="5" height="7" rx="1" fill="#4A90D9" />
        <rect x="30" y="37" width="4" height="9" rx="1" fill="#6BBF7A" />
        <rect x="37" y="38" width="6" height="8" rx="1" fill="#F5A623" />
        <rect x="46" y="40" width="7" height="5"  rx="1" fill="#B0B0C0" />
        <rect x="56" y="38" width="5" height="8" rx="1" fill="#9B59B6" />
      </g>

      {/* Window dividers */}
      <line x1="29" y1="35" x2="29" y2="55" stroke="var(--color-primary)" strokeWidth="1" opacity="0.35" />
      <line x1="47" y1="35" x2="47" y2="55" stroke="var(--color-primary)" strokeWidth="1" opacity="0.35" />

      {/* Counter ledge */}
      <rect x="7" y="55" width="62" height="5" rx="1" fill="#C8CDD8" />
      <rect x="7" y="55" width="62" height="5" rx="1" fill="none" stroke="var(--color-primary)" strokeWidth="0.8" />
    </svg>
  );
}