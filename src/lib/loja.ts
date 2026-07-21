export const NOME_PADRAO = "Hermess";

export interface LojaBrand {
  nome: string;
  logoUrl: string | null;
}

/**
 * Identidade exibida no login, no painel e na vitrine.
 * Hoje devolve o padrão; a Fase 11 troca a fonte para a tabela `loja_info`
 * sem que as telas que consomem isto precisem mudar.
 */
export async function getLojaBrand(): Promise<LojaBrand> {
  return { nome: NOME_PADRAO, logoUrl: null };
}
