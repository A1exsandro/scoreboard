type Competidor = {
  id: number;
  name: string;
  dojo: string;
};

type Luta = {
  id: number;
  azul: Competidor | null;
  vermelho: Competidor | null;
  vencedor?: Competidor;
};

type Rodada = {
  id: number;
  lutas: Luta[];
};
