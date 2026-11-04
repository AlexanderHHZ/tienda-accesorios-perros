export function positiveInteger(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || !/^[0-9]+$/u.test(value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function formText(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
