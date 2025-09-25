"use client";
import { useEffect, useState } from "react";

export default function Confetti({ show, onDone }: { show: boolean; onDone?: () => void }) {
  const [visible, setVisible] = useState(show);
  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => { setVisible(false); onDone && onDone(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);
  if (!visible) return null;
  const pieces = new Array(60).fill(0);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 70, overflow: "hidden" }}>
      {pieces.map((_, i) => (
        <span key={i} style={{
          position: "absolute",
          top: -10,
          left: `${(i * 97) % 100}%`,
          animation: `fall ${1000 + (i%5)*120}ms ease-out forwards`,
          fontSize: 16 + (i%10),
        }}>{["🎉","✨","🎊","🟦","🟨","🟥"][i%6]}</span>
      ))}
      <style jsx>{`
        @keyframes fall { to { transform: translateY(110vh) rotate(45deg); opacity: .9; } }
      `}</style>
    </div>
  );
}


