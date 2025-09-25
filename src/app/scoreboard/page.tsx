"use client"
import { useState, useEffect, useRef } from "react"
import CompetitorScore from "@/components/CompetitorScore"

const labels = ["C", "K", "HC", "H"]
const initPenalties = () => Object.fromEntries(labels.map((l) => [l, false]))

type Competitor = {
  name: string
  dojo: string
  color: "red" | "blue"
  score: number
  penalties: { [key: string]: boolean }
  jogai: { [key: string]: boolean }
}

const Scoreboard = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      name: "Alexsandro",
      dojo: "Karatech",
      color: "blue",
      score: 0,
      penalties: initPenalties(),
      jogai: initPenalties(),
    },
    {
      name: "Rival",
      dojo: "Shotokan",
      color: "red",
      score: 0,
      penalties: initPenalties(),
      jogai: initPenalties(),
    },
  ])

  const [matchDuration, setMatchDuration] = useState(60) // duração em segundos (padrão 1 min)
  const [timeLeft, setTimeLeft] = useState(matchDuration)
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Cronômetro
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  useEffect(() => {
    if (timeLeft === 0) {
      setIsRunning(false)
    }
  }, [timeLeft])

	// Definir a luta pelas penalidades
	useEffect(() => {
  competitors.forEach((c, index) => {
    const hasH =
      c.penalties["H"] || c.jogai["H"]
    if (hasH && timeLeft > 0) {
      // Marca o competidor como perdedor
      setIsRunning(false)
      // Define o outro competidor como vencedor
      const winnerIndex = index === 0 ? 1 : 0
      alert(`${competitors[winnerIndex].name} venceu! ${c.name} recebeu um "H".`)
    }
  })
}, [competitors, timeLeft])

  const updateCompetitor = (index: number, updater: (c: Competitor) => Competitor) => {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === index ? updater(c) : c))
    )
  }

  const getWinner = () => {
    if (timeLeft > 0) return "Combate em andamento..."
    if (competitors[0].score > competitors[1].score) return competitors[0].name
    if (competitors[1].score > competitors[0].score) return competitors[1].name
    return "Empate"
  }

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  const handleStart = () => {
    setTimeLeft(matchDuration) // reseta para duração escolhida
    setIsRunning(true)
  }

  return (
    <div className="flex flex-col w-screen h-screen">
      {/* Cronômetro */}
      <div className="text-center bg-black text-white text-5xl font-bold py-4">
        {formatTime(timeLeft)}
      </div>

      {/* Configuração de tempo */}
      <div className="flex justify-center space-x-4 py-4">
        <label className="flex items-center gap-2">
          Duração:
          <select
            value={matchDuration}
            disabled={isRunning}
            onChange={(e) => setMatchDuration(Number(e.target.value))}
            className="border p-2 rounded"
          >
            <option value={60}>1 min</option>
            <option value={120}>2 min</option>
            <option value={180}>3 min</option>
            <option value={300}>5 min</option>
          </select>
        </label>
      </div>

      {/* Controles do cronômetro */}
      <div className="flex justify-center space-x-4 py-4">
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
            setIsRunning(false)
            setTimeLeft(matchDuration) // reinicia com a duração escolhida
          }}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Resetar
        </button>
      </div>

      {/* Competidores */}
      <div className="flex flex-1">
        {competitors.map((competitor, index) => (
          <CompetitorScore
            key={competitor.color}
            name={competitor.name}
            dojo={competitor.dojo}
            color={competitor.color}
            score={competitor.score}
            penalties={competitor.penalties}
            jogai={competitor.jogai}
            onAddPoint={() =>
              updateCompetitor(index, (c) => ({ ...c, score: c.score + 1 }))
            }
            onRemovePoint={() =>
              updateCompetitor(index, (c) => ({
                ...c,
                score: Math.max(c.score - 1, 0),
              }))
            }
            onTogglePenalty={(key) =>
              updateCompetitor(index, (c) => ({
                ...c,
                penalties: { ...c.penalties, [key]: !c.penalties[key] },
              }))
            }
            onToggleJogai={(key) =>
              updateCompetitor(index, (c) => ({
                ...c,
                jogai: { ...c.jogai, [key]: !c.jogai[key] },
              }))
            }
          />
        ))}
      </div>

      {/* Vencedor */}
      <div className="p-4 text-center bg-gray-200 font-bold text-xl">
        {getWinner()}
      </div>
    </div>
  )
}

export default Scoreboard

