/**
 * Centralized Date & Boundary Utilities (DRY Principle)
 * Standardizes start/end of day boundaries, date prefixes, and overdue calculations.
 */

function getTodayBounds() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return { todayStart, todayEnd };
}

function getDatePrefixYYMMDD(date = new Date()) {
  const d = new Date(date);
  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function isOverdue(expectedDeliveryDate, currentStatus) {
  if (!expectedDeliveryDate) return false;
  if (['Delivered', 'Cancelled', 'Refund'].includes(currentStatus)) return false;
  return new Date() > new Date(expectedDeliveryDate);
}

module.exports = {
  getTodayBounds,
  getDatePrefixYYMMDD,
  isOverdue
};
