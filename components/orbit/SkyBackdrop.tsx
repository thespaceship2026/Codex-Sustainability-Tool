// SkyBackdrop — atmospheric layers + drifting UFO silhouettes.
// Purely presentational. The .sky / .ufo classes do all the heavy lifting
// via globals.css.

export function SkyBackdrop() {
  return (
    <>
      <div className="sky" aria-hidden="true" />

      <svg
        className="ufo one"
        viewBox="0 0 200 80"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="ufoGlow1" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#99F6E4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5EEAD4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="60" rx="70" ry="8" fill="url(#ufoGlow1)" />
        <ellipse
          cx="100"
          cy="48"
          rx="62"
          ry="10"
          fill="#0F1B2F"
          stroke="#5EEAD4"
          strokeWidth="1.2"
          opacity="0.9"
        />
        <ellipse
          cx="100"
          cy="40"
          rx="34"
          ry="12"
          fill="#1B2945"
          stroke="#5EEAD4"
          strokeWidth="1"
          opacity="0.85"
        />
        <circle cx="100" cy="38" r="4" fill="#99F6E4" />
        <circle cx="80" cy="50" r="1.6" fill="#5EEAD4" />
        <circle cx="100" cy="50" r="1.6" fill="#5EEAD4" />
        <circle cx="120" cy="50" r="1.6" fill="#5EEAD4" />
      </svg>

      <svg
        className="ufo two"
        viewBox="0 0 200 80"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="100"
          cy="48"
          rx="58"
          ry="9"
          fill="#0F1B2F"
          stroke="#5EEAD4"
          strokeWidth="1"
          opacity="0.75"
        />
        <ellipse
          cx="100"
          cy="41"
          rx="30"
          ry="11"
          fill="#1B2945"
          stroke="#5EEAD4"
          strokeWidth="0.8"
          opacity="0.7"
        />
        <circle cx="100" cy="39" r="3" fill="#99F6E4" />
      </svg>

      <svg
        className="ufo three"
        viewBox="0 0 200 80"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="100"
          cy="48"
          rx="60"
          ry="9"
          fill="#0F1B2F"
          stroke="#5EEAD4"
          strokeWidth="1"
          opacity="0.6"
        />
        <ellipse
          cx="100"
          cy="41"
          rx="32"
          ry="11"
          fill="#1B2945"
          stroke="#5EEAD4"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </svg>
    </>
  );
}
