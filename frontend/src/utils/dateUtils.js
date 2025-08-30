// Date utility functions for consistent DD/MM/YYYY formatting

/**
 * Convert any date value to DD/MM/YYYY format
 * @param {Date|string|number} value - Date value to format
 * @returns {string} Date in DD/MM/YYYY format
 */
export function formatDDMMYYYY(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Parse DD/MM/YYYY format string to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY format
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export function parseDDMMYYYY(dateString) {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const date = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convert any date value to YYYY-MM-DD format (for input fields)
 * @param {Date|string|number} value - Date value to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export function formatYYYYMMDD(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Convert any date value to YYYY-MM format (for month inputs)
 * @param {Date|string|number} value - Date value to format
 * @returns {string} Date in YYYY-MM format
 */
export function formatYYYYMM(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 7);
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date in YYYY-MM-DD format
 */
export function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month in YYYY-MM format
 */
export function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Format date for display in table cells (DD/MM/YYYY)
 * @param {Date|string|number} value - Date value to format
 * @returns {string} Formatted date string
 */
export function formatDateForDisplay(value) {
  return formatDDMMYYYY(value);
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date|string|number} value - Date value to format
 * @returns {string} Formatted date string
 */
export function formatDateForInput(value) {
  return formatYYYYMMDD(value);
}

/**
 * Format month for input fields (YYYY-MM)
 * @param {Date|string|number} value - Date value to format
 * @returns {string} Formatted month string
 */
export function formatMonthForInput(value) {
  return formatYYYYMM(value);
}
