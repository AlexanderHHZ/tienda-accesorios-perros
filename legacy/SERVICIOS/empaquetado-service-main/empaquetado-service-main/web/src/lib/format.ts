const numbers = new Intl.NumberFormat('es-MX', { maximumSignificantDigits: 10 });
const dates = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimes = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

export const formatNumber = (value: number) => numbers.format(value);
export const formatDate = (value: string) => dates.format(new Date(value));
export const formatDateTime = (value: string) => dateTimes.format(new Date(value));
export const formatId = (id: number) => `EMP-${String(id).padStart(4, '0')}`;
export const sizeLabels = { chico: 'Chico', mediano: 'Mediano', grande: 'Grande' } as const;
