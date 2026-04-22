/**
 * Milk logs and farmers may store farmer_id as string or number after JSON/API round-trips.
 * Always normalize before comparing so lookups (e.g. name by id) stay reliable.
 */
export function normalizeFarmerId(id) {
  if (id == null || id === '') return '';
  return String(id).trim();
}

export function findFarmerInList(farmers, farmerId) {
  const target = normalizeFarmerId(farmerId);
  if (!target || !Array.isArray(farmers)) return undefined;
  return farmers.find((f) => normalizeFarmerId(f.farmer_id) === target);
}

export function getFarmerNameFromList(farmers, farmerId) {
  return findFarmerInList(farmers, farmerId)?.name ?? '';
}
