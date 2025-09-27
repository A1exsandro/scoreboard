"use client";
import React, { useState } from "react";
import Scoreboard, { Competitor } from "@/app/scoreboard/page";
import jsPDF from "jspdf";

// ----------------------
// Tipos locais
// ----------------------
interface CompetidorBracket {
  name: string;
  dojo: string;
}

interface Luta {
  id: number;
  azul: CompetidorBracket | null;
  vermelho: CompetidorBracket | null;
  vencedor?: CompetidorBracket | null;
  // marca se a luta já foi criada automaticamente (bye) — útil para lógica
  autoWinner?: boolean;
}

interface Rodada {
  id: number;
  lutas: Luta[];
}

// ----------------------
// Helpers
// ----------------------

// converte para o formato que o Scoreboard espera
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

// encontra a primeira luta "real" (com adversário) sem vencedor
function findNextPlayableMatch(rodadas: Rodada[]): Luta | null {
  for (const r of rodadas) {
    for (const l of r.lutas) {
      if (l.vermelho && !l.vencedor) return l;
    }
  }
  return null;
}

// formata texto simples para PDF (pula de linha quando necessário)
function pdfAddTextLine(doc: jsPDF, text: string, pos: { x: number; y: number }) {
  doc.text(text, pos.x, pos.y);
  pos.y += 8;
  if (pos.y > 270) {
    doc.addPage();
    pos.y = 20;
  }
}

// ----------------------
// Componente Bracket
// ----------------------
const Bracket = () => {
  // 🔹 Lista de competidores hardcoded (você passa por props se preferir)
  const competidores: CompetidorBracket[] = [
    { name: "Alexsandro", dojo: "Academia Aa" },
    { name: "Alex", dojo: "Academia Bb" },
    { name: "Sandro", dojo: "Academia Cc" },
    { name: "Ale", dojo: "Academia Dd" },
    { name: "Eu", dojo: "Academia Ee" },
    { name: "lutador6", dojo: "dojo6" },
    { name: "lutador7", dojo: "dojo7" },
    { name: "lutador8", dojo: "dojo8" },
    { name: "lutador9", dojo: "dojo9" },
    { name: "lutador10", dojo: "dojo10" },
    { name: "lutador11", dojo: "dojo11" },
  ];

  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [lutaAtual, setLutaAtual] = useState<Luta | null>(null);
  const [campeao, setCampeao] = useState<CompetidorBracket | null>(null);
  const [secondPlace, setSecondPlace] = useState<CompetidorBracket | null>(null);
  const [thirdPlace, setThirdPlace] = useState<CompetidorBracket | null>(null);

  // Competidor fictício (não será usado como "vencedor" real, só placeholder se necessário)
  const byeCompetitor: Competitor = {
    name: "BYE",
    dojo: "-",
    color: "red",
    score: 0,
    penalties: { C: false, K: false, HC: false, H: false },
    jogai: { C: false, K: false, HC: false, H: false },
  };

  // ----------------------
  // cria uma rodada a partir de uma lista de competidores
  // - emparelha
  // - se houver par sem adversário (bye), marca vencedor automático (azul)
  // ----------------------
  function createRoundFromCompetitors(
    competitorsList: CompetidorBracket[],
    nextRoundId: number
  ): Rodada {
    const lutas: Luta[] = [];
    for (let i = 0; i < competitorsList.length; i += 2) {
      const a = competitorsList[i] ?? null;
      const b = competitorsList[i + 1] ?? null;
      const luta: Luta = {
        id: i / 2,
        azul: a,
        vermelho: b,
      };
      if (a && !b) {
        // passa direto: marca vencedor imediatamente
        luta.vencedor = a;
        luta.autoWinner = true;
      }
      lutas.push(luta);
    }
    return { id: nextRoundId, lutas };
  }

  // ----------------------
  // lógica que processa rodadas depois de atualizar uma luta
  // cria próximas rodadas automaticamente, cria bronze (3º) quando pertinente,
  // define campeão/vice/terceiro quando tudo terminar.
  // ----------------------
  function processAfterUpdate(currentRodadas: Rodada[]) {
    // vamos trabalhar sobre uma cópia mutável
    const novas = currentRodadas.map((r) => ({
      ...r,
      lutas: r.lutas.map((l) => ({ ...l })),
    }));

    // loop: enquanto a última rodada estiver completamente definida, avançar
    while (true) {
      const last = novas[novas.length - 1];
      if (!last) break;

      const lastAllDefined = last.lutas.every((l) => !!l.vencedor);
      if (!lastAllDefined) break; // ainda há lutas pendentes nessa última rodada

      // extrai vencedores da rodada (se match teve vencedor ou azul se bye)
      const winners = last.lutas
        .map((l) => l.vencedor ?? l.azul)
        .filter(Boolean) as CompetidorBracket[];

      // se só sobrou 1 vencedor nessa rodada -> é campeão (caso final)
      if (winners.length === 1 && novas.length >= 1) {
        // última rodada tinha 1 luta (final) — define campeão e vice
        const finalMatch = last.lutas[0];
        const champion = winners[0];
        setCampeao(champion);

        // define vice (o outro do match)
        const vice =
          finalMatch.azul?.name === champion.name
            ? finalMatch.vermelho
            : finalMatch.azul;
        if (vice) setSecondPlace(vice);

        // se existir rodada anterior (semifinal), pegar perdedores para definir 3º via luta de bronze
        if (novas.length >= 2) {
          const semifinal = novas[novas.length - 2];
          const losers = semifinal.lutas
            .map((m) => {
              if (!m.vencedor) return null;
              return m.vencedor!.name === m.azul?.name ? m.vermelho : m.azul;
            })
            .filter(Boolean) as CompetidorBracket[];

          // se já houver luta de bronze gerada (checa por participantes), não duplicar
          if (losers.length === 2) {
            // se terceiro ainda não definido, deixamos para que o usuário jogue a luta de bronze:
            // cria uma rodada de bronze se ainda não existir um match entre esses dois
            const alreadyHasBronze = novas.some((r) =>
              r.lutas.some(
                (lt) =>
                  lt.azul?.name === losers[0].name &&
                  lt.vermelho?.name === losers[1].name
              )
            );
            if (!alreadyHasBronze) {
              const bronzeId = novas.length + 1;
              novas.push({
                id: bronzeId,
                lutas: [
                  { id: 0, azul: losers[0], vermelho: losers[1], vencedor: undefined },
                ],
              });
              // após inserir bronze, também criamos (ou atualizamos) a final se necessário
              // mas a final já está representada por 'last' (que terminou), e o champion foi definido.
            }
          }
        }

        break; // terminou tournament (ou estamos esperando bronze)
      }

      // se há mais de 1 vencedor → criar próxima rodada com esses vencedores
      if (winners.length > 1) {
        // special case: se winners.length === 2 AND last.lutas.length >= 2 => estamos saindo de semifinal
        // então criamos a BRONZE (perdedores da semifinal) + FINAL (winners)
        if (winners.length === 2 && last.lutas.length >= 2) {
          // buscar perdedores da rodada que acabou (last)
          const losers = last.lutas
            .map((m) => {
              if (!m.vencedor) return null;
              return m.vencedor!.name === m.azul?.name ? m.vermelho : m.azul;
            })
            .filter(Boolean) as CompetidorBracket[];

          // só criar bronze se não existir ainda
          const hasBronzeAlready = novas.some((r) =>
            r.lutas.some(
              (lt) =>
                lt.azul?.name === losers[0]?.name &&
                lt.vermelho?.name === losers[1]?.name
            )
          );

          if (losers.length === 2 && !hasBronzeAlready) {
            // bronze rodada
            novas.push({
              id: novas.length + 1,
              lutas: [
                { id: 0, azul: losers[0], vermelho: losers[1], vencedor: undefined },
              ],
            });
          }

          // final rodada (com os 2 winners)
          novas.push({
            id: novas.length + 1,
            lutas: [
              { id: 0, azul: winners[0], vermelho: winners[1], vencedor: undefined },
            ],
          });

          // pronto: saímos do loop e esperamos que usuário jogue bronze/final
          break;
        }

        // caso normal: formar pares a partir dos winners
        const nextLutas: Luta[] = [];
        for (let i = 0; i < winners.length; i += 2) {
          const a = winners[i];
          const b = winners[i + 1] ?? null;
          const luta: Luta = { id: i / 2, azul: a, vermelho: b };
          if (a && !b) {
            luta.vencedor = a; // passa direto
            luta.autoWinner = true;
          }
          nextLutas.push(luta);
        }
        novas.push({ id: novas.length + 1, lutas: nextLutas });

        // continuar o loop (pode acontecer que nextLutas já estejam todos definidos via bye)
        continue;
      }

      break;
    }

    // depois de processar, atualizamos o estado e definimos próxima luta a ser jogada (real)
    setRodadas(novas);

    // escolhe a próxima luta jogável (com adversário)
    const next = findNextPlayableMatch(novas);
    setLutaAtual(next);
  }

  // ----------------------
  // chamada quando uma luta termina no Scoreboard
  // ----------------------
  const registrarVencedor = (lutaId: number, vencedor: CompetidorBracket) => {
    // atualiza a última rodada (a rodada em que a luta ocorreu)
    const novas = rodadas.map((r, idx) =>
      idx === rodadas.length - 1
        ? {
            ...r,
            lutas: r.lutas.map((l) =>
              l.id === lutaId ? { ...l, vencedor } : l
            ),
          }
        : { ...r, lutas: r.lutas.map((l) => ({ ...l })) }
    );

    // aplica lógica de avanço/bronze/final etc
    processAfterUpdate(novas);
  };

  // ----------------------
  // inicia chave e posiciona primeira luta jogável
  // ----------------------
  const gerarChaveamento = () => {
    const primeira = createRoundFromCompetitors(competidores, 1);
    // se existirem auto-winners (byes), createRoundFromCompetitors já marcou vencedor
    setRodadas([primeira]);

    // se houver luta jogável (com adversário), abre a primeira; senão procura próxima rodada
    const next = findNextPlayableMatch([primeira]);
    setLutaAtual(next);
  };

  // ----------------------
  // Gerar PDF do relatório (3 primeiros + rodadas completas)
  // ----------------------
  const gerarPDF = () => {
    if (!campeao) {
      alert("A chave ainda não terminou. Gere o PDF somente após finalizar a chave.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;
    const left = 40;
    doc.setFontSize(18);
    doc.text("Relatório da Chave", 300, y, { align: "center" });
    y += 30;

    doc.setFontSize(14);
    doc.text(`🏆 1º Lugar: ${campeao.name} — ${campeao.dojo}`, left, y);
    y += 20;
    if (secondPlace) {
      doc.text(`🥈 2º Lugar: ${secondPlace.name} — ${secondPlace.dojo}`, left, y);
      y += 20;
    }
    if (thirdPlace) {
      doc.text(`🥉 3º Lugar: ${thirdPlace.name} — ${thirdPlace.dojo}`, left, y);
      y += 28;
    } else {
      y += 8;
    }

    doc.setFontSize(12);
    doc.text("Detalhes das rodadas e lutas:", left, y);
    y += 16;

    for (const rodada of rodadas) {
      doc.setFontSize(13);
      doc.text(`Rodada ${rodada.id}`, left, y);
      y += 16;
      for (const luta of rodada.lutas) {
        const azul = luta.azul ? `${luta.azul.name} (${luta.azul.dojo})` : "BYE";
        const vermelho = luta.vermelho ? `${luta.vermelho.name} (${luta.vermelho.dojo})` : "BYE";
        const vencedor = luta.vencedor ? `${luta.vencedor.name}` : "-";
        const line = `  • ${azul}  vs  ${vermelho}  → vencedor: ${vencedor}`;
        doc.setFontSize(11);
        doc.text(line, left + 6, y);
        y += 14;
        if (y > 750) {
          doc.addPage();
          y = 40;
        }
      }
      y += 8;
    }

    doc.save(`chave_relatorio_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  // ----------------------
  // Render
  // ----------------------
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

      <div className="mt-4 space-y-4">
        {rodadas.map((r) => (
          <div key={r.id} className="my-2">
            <h2 className="font-bold text-lg">Rodada {r.id}</h2>
            <div className="flex flex-wrap gap-4">
              {r.lutas.map((l) => (
                <div key={String(r.id) + "-" + l.id} className="p-2 border rounded w-64">
                  <p className="font-medium">
                    {l.azul?.name ?? "BYE"} vs {l.vermelho?.name ?? "BYE"}
                  </p>

                  {!l.vencedor && l.vermelho ? (
                    <button
                      onClick={() => setLutaAtual(l)}
                      className="bg-green-500 text-white px-2 py-1 rounded mt-2"
                    >
                      Jogar
                    </button>
                  ) : l.vencedor ? (
                    <p className="text-green-600 font-bold mt-2">
                      ✅ {l.vencedor.name} venceu
                    </p>
                  ) : (
                    <p className="text-blue-600 font-bold mt-2">⚡ Avança direto</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {campeao && (
        <div className="mt-6 space-y-3">
          <div className="p-4 bg-yellow-300 rounded text-center font-bold text-xl">
            🏆 1º Lugar: {campeao.name} — {campeao.dojo}
          </div>
          <div className="p-4 bg-gray-300 rounded text-center font-bold text-lg">
            🥈 2º Lugar: {secondPlace?.name ?? "-"}
            {secondPlace ? ` — ${secondPlace.dojo}` : ""}
          </div>
          <div className="p-4 bg-orange-300 rounded text-center font-bold text-lg">
            🥉 3º Lugar: {thirdPlace?.name ?? "-"}
            {thirdPlace ? ` — ${thirdPlace.dojo}` : ""}
          </div>

          <div className="flex justify-center mt-4">
            <button
              onClick={gerarPDF}
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              📄 Gerar Relatório em PDF
            </button>
          </div>
        </div>
      )}

      {/* modal do Scoreboard */}
      {lutaAtual && lutaAtual.vermelho && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded">
            <Scoreboard
              initialCompetitors={[
                toScoreboardCompetitor(lutaAtual.azul!, "blue"),
                toScoreboardCompetitor(lutaAtual.vermelho!, "red"),
              ]}
              onFinish={(winner) => {
                // registra vencedor usando o nome (já convertido)
                registrarVencedor(lutaAtual.id, { name: winner.name, dojo: winner.dojo });
                setLutaAtual(null);
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => setLutaAtual(null)}
                className="text-sm text-gray-600"
              >
                Fechar (não registrar)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bracket;
