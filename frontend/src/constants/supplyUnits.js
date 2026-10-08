export const SUPPLY_UNIT_OPTIONS = [
  'piece', 'pcs', 'unit', 'set', 'pair', 'box', 'pack', 'ream', 'sheet',
  'bottle', 'can', 'tube', 'roll', 'bag', 'carton', 'bundle', 'dozen',
  'kg', 'g', 'liter', 'ml', 'meter', 'cm', 'lot',
];

const legacyUnitAliases = {
  pieces: 'piece',
  packs: 'pack',
  boxes: 'box',
  reams: 'ream',
  sheets: 'sheet',
  bottles: 'bottle',
  tubes: 'tube',
  rolls: 'roll',
  bags: 'bag',
  cartons: 'carton',
  bundles: 'bundle',
  dozens: 'dozen',
  liters: 'liter',
  meters: 'meter',
};

export function normalizeSupplyUnit(value) {
  const label = String(value || '').trim();
  const normalizedLabel = label.toLowerCase();
  const resolvedLabel = legacyUnitAliases[normalizedLabel] || normalizedLabel;
  const standardUnit = SUPPLY_UNIT_OPTIONS.find((unit) => unit === resolvedLabel);

  return {
    unit: standardUnit || (label ? 'other' : ''),
    customUnit: standardUnit || !label ? '' : label,
  };
}
