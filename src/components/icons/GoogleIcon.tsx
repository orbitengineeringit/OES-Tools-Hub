interface GoogleIconProps {
  className?: string
}

export function GoogleIcon({ className }: GoogleIconProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M44.5 24.5c0-1.57-.14-3.09-.4-4.55H24v9.02h11.5a9.82 9.82 0 0 1-4.26 6.43v5.34h6.9c4.04-3.72 6.36-9.2 6.36-16.24Z"
        fill="#4285F4"
      />
      <path
        d="M24 46c5.76 0 10.6-1.91 14.14-5.18l-6.9-5.34c-1.91 1.28-4.35 2.04-7.24 2.04-5.57 0-10.29-3.76-11.97-8.82H4.9v5.51A21.98 21.98 0 0 0 24 46Z"
        fill="#34A853"
      />
      <path
        d="M12.03 28.7a12.2 12.2 0 0 1 0-7.78V15.4H4.9A21.98 21.98 0 0 0 2 24c0 3.54.84 6.9 2.9 9.6l7.13-4.9Z"
        fill="#FBBC05"
      />
      <path
        d="M24 11.58c3.14 0 5.96 1.08 8.18 3.2l6.14-6.14C34.58 5.09 29.76 2.5 24 2.5A21.98 21.98 0 0 0 4.9 15.4l7.13 5.52C13.71 15.34 18.43 11.58 24 11.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}
