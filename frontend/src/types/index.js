export const normalizeRole = (role) => {
  if (!role) return 'ROLE_USER';
  const upper = role.toUpperCase();
  const withPrefix = upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`;
  return withPrefix === 'ROLE_ADMIN' || withPrefix === 'ROLE_SELLER' ? withPrefix : 'ROLE_USER';
};

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'FAILED',
];

export const PAYMENT_STATUSES = [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
];

export const LISTING_CONDITIONS = [
  { value: 'NEW', label: 'Brand New' },
  { value: 'REFURBISHED', label: 'Certified Refurbished' },
  { value: 'USED_LIKE_NEW', label: 'Used - Like New' },
  { value: 'USED_GOOD', label: 'Used - Good' },
  { value: 'USED_FAIR', label: 'Used - Fair' },
];

export const LISTING_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'OUT_OF_STOCK',
  'PENDING_APPROVAL',
  'REJECTED',
  'ARCHIVED',
];

export const PRODUCT_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'DRAFT',
  'ARCHIVED',
];

export const ADDRESS_TYPES = [
  { value: 'HOME', label: 'Home' },
  { value: 'WORK', label: 'Work / Office' },
  { value: 'OTHER', label: 'Other' },
];
