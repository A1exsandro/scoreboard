"use client";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import CompetitorScore from "@/components/CompetitorScore";
import { useSocket } from "@/hooks/useSocket";

const labels = ["C", "K", "HC", "H"];
const initPenalties = () => Object.fromEntries(labels.map((l) => [l, false]));

type Competitor = {
  name: string;
  dojo: string;
  color: "red" | "blue";
  score: number;
  penalties: { [key: string]: boolean };
  jogai: { [key: string]: boolean };
};

const Scoreboard = () => {
  const socket = useSocket();

  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "Alexsandro", dojo: "Karatech", color: "blue", score: 0, penalties: initPenalties(), jogai: initPenalties() },
    { name: "Rival", dojo: "Shotokan", color: "red", score: 0, penalties: initPenalties(), jogai: initPenalties() },
  ]);

  const [matchDuration, setMatchDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(matchDuration);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [admin, setAdmin] = useState(false);

  // Detecta mobile ou query string ?admin=true
  useLayoutEffect(() => {
    const ua = navigator.userAgent;
    setAdmin(/Android|iPhone|iPad|iPod/i.test(ua) || window.location.search.includes("admin=true"));
  }, []);

  // Cronômetro
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) setIsRunning(false);
  }, [timeLeft]);

  // Penalidade H encerra a luta
  useEffect(() => {
    competitors.forEach((c, index) => {
      if ((c.penalties["H"] || c.jogai["H"]) && timeLeft > 0) {
        setIsRunning(false);
        const winnerIndex = index === 0 ? 1 : 0;
        alert(`${competitors[winnerIndex].name} venceu! ${c.name} recebeu um "H".`);
      }
    });
  }, [competitors, timeLeft]);

  // Envia estado se admin
  useEffect(() => {
    if (socket && admin) {
      socket.emit("update-state", { competitors, timeLeft, isRunning, matchDuration });
    }
  }, [competitors, timeLeft, isRunning, matchDuration, admin, socket]);

  // Recebe estado
  useEffect(() => {
    if (!socket) return;

    const handler = (state: any) => {
      if (!admin) {
        setCompetitors(state.competitors);
        setTimeLeft(state.timeLeft);
        setIsRunning(state.isRunning);
        setMatchDuration(state.matchDuration);
      }
    };

    socket.on("state-updated", handler);

    return () => {
      socket.off("state-updated", handler);
    };
  }, [socket, admin]);

  const updateCompetitor = (i: number, fn: (c: Competitor) => Competitor) =>
    setCompetitors((prev) => prev.map((c, index) => (i === index ? fn(c) : c)));

  const handleStart = () => {
    setTimeLeft(matchDuration);
    setIsRunning(true);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60))}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col w-screen h-screen justify-center">
      {/* {admin && (
        <div className="flex justify-center space-x-4 py-4">
          <label>
            Duração:
            <select value={matchDuration} disabled={isRunning} onChange={(e) => setMatchDuration(Number(e.target.value))}>
              <option value={60}>1 min</option>
              <option value={120}>2 min</option>
              <option value={180}>3 min</option>
              <option value={300}>5 min</option>
            </select>
          </label>
        </div>
      )} */}

      <div className="relative flex">
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-7xl font-bold rounded-full py-4 px-6">
          {formatTime(timeLeft)}
        </div>

        <div className="flex flex-col md:flex-row w-full h-fit gap-20 md:gap-0">
          {competitors.map((c, i) => (
            <CompetitorScore
              key={c.color}
              {...c}
              onAddPoint={() => updateCompetitor(i, (c) => ({ ...c, score: c.score + 1 }))}
              onRemovePoint={() => updateCompetitor(i, (c) => ({ ...c, score: Math.max(c.score - 1, 0) }))}
              onTogglePenalty={(k) => updateCompetitor(i, (c) => ({ ...c, penalties: { ...c.penalties, [k]: !c.penalties[k] } }))}
              onToggleJogai={(k) => updateCompetitor(i, (c) => ({ ...c, jogai: { ...c.jogai, [k]: !c.jogai[k] } }))}
              admin={admin}
            />
          ))}
        </div>
      </div>

      {admin && (
        <div className="flex justify-center space-x-4 py-4">
          <button onClick={handleStart} disabled={isRunning || timeLeft === 0} className="px-4 py-2 bg-green-600 text-white rounded">Iniciar</button>
          <button onClick={() => setIsRunning(false)} disabled={!isRunning} className="px-4 py-2 bg-yellow-500 text-white rounded">Pausar</button>
          <button onClick={() => { setIsRunning(false); setTimeLeft(matchDuration); }} className="px-4 py-2 bg-red-600 text-white rounded">Resetar</button>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
