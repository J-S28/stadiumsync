// Flat vector character avatars. Used at onboarding, in the header, in
// NavigateTab's live position marker, and inside the assistant chat so the
// AI + the fan both feel like "someone", not a form. Shared (rather than
// living in StadiumSync.jsx) because AssistantTab is now a separate,
// lazy-loaded chunk that also needs the fan's chosen avatar. Component-only
// exports — the AVATARS lookup built from these lives in ./data.js so this
// file doesn't mix component and non-component exports (breaks Fast Refresh).

export function BoyAvatar({ size = 56, className = "", ring = false }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#3ED07A" strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill="#173226" />
      <path d="M9 55 Q32 40 55 55 L55 64 L9 64 Z" fill="#3ED07A" />
      <path d="M9 55 Q32 47 55 55 L55 59 Q32 51 9 59 Z" fill="#2CA562" />
      <circle cx="32" cy="29" r="14" fill="#F0C299" />
      <path d="M18 27 Q19 12 32 11 Q45 12 46 27 Q45 19 32 18 Q19 19 18 27Z" fill="#2B1C12" />
      <path d="M17 24 Q32 6 47 24 L46 18 Q32 8 18 18 Z" fill="#2B1C12" />
      <circle cx="26.5" cy="30" r="2.1" fill="#1B140D" />
      <circle cx="37.5" cy="30" r="2.1" fill="#1B140D" />
      <path d="M27 37 Q32 40.5 37 37" stroke="#8A5836" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M16 20 Q32 10 48 20 Q47 15 32 12 Q17 15 16 20Z" fill="#FFC24B" opacity="0.9" />
    </svg>
  );
}

export function GirlAvatar({ size = 56, className = "", ring = false }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#FFC24B" strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill="#173226" />
      <path d="M9 55 Q32 40 55 55 L55 64 L9 64 Z" fill="#FFC24B" />
      <path d="M9 55 Q32 47 55 55 L55 59 Q32 51 9 59 Z" fill="#D99F2E" />
      <path d="M15 30 Q13 46 20 52 Q17 40 20 30 Z" fill="#3B2314" />
      <path d="M49 30 Q51 46 44 52 Q47 40 44 30 Z" fill="#3B2314" />
      <circle cx="32" cy="29" r="14" fill="#F0C299" />
      <path d="M17 25 Q18 10 32 9 Q46 10 47 25 Q45 16 32 15 Q19 16 17 25Z" fill="#3B2314" />
      <path d="M18 19 Q32 12 46 19" stroke="#3ED07A" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="26.5" cy="30" r="2.1" fill="#1B140D" />
      <circle cx="37.5" cy="30" r="2.1" fill="#1B140D" />
      <path d="M27 37 Q32 40.5 37 37" stroke="#8A5836" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function StaffAvatar({ size = 56, className = "", ring = false }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#FFC24B" strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill="#173226" />
      <path d="M9 55 Q32 40 55 55 L55 64 L9 64 Z" fill="#16281F" />
      <path d="M13 52 L32 60 L51 52 L51 44 L38 50 L32 46 L26 50 L13 44 Z" fill="#FFC24B" />
      <circle cx="32" cy="29" r="13.5" fill="#E7B183" />
      <path d="M19 26 Q20 12 32 12 Q44 12 45 26 Q43 18 32 17 Q21 18 19 26Z" fill="#171512" />
      <circle cx="26.5" cy="30" r="2" fill="#1B140D" />
      <circle cx="37.5" cy="30" r="2" fill="#1B140D" />
      <path d="M27.5 37 Q32 39.5 36.5 37" stroke="#7A4B2C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M44 24 Q52 24 52 32" stroke="#3ED07A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="52" cy="32" r="2.6" fill="#3ED07A" />
    </svg>
  );
}

export function BotAvatar({ size = 32, className = "" }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      <circle cx="32" cy="32" r="30" fill="#0F231A" />
      <circle cx="32" cy="14" r="3" fill="#3ED07A" />
      <line x1="32" y1="14" x2="32" y2="21" stroke="#3ED07A" strokeWidth="2" />
      <rect x="16" y="21" width="32" height="26" rx="10" fill="#16281F" stroke="#3ED07A" strokeWidth="1.5" />
      <circle cx="25" cy="34" r="4" fill="#3ED07A" />
      <circle cx="39" cy="34" r="4" fill="#3ED07A" />
      <path d="M25 43 Q32 47 39 43" stroke="#8FA69B" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
