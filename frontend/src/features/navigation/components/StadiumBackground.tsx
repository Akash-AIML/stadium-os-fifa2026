/**
 * Pure SVG backgrounds for each stadium variant.
 * Called inline inside the StadiumMap SVG element.
 */
export function renderStadiumBackground(stadiumId: string) {
  if (stadiumId === 'sofi') {
    return (
      <>
        <path
          d="M 120 180 C 180 120, 620 100, 680 180 C 740 260, 700 580, 640 660 C 580 740, 220 700, 140 620 C 60 540, 60 240, 120 180 Z"
          fill="none"
          stroke="hsl(var(--border-strong))"
          strokeWidth="2"
          opacity="0.8"
        />
        <ellipse cx="410" cy="390" rx="330" ry="290" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="8" />
        <ellipse cx="410" cy="390" rx="310" ry="270" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
      </>
    );
  }
  if (stadiumId === 'azteca') {
    return (
      <>
        <circle cx="400" cy="400" r="365" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="2.5" />
        <circle cx="400" cy="400" r="335" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        <circle cx="400" cy="400" r="305" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="6" />
        {[
          { cx: 130, cy: 130 },
          { cx: 670, cy: 130 },
          { cx: 130, cy: 670 },
          { cx: 670, cy: 670 },
        ].map((ramp) => {
          const rKey = `ramp_${ramp.cx}_${ramp.cy}`;
          return (
            <g key={rKey}>
              <circle cx={ramp.cx} cy={ramp.cy} r={28} fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={ramp.cx} cy={ramp.cy} r={20} fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="2" />
            </g>
          );
        })}
      </>
    );
  }
  // Default: MetLife
  return (
    <>
      <ellipse cx="400" cy="400" rx="365" ry="320" fill="none" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
      <ellipse cx="400" cy="400" rx="352" ry="308" fill="none" stroke="rgba(6,182,212,0.12)" strokeWidth="6" />
      <ellipse cx="400" cy="400" rx="352" ry="308" fill="none" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" />
      <ellipse cx="400" cy="400" rx="300" ry="255" fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="8 6" />
    </>
  );
}
