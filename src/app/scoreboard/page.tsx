"use client";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import CompetitorScore from "@/components/CompetitorScore";
import { useSocket } from "@/hooks/useSocket";

export type Competitor = {
  name: string;
  dojo: string;
  color: "red" | "blue";
  score: number;
  penalties: { [key: string]: boolean };
  jogai: { [key: string]: boolean };
};

const labels = ["C", "K", "HC", "H"];

type ScoreboardProps = {
  initialCompetitors?: Competitor[];
  onFinish?: (winner: Competitor) => void;
};

const Scoreboard = ({ initialCompetitors, onFinish }: ScoreboardProps) => {
  const socket = useSocket();
  const [competitors, setCompetitors] = useState<Competitor[]>(
    initialCompetitors || []
  );

  const [matchDuration, setMatchDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(matchDuration);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [admin, setAdmin] = useState(false);

  useLayoutEffect(() => {
    const ua = navigator.userAgent;
    setAdmin(
      /Android|iPhone|iPad|iPod/i.test(ua) ||
        window.location.search.includes("admin=true")
    );
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsRunning(false);
      const winner =
        competitors[0].score > competitors[1].score
          ? competitors[0]
          : competitors[1];
      onFinish?.(winner);
    }
  }, [timeLeft]);

  useEffect(() => {
    competitors.forEach((c, index) => {
      if ((c.penalties["H"] || c.jogai["H"]) && timeLeft > 0) {
        setIsRunning(false);
        const winnerIndex = index === 0 ? 1 : 0;
        const winner = competitors[winnerIndex];
        alert(`${winner.name} venceu! ${c.name} recebeu um "H".`);
        onFinish?.(winner);
      }
    });
  }, [competitors, timeLeft]);

  const updateCompetitor = (i: number, fn: (c: Competitor) => Competitor) =>
    setCompetitors((prev) =>
      prev.map((c, index) => (i === index ? fn(c) : c))
    );

  const handleStart = () => {
    setTimeLeft(matchDuration);
    setIsRunning(true);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center w-full h-full justify-center">
      {admin && (
        <div className="flex justify-center space-x-4 py-4">
          <label>
            Duração:
            <select
              value={matchDuration}
              disabled={isRunning}
              onChange={(e) => setMatchDuration(Number(e.target.value))}
            >
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
              <option value={300}>5 min</option>
            </select>
          </label>
        </div>
      )}

      {/* Cronômetro */}
      <div className="text-center text-5xl font-bold mb-8">
        {formatTime(timeLeft)}
      </div>

      {/* Competidores */}
      <div className="flex justify-around w-full max-w-2xl">
        {competitors.map((c, i) => (
          <CompetitorScore
            key={c.color}
            {...c}
            onAddPoint={() =>
              updateCompetitor(i, (c) => ({ ...c, score: c.score + 1 }))
            }
            onRemovePoint={() =>
              updateCompetitor(i, (c) => ({
                ...c,
                score: Math.max(c.score - 1, 0),
              }))
            }
            onTogglePenalty={(k) =>
              updateCompetitor(i, (c) => ({
                ...c,
                penalties: { ...c.penalties, [k]: !c.penalties[k] },
              }))
            }
            onToggleJogai={(k) =>
              updateCompetitor(i, (c) => ({
                ...c,
                jogai: { ...c.jogai, [k]: !c.jogai[k] },
              }))
            }
            admin={admin}
          />
        ))}
      </div>

      {admin && (
        <div className="flex justify-center space-x-4 py-4 mt-8">
          <button
            onClick={handleStart}
            disabled={isRunning || timeLeft === 0}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Iniciar
          </button>
          <button
            onClick={() => setIsRunning(false)}
            disabled={!isRunning}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Pausar
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(matchDuration);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Resetar
          </button>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
