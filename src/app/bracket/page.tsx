"use client";
import React, { useState } from "react";
import Scoreboard, { Competitor } from "@/app/scoreboard/page";

// 🔄 converte Competidor (Bracket) → Competitor (Scoreboard)
function toScoreboardCompetitor(
  c: CompetidorBracket,
  color: "red" | "blue"
): Competitor {
  return {
    ...c,
    color,
    score: 0,
    penalties: { C: false, K: false, HC: false, H: false },
    jogai: { C: false, K: false, HC: false, H: false },
  };
}

// Tipos
interface CompetidorBracket {
  name: string;
  dojo: string;
}

interface Luta {
  id: number;
  azul: CompetidorBracket | null;
  vermelho: CompetidorBracket | null;
  vencedor?: CompetidorBracket;
}

interface Rodada {
  id: number;
  lutas: Luta[];
}

const Bracket = () => {
  // 🔹 Lista de competidores hardcoded
  const competidores: CompetidorBracket[] = [
    { name: "Alexsandro", dojo: "Academia Aa" },
    { name: "Alex", dojo: "Academia Bb" },
    { name: "Sandro", dojo: "Academia Cc" },
    { name: "Ale", dojo: "Academia Dd" },
    { name: "Eu", dojo: "Academia Ee" },
    {name: 'lutador6', dojo: 'dojo6'},
    {name: 'lutador7', dojo: 'dojo7'},
    {name: 'lutador8', dojo: 'dojo8'},
    {name: 'lutador9', dojo: 'dojo9'},
    {name: 'lutador10', dojo: 'dojo10'},
    {name: 'lutador11', dojo: 'dojo11'},
  ];

  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [lutaAtual, setLutaAtual] = useState<Luta | null>(null);
  const [campeao, setCampeao] = useState<CompetidorBracket | null>(null);
  const [secondPlace, setSecondPlace] = useState<CompetidorBracket | null>(null);
  const [thirdPlace, setThirdPlace] = useState<CompetidorBracket | null>(null);

  // Competidor fictício para BYE
  
  
  const byeCompetitor: Competitor = {
    name: "BYE",
    dojo: "-",
    color: "red",
    score: 0,
    penalties: { C: false, K: false, HC: false, H: true },
    jogai: { C: false, K: false, HC: false, H: false },
  };

  // 🔹 cria rodada inicial e abre primeira luta automaticamente
  const gerarChaveamento = () => {
    const lutas: Luta[] = [];
    for (let i = 0; i < competidores.length; i += 2) {
      lutas.push({
        id: i / 2,
        azul: competidores[i],
        vermelho: competidores[i + 1] || null,
      });
    }
    const primeiraRodada = { id: 1, lutas };
    setRodadas([primeiraRodada]);
    // abre a primeira luta
    setLutaAtual(primeiraRodada.lutas[0]);
  };

  const selecionarLuta = (luta: Luta) => setLutaAtual(luta);

  const registrarVencedor = (lutaId: number, vencedor: CompetidorBracket) => {
    setRodadas((prev) => {
      const novasRodadas = prev.map((r, i) =>
        i === prev.length - 1
          ? {
              ...r,
              lutas: r.lutas.map((l) =>
                l.id === lutaId ? { ...l, vencedor } : l
              ),
            }
          : r
      );

      const ultimaRodada = novasRodadas[novasRodadas.length - 1];

      if (ultimaRodada?.lutas?.length) {
        const todasDefinidas = ultimaRodada.lutas.every((l) => l.vencedor);

        if (todasDefinidas) {
          const vencedores = ultimaRodada.lutas
            .map((l) => l.vencedor)
            .filter(Boolean) as CompetidorBracket[];

          if (vencedores.length === 1) {
            setCampeao(vencedores[0]);
            const perdedor = ultimaRodada.lutas[0].azul === vencedores[0]
                ? ultimaRodada.lutas[0].vermelho
                : ultimaRodada.lutas[0].azul;
                if (perdedor) setSecondPlace(perdedor);
          } else if (vencedores.length > 1) {
            const novasLutas: Luta[] = [];
            for (let i = 0; i < vencedores.length; i += 2) {
              novasLutas.push({
                id: i / 2,
                azul: vencedores[i],
                vermelho: vencedores[i + 1] || null,
              });
            }
            novasRodadas.push({
              id: novasRodadas.length + 1,
              lutas: novasLutas,
            });
          }
        }
      }

      return novasRodadas;
    });

    setLutaAtual(null);
  };

  return (
    <div className="p-4">
      {!rodadas.length && (
        <button
          onClick={gerarChaveamento}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Gerar chaveamento
        </button>
      )}

      {rodadas.map((r) => (
        <div key={r.id} className="my-4">
          <h2 className="font-bold text-lg">Rodada {r.id}</h2>
          <div className="flex flex-wrap gap-4">
            {r.lutas.map((l) => (
              <div key={l.id} className="p-2 border rounded">
                <p>
                  {l.azul?.name ?? "BYE"} vs {l.vermelho?.name ?? "BYE"}
                </p>
                {!l.vencedor ? (
                  <button
                    onClick={() => selecionarLuta(l)}
                    className="bg-green-500 text-white px-2 py-1 rounded mt-2"
                  >
                    Jogar
                  </button>
                ) : (
                  <p className="text-green-600 font-bold mt-2">
                    ✅ {l.vencedor.name} venceu
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {campeao && (
        <div className="">
            <div className="mt-6 p-4 bg-yellow-300 rounded text-center font-bold text-xl">
                🏆 1º Lugar: {campeao.name} - {campeao.dojo}
            </div>

            <div className="mt-6 p-4 bg-gray-300 rounded text-center font-bold text-xl">
                🥈 2º Lugar: {secondPlace?.name} - {secondPlace?.dojo}
            </div>

            <div className="mt-6 p-4 bg-orange-300 rounded text-center font-bold text-xl">
                🥉 3º Lugar: {thirdPlace?.name} - {thirdPlace?.dojo}
            </div>
        </div>
      )}

      {lutaAtual && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <Scoreboard
              initialCompetitors={[
                toScoreboardCompetitor(lutaAtual.azul!, "blue"),
                lutaAtual.vermelho
                  ? toScoreboardCompetitor(lutaAtual.vermelho, "red")
                  : byeCompetitor,
              ]}
              onFinish={(winner) =>
                registrarVencedor(lutaAtual.id, winner as CompetidorBracket)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Bracket;
