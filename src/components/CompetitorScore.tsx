import { useLayoutEffect, useState } from "react";
import Penalty from "./Penalty";

type CompetitorScoreProps = {
  name: string;
  dojo: string;
  color: "red" | "blue";
  score: number;
  penalties: { [key: string]: boolean };
  jogai: { [key: string]: boolean };
  onAddPoint: () => void;
  onRemovePoint: () => void;
  onTogglePenalty: (key: string) => void;
  onToggleJogai: (key: string) => void;
  admin: boolean;
};

const CompetitorScore = ({
  name,
  dojo,
  color,
  score,
  penalties,
  jogai,
  onAddPoint,
  onRemovePoint,
  onTogglePenalty,
  onToggleJogai,
  admin,
}: CompetitorScoreProps) => {
  const [isMobile, setIsMobile] = useState(false); console.log('---- - - dentro competitorScore', isMobile)
  const textColor = color === "red" ? "text-red-600" : "text-blue-600";
  const accent = color === "red" ? "red" : "blue";

  useLayoutEffect(() => {
      const ua = navigator.userAgent;
      setIsMobile(/Android|iPhone|iPad|iPod/i.test(ua) || window.location.search.includes("admin=true"));
    }, []);

  return (
    <div className="w-full flex flex-col items-center p-4 gap-4">
      <div className={`flex ${isMobile ? 'gap-3' : 'flex-col'}`}>
        <h2 className="text-xl font-bold">{name}</h2>
        <h2 className="text-xl italic">{dojo}</h2>
      </div>
      <h2 className={`font-extrabold ${textColor}
        ${isMobile ? 'text-5xl' : 'text-9xl'}
      `}>{score}</h2>

      {admin && (
        <div className="flex gap-2">
          <button onClick={onAddPoint} className="px-4 py-2 bg-green-500 text-white rounded">+1</button>
          <button onClick={onRemovePoint} className="px-4 py-2 bg-red-500 text-white rounded">-1</button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Penalty title="Penalidades" labels={["C", "K", "HC", "H"]} active={penalties} onToggle={onTogglePenalty} color={accent} />
        <Penalty title="Jogai" labels={["C", "K", "HC", "H"]} active={jogai} onToggle={onToggleJogai} color={accent} />
      </div>
    </div>
  );
};

export default CompetitorScore;
