/**
 * Utilitário para filtrar conteúdo inadequado em textos
 */

// Lista de palavras inadequadas para filtrar
const palavrasInadequadas = [
  // Palavrões comuns em português
  'porra', 'caralho', 'merda', 'foda', 'puta', 'buceta', 'cu', 'viado', 'cuzão',
  'cacete', 'piranha', 'vadia', 'bosta', 'corno', 'fdp', 'pqp', 'vsf', 'vtnc',
  // Versões com caracteres especiais ou variações
  'p0rra', 'c4ralh0', 'm3rd4', 'f0d4', 'put4', 'buc3t4', 'v14d0', 'cuz40',
  'c4c3t3', 'p1r4nh4', 'v4d14', 'b0st4', 'c0rn0', 'f.d.p', 'p.q.p', 'v.s.f', 'v.t.n.c'
];

/**
 * Verifica se um texto contém palavras inadequadas
 * @param texto O texto a ser verificado
 * @returns Um objeto indicando se o texto contém palavras inadequadas e quais são elas
 */
export const verificarConteudoInadequado = (texto: string): { valido: boolean; palavrasEncontradas: string[] } => {
  if (!texto) return { valido: true, palavrasEncontradas: [] };
  
  const textoLowerCase = texto.toLowerCase();
  const palavrasEncontradas: string[] = [];
  
  for (const palavra of palavrasInadequadas) {
    // Verifica se a palavra inadequada está presente no texto
    if (textoLowerCase.includes(palavra)) {
      palavrasEncontradas.push(palavra);
    }
    
    // Verifica palavras com espaços ou caracteres entre letras (p o r r a)
    const palavraComEspacos = palavra.split('').join('[\\s\\W]*');
    const regexComEspacos = new RegExp(palavraComEspacos, 'i');
    
    if (regexComEspacos.test(textoLowerCase) && !palavrasEncontradas.includes(palavra)) {
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
 * @param texto O texto a ser censurado
 * @returns O texto com as palavras inadequadas censuradas
 */
export const censurarConteudoInadequado = (texto: string): string => {
  if (!texto) return texto;
  
  let textoFiltrado = texto;
  const textoLowerCase = texto.toLowerCase();
  
  for (const palavra of palavrasInadequadas) {
    // Substitui a palavra por asteriscos
    if (textoLowerCase.includes(palavra)) {
      const regex = new RegExp(palavra, 'gi');
      textoFiltrado = textoFiltrado.replace(regex, '*'.repeat(palavra.length));
    }
  }
  
  return textoFiltrado;
};