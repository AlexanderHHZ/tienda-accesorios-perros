import type { RequestKind, RequestRecord, RequestStatus } from '../api/contracts';

export const areas: Record<
  RequestKind,
  { title: string; singular: string; createLabel: string; description: string }
> = {
  returns: {
    title: 'Devoluciones',
    singular: 'devolución',
    createLabel: 'Nueva devolución',
    description: 'Consulta tus solicitudes y da seguimiento a cada devolución.',
  },
  warranties: {
    title: 'Garantías',
    singular: 'garantía',
    createLabel: 'Nueva garantía',
    description: 'Consulta tus solicitudes y registra la resolución de cada garantía.',
  },
};

export const statusLabels: Record<RequestStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  COMPLETED: 'Completada',
};

// Solo guía las acciones de la interfaz. La API vuelve a validar cada transición.
export const nextStatuses: Record<RequestStatus, readonly RequestStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
});

export function requestDate(record: RequestRecord): string {
  return 'date' in record ? record.date : record.requestDate;
}

export function formatDate(date: string, includeTime = false): string {
  return (includeTime ? dateTimeFormatter : dateFormatter).format(new Date(date));
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

export function matchesSearch(record: RequestRecord, query: string): boolean {
  const haystack = [
    `#${record.id}`,
    record.saleId,
    record.productId,
    record.reason,
    statusLabels[record.status],
    ...('resolution' in record ? [record.resolution] : []),
  ].join(' ');
  return normalizeSearch(haystack).includes(normalizeSearch(query));
}
