import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'pill' | 'solid';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const norm = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['ACTIVE', 'COMPLETED', 'PAID'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (['PENDING', 'PAUSED', 'PARTIALLY_PAID', 'UPCOMING'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (['SENT', 'CONFIRMED', 'DRAFT', 'INVOICE'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200/80';
  } else if (['PAYMENT'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (['OVERDUE', 'FAILED', 'CANCELLED', 'CLOSED'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (['EXPIRED'].includes(norm)) {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  // Format label nicely
  let label = status;
  if (norm === 'ACTIVE') label = 'Active';
  else if (norm === 'COMPLETED') label = 'Completed';
  else if (norm === 'PENDING') label = 'Pending';
  else if (norm === 'PAUSED') label = 'Paused';
  else if (norm === 'SENT') label = 'Sent';
  else if (norm === 'PAID') label = 'Paid';
  else if (norm === 'OVERDUE') label = 'Overdue';
  else if (norm === 'PARTIALLY_PAID') label = 'Partially Paid';
  else if (norm === 'UPCOMING') label = 'Upcoming';
  else if (norm === 'DRAFT') label = 'Draft';
  else if (norm === 'CONVERTED') label = 'Converted';
  else if (norm === 'CLOSED') label = 'Closed';
  else if (norm === 'EXPIRED') label = 'Expired';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      {label}
    </span>
  );
};
