export const DEPARTMENT_CODES: readonly string[] = [
  ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, '0')).filter((c) => c !== '20'),
  '2A',
  '2B',
  '971',
  '972',
  '973',
  '974',
  '976',
]
