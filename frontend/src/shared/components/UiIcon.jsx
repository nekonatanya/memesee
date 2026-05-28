export default function UiIcon({ name, className = "", title, ...props }) {
  const classes = ["ui-icon", className].filter(Boolean).join(" ");
  const sharedProps = {
    viewBox: "0 0 16 16",
    className: classes,
    "aria-hidden": "true",
    focusable: "false",
    ...props,
  };

  switch (name) {
    case "arrow-up":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 13V3" />
          <path d="M4.5 6.5 8 3l3.5 3.5" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 8H3" />
          <path d="M6.5 4.5 3 8l3.5 3.5" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 4.5V1.8h-2.7" />
          <path d="M12.6 7A5 5 0 0 0 4 4.3" />
          <path d="M3 11.5v2.7h2.7" />
          <path d="M3.4 9A5 5 0 0 0 12 11.7" />
        </svg>
      );
    case "sort":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3v10" />
          <path d="M3.5 4.5 5 3l1.5 1.5" />
          <path d="M11 13V3" />
          <path d="M9.5 11.5 11 13l1.5-1.5" />
        </svg>
      );
    case "search":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.2" cy="7.2" r="4.3" />
          <path d="m10.4 10.4 3 3" />
        </svg>
      );
    case "check":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      );
    case "copy":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5.5" y="4.5" width="7" height="8" rx="1.2" />
          <path d="M3.5 10.5V3.8c0-.7.5-1.3 1.3-1.3h5.7" />
        </svg>
      );
    case "list":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M3 4h10" />
          <path d="M3 8h10" />
          <path d="M3 12h10" />
        </svg>
      );
    case "grid":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="3.5" height="3.5" rx="0.8" />
          <rect x="9.5" y="3" width="3.5" height="3.5" rx="0.8" />
          <rect x="3" y="9.5" width="3.5" height="3.5" rx="0.8" />
          <rect x="9.5" y="9.5" width="3.5" height="3.5" rx="0.8" />
        </svg>
      );
    case "target":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="4.8" />
          <circle cx="8" cy="8" r="1.6" />
          <path d="M8 1.8v1.4" />
          <path d="M8 12.8v1.4" />
          <path d="M1.8 8h1.4" />
          <path d="M12.8 8h1.4" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 6 4 4 4-4" />
        </svg>
      );
    case "chevron-up":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4 10 4-4 4 4" />
        </svg>
      );
    case "chevron-left":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m10 3.5-4 4.5 4 4.5" />
        </svg>
      );
    case "chevron-right":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 3.5 4 4.5-4 4.5" />
        </svg>
      );
    case "sub-post":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 5 3 8.2l3.5 3" />
          <path d="M4 8.2h5.2A3.8 3.8 0 0 1 13 12" />
        </svg>
      );
    case "eye":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1.8 8s2.3-4 6.2-4 6.2 4 6.2 4-2.3 4-6.2 4S1.8 8 1.8 8Z" />
          <circle cx="8" cy="8" r="1.8" />
        </svg>
      );
    case "flame":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.3 2.2c.2 1.4-.5 2.3-1.3 3.2C6 6.4 5 7.6 5 9.2A3 3 0 0 0 8 12.4a3 3 0 0 0 3-3.2c0-1.2-.5-2.1-1.2-2.9-.6-.7-1.1-1.4-1.2-2.5-.8.4-1.6 1.2-2 2.1" />
          <path d="M8 7.3c-.8.7-1.4 1.5-1.4 2.4A1.5 1.5 0 0 0 8 11.2a1.5 1.5 0 0 0 1.4-1.5c0-.6-.2-1.1-.6-1.6-.2-.3-.5-.6-.6-.8-.2.1-.4.2-.6.4" />
        </svg>
      );
    case "send":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2 2.5 7.2l4.4 1.6L8.5 13 14 2Z" />
          <path d="M6.9 8.8 14 2" />
        </svg>
      );
    case "jump":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v8" />
          <path d="m4.5 8.5 3.5 3.5 3.5-3.5" />
        </svg>
      );
    case "heart":
      return (
        <svg {...sharedProps} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 13.2 2.9 8.1A3.2 3.2 0 0 1 7.4 3.6L8 4.2l.6-.6a3.2 3.2 0 1 1 4.5 4.5L8 13.2Z" />
        </svg>
      );
    case "heart-filled":
      return (
        <svg {...sharedProps} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 13.2 2.9 8.1A3.2 3.2 0 0 1 7.4 3.6L8 4.2l.6-.6a3.2 3.2 0 1 1 4.5 4.5L8 13.2Z" />
        </svg>
      );
    case "star":
      return (
        <svg {...sharedProps} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 2 1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6L8 2Z" />
        </svg>
      );
    case "star-filled":
      return (
        <svg {...sharedProps} viewBox="0 0 16 16" fill="currentColor">
          <path d="m8 2 1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6L8 2Z" />
        </svg>
      );
    case "more":
      return (
        <svg {...sharedProps} viewBox="0 0 16 16" fill="currentColor">
          <circle cx="3.5" cy="8" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="12.5" cy="8" r="1.2" />
        </svg>
      );
    case "flag":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 13.5V2.5" />
          <path d="M4 3h7l-1.2 2 1.2 2H4" />
        </svg>
      );
    case "bell":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 13.2a1.8 1.8 0 0 0 1.7-1.2H6.3A1.8 1.8 0 0 0 8 13.2Z" />
          <path d="M12 10.8H4l.9-1.5V7A3.1 3.1 0 0 1 8 3.8 3.1 3.1 0 0 1 11.1 7v2.3l.9 1.5Z" />
          <path d="M8 2.6v1.2" />
        </svg>
      );
    case "sun":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2.6" />
          <path d="M8 1.8v1.1" />
          <path d="M8 13.1v1.1" />
          <path d="M1.8 8h1.1" />
          <path d="M13.1 8h1.1" />
          <path d="m3.6 3.6.8.8" />
          <path d="m11.6 11.6.8.8" />
          <path d="m12.4 3.6-.8.8" />
          <path d="m4.4 11.6-.8.8" />
        </svg>
      );
    case "moon":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.6 10.4A5.2 5.2 0 0 1 5.6 3.4 5.6 5.6 0 1 0 12.6 10.4Z" />
        </svg>
      );
    case "monitor":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2.4" y="3" width="11.2" height="7.8" rx="1.2" />
          <path d="M6.2 13h3.6" />
          <path d="M8 10.8V13" />
        </svg>
      );
    case "close":
      return (
        <svg {...sharedProps} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          <path d="M4 4 12 12" />
          <path d="M12 4 4 12" />
        </svg>
      );
    default:
      return (
        <svg {...sharedProps} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="8" cy="8" r="5.5" />
        </svg>
      );
  }
}
