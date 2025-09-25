import Penalty from "./Penalty"

type CompetitorScoreProps = {
  name: string
  dojo: string
  color: "red" | "blue"
  score: number
  penalties: { [key: string]: boolean }
  jogai: { [key: string]: boolean }
  onAddPoint: () => void
  onRemovePoint: () => void
  onTogglePenalty: (key: string) => void
  onToggleJogai: (key: string) => void
}

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
}: CompetitorScoreProps) => {
  const bgColor = color === "red" ? "bg-red-300" : "bg-blue-300"
  const accent = color === "red" ? "red" : "blue"

  return (
    <div className={`${bgColor} w-full flex flex-col items-center p-4 gap-4`}>
      <h2 className="text-xl font-bold">{name}</h2>
      <h2 className="text-md italic">{dojo}</h2>
      <h2 className="text-9xl font-extrabold">{score}</h2>

      <div className="flex gap-2">
        <button
          onClick={onAddPoint}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          +1
        </button>
        <button
          onClick={onRemovePoint}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -1
        </button>
      </div>

      <Penalty
        title="Penalidades"
        labels={["C", "K", "HC", "H"]}
        active={penalties}
        onToggle={onTogglePenalty}
        color={accent}
      />

      <Penalty
        title="Jogai"
        labels={["C", "K", "HC", "H"]}
        active={jogai}
        onToggle={onToggleJogai}
        color={accent}
      />
    </div>
  )
}

export default CompetitorScore
