"use client";
import React, { useState } from "react";
import Scoreboard, { Competitor } from "@/app/scoreboard/page";

// 🔄 converte Competidor (bracket) → Competitor (scoreboard)
function toScoreboardCompetitor(
  c: Competidor,
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
interface Competidor {
  name: string;
  dojo: string;
}

interface Luta {
  id: number;
  azul: Competidor | null;
  vermelho: Competidor | null;
  vencedor?: Competidor;
}

interface Rodada {
  id: number;
  lutas: Luta[];
}

const Bracket = ({ competidores }: { competidores: Competidor[] }) => {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [lutaAtual, setLutaAtual] = useState<Luta | null>(null);
  const [campeao, setCampeao] = useState<Competidor | null>(null);

  // 🔹 cria rodada inicial
  const gerarChaveamento = () => {
    const lutas: Luta[] = [];
    for (let i = 0; i < competidores.length; i += 2) {
      lutas.push({
        id: i / 2,
        azul: competidores[i],
        vermelho: competidores[i + 1] || null,
      });
    }
    setRodadas([{ id: 1, lutas }]);
  };

  const selecionarLuta = (luta: Luta) => {
    setLutaAtual(luta);
  };

  // 🔹 registra vencedor e cria próxima rodada quando todos lutaram
  const registrarVencedor = (lutaId: number, vencedor: Competidor) => {
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
      const todasDefinidas = ultimaRodada.lutas.every((l) => l.vencedor);

      if (todasDefinidas) {
        const vencedores = ultimaRodada.lutas.map((l) => l.vencedor!) ?? [];

        if (vencedores.length === 1) {
          // 🔥 temos campeão!
          setCampeao(vencedores[0]);
        } else {
          // cria nova rodada
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

      return novasRodadas;
    });

    setLutaAtual(null); // fecha o placar depois da luta
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
        <div className="mt-6 p-4 bg-yellow-300 rounded text-center font-bold text-xl">
          🏆 Campeão: {campeao.name} ({campeao.dojo})
        </div>
      )}

      {lutaAtual && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            <Scoreboard
              initialCompetitors={[
                toScoreboardCompetitor(lutaAtual.azul!, "blue"),
                toScoreboardCompetitor(lutaAtual.vermelho!, "red"),
              ]}
              onFinish={(winner) =>
                registrarVencedor(lutaAtual.id, winner as Competidor)
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Bracket;
