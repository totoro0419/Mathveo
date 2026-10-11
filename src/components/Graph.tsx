import { useId, useState } from "react";

export function ParabolaGraph({
  interactive = false,
  hero = false,
}: {
  interactive?: boolean;
  hero?: boolean;
}) {
  const id = useId();
  const [p, setP] = useState(2);
  const [q, setQ] = useState(-3);
  const width = 420;
  const height = 260;
  const px = (x: number) => 210 + x * 34;
  const py = (y: number) => 150 - y * 24;
  const points = Array.from({ length: 121 }, (_, i) => {
    const x = -6 + i / 10;
    return `${px(x)},${py((x - p) ** 2 + q)}`;
  }).join(" ");
  return (
    <div className={`graph ${hero ? "hero-graph" : ""}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title`}
      >
        <title id={`${id}-title`}>
          y = (x − {p})² {q < 0 ? "−" : "+"} {Math.abs(q)} のグラフ。頂点は ({p}
          , {q})、軸は x = {p}。
        </title>
        <defs>
          <clipPath id={`${id}-clip`}>
            <rect x="18" y="12" width="384" height="230" rx="8" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`x${i}`}
              x1={px(i - 6)}
              x2={px(i - 6)}
              y1="10"
              y2="242"
              className="graph-grid"
            />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`y${i}`}
              x1="18"
              x2="402"
              y1={py(i - 4)}
              y2={py(i - 4)}
              className="graph-grid"
            />
          ))}
          <line x1="18" x2="402" y1={py(0)} y2={py(0)} className="graph-axis" />
          <line x1={px(0)} x2={px(0)} y1="12" y2="242" className="graph-axis" />
          <line
            x1={px(p)}
            x2={px(p)}
            y1="12"
            y2="242"
            className="graph-symmetry"
          />
          <polyline points={points} fill="none" className="graph-curve" />
          <circle
            cx={px(p)}
            cy={py(q)}
            r="6"
            fill="#2563eb"
            stroke="white"
            strokeWidth="3"
          />
        </g>
        <text x="396" y={py(0) - 8} className="axis-label">
          x
        </text>
        <text x={px(0) + 9} y="23" className="axis-label">
          y
        </text>
        <text x={px(0) - 15} y={py(0) + 19} className="axis-label">
          0
        </text>
        <rect
          x={Math.min(px(p) + 14, 308)}
          y={Math.max(22, Math.min(py(q) + 3, 225))}
          width="80"
          height="28"
          rx="9"
          fill="white"
          stroke="#d6e4f6"
        />
        <text
          x={Math.min(px(p) + 54, 348)}
          y={Math.max(40, Math.min(py(q) + 21, 243))}
          textAnchor="middle"
          className="vertex-label"
        >
          ({p}, {q})
        </text>
      </svg>
      {hero ? (
        <span className="graph-caption">y = (x − 2)² − 3</span>
      ) : (
        <div className="graph-legend">
          <span>
            <i />
            放物線
          </span>
          <span>
            頂点 ({p}, {q})
          </span>
          <span>軸 x = {p}</span>
        </div>
      )}
      {interactive && (
        <div className="graph-controls">
          <label htmlFor={`${id}-p`}>
            左右の位置 <b>p = {p}</b>
            <input
              id={`${id}-p`}
              type="range"
              min="-3"
              max="3"
              step="1"
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
            />
          </label>
          <label htmlFor={`${id}-q`}>
            上下の位置 <b>q = {q}</b>
            <input
              id={`${id}-q`}
              type="range"
              min="-3"
              max="3"
              step="1"
              value={q}
              onChange={(e) => setQ(Number(e.target.value))}
            />
          </label>
          <p>頂点を動かして、式とグラフのつながりを確かめよう。</p>
        </div>
      )}
    </div>
  );
}
