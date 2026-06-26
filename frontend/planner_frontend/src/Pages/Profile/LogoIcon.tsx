export default function LogoIcon() {
  return (
    <div className="profile-logo-container">
      <svg
        className="profile-logo"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="1"
          transform="rotate(45 12 12)"
        />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    </div>
  );
}
