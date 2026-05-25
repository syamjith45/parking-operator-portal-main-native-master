export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const normalizeVehicleType = (type) => {
  if (!type) return 'bike';
  const lower = type.toLowerCase();
  if (lower === 'car' || lower.includes('four_wheeler') || lower.includes('four-wheeler')) return 'car';
  if (lower === 'bike' || lower.includes('two_wheeler') || lower.includes('two-wheeler')) return 'bike';
  return lower;
};

export const formatVehicleType = (type) => {
  if (!type) return '';
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const decodeJWT = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
};
