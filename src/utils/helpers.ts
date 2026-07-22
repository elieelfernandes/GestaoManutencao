// String Normalizer Helper (Remove accents, lowercase, trim)
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Bidirectional status mapper
export function mapUiStatusToDb(status: string | null | undefined): string {
  if (!status) return 'NAO_INICIADO';
  const clean = status.trim();
  if (clean === 'Concluído' || clean === 'CONCLUIDO') return 'CONCLUIDO';
  if (clean === 'Em andamento' || clean === 'EM_ANDAMENTO') return 'EM_ANDAMENTO';
  return 'NAO_INICIADO';
}

export function mapDbStatusToUi(status: string | null | undefined): string {
  if (!status) return 'Não iniciado';
  const clean = status.trim();
  if (clean === 'CONCLUIDO' || clean === 'Concluído') return 'Concluído';
  if (clean === 'EM_ANDAMENTO' || clean === 'Em andamento') return 'Em andamento';
  if (clean === 'ATRASADO' || clean === 'Atrasado') return 'Atrasado';
  return 'Não iniciado';
}
