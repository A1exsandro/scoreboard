"use client"
import React from "react"

type PenaltyProps = {
  title: string
  labels: string[]
  active: { [key: string]: boolean }
  onToggle: (key: string) => void
  color?: string
}

const Penalty = ({ title, labels, active, onToggle, color = "indigo" }: PenaltyProps) => {
  return (
    <div className="flex gap-2 justify-between">
      <h3 className="font-bold">{title}</h3>
      <div className="flex gap-3">
        {labels.map((label) => (
          <button
            key={label}
            onClick={() => onToggle(label)}
            className={`px-2 border border-${color}-600 rounded-full cursor-pointer
              ${active[label] ? `bg-${color}-600 text-white` : `bg-transparent text-${color}-600`}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Penalty
