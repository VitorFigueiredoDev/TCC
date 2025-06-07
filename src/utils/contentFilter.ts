const palavrasInadequadas = [
  'porra', 'caralho', 'merda', 'foda', 'puta', 'buceta', 'cu', 'viado', 'cuzão',
  'cacete', 'piranha', 'vadia', 'bosta', 'corno', 'fdp', 'pqp', 'vsf', 'vtnc',
  'p0rra', 'c4ralh0', 'm3rd4', 'f0d4', 'put4', 'buc3t4', 'v14d0', 'cuz40',
  'c4c3t3', 'p1r4nh4', 'v4d14', 'b0st4', 'c0rn0', 'f.d.p', 'p.q.p', 'v.s.f', 'v.t.n.c'
];

const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' '); // Remove símbolos especiais
};

/**
 * Verifica se um texto contém palavras inadequadas
 */
export const verificarConteudoInadequado = (texto: string): { valido: boolean; palavrasEncontradas: string[] } => {
  if (!texto) return { valido: true, palavrasEncontradas: [] };

  const textoNormalizado = normalizarTexto(texto);
  const palavrasEncontradas: string[] = [];

  for (const palavra of palavrasInadequadas) {
    const palavraBase = normalizarTexto(palavra);

    // Expressão segura que verifica espaços entre letras
    const palavraComEspacos = palavraBase.split('').join('[\\s\\W_]*');
    const regex = new RegExp(`(?:\\s|^)${palavraComEspacos}(?:\\s|$)`, 'i');

    if (regex.test(textoNormalizado)) {
      palavrasEncontradas.push(palavra);
    }
  }

  return {
    valido: palavrasEncontradas.length === 0,
    palavrasEncontradas
  };
};

/**
 * Censura palavras inadequadas em um texto
 */
export const censurarConteudoInadequado = (texto: string): string => {
  if (!texto) return texto;

  let resultado = texto;
  const textoNormalizado = normalizarTexto(texto);

  for (const palavra of palavrasInadequadas) {
    const palavraBase = normalizarTexto(palavra);
    const palavraRegex = palavraBase.split('').join('[\\s\\W_]*');
    const regex = new RegExp(`(${palavraRegex})`, 'gi');

    resultado = resultado.replace(regex, match => '*'.repeat(match.length));
  }

  return resultado;
};
