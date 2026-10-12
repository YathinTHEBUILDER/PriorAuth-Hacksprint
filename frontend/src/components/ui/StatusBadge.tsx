import React from 'react';
import { RequestStatus, RequirementStatus, Priority } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus | RequirementStatus | Priority | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-medium',
  }[size];

  // Colors & Badges mapping
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'APPROVED':
    case 'COMPLETE':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotClass = 'bg-emerald-500';
      label = status === 'APPROVED' ? 'Payer Approved' : 'Completed';
      break;
    case 'DENIED':
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
      dotClass = 'bg-rose-500';
      label = 'Payer Denied';
      break;
    case 'MISSING':
    case 'MISSING_INFORMATION':
      bgClass = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClass = 'bg-amber-500';
      label = 'Missing Information';
      break;
    case 'NEEDS_REVIEW':
      bgClass = 'bg-orange-50 text-orange-800 border-orange-200';
      dotClass = 'bg-orange-500';
      label = 'Needs Review';
      break;
    case 'READY_FOR_REVIEW':
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
      dotClass = 'bg-blue-500';
      label = 'Ready for Review';
      break;
    case 'READY_FOR_SUBMISSION':
      bgClass = 'bg-teal-50 text-teal-800 border-teal-200';
      dotClass = 'bg-teal-500';
      label = 'Ready for Submission';
      break;
    case 'SUBMITTED':
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotClass = 'bg-indigo-500';
      label = 'Submitted (Demo)';
      break;
    case 'PENDING':
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200';
      dotClass = 'bg-purple-500';
      label = 'Payer Pending';
      break;
    case 'PROCESSING_DOCUMENTS':
      bgClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      dotClass = 'bg-cyan-500 animate-pulse';
      label = 'Processing Docs';
      break;
    case 'DRAFT':
      bgClass = 'bg-slate-100 text-slate-700 border-slate-300';
      dotClass = 'bg-slate-400';
      label = 'Draft Request';
      break;
    case 'ADDITIONAL_INFO_REQUESTED':
      bgClass = 'bg-yellow-50 text-yellow-800 border-yellow-300';
      dotClass = 'bg-yellow-500';
      label = 'Info Requested';
      break;
    case 'NOT_APPLICABLE':
      bgClass = 'bg-slate-100 text-slate-500 border-slate-200';
      dotClass = 'bg-slate-300';
      label = 'Not Applicable';
      break;
    case 'URGENT':
    case 'EXPEDITED':
      bgClass = 'bg-red-50 text-red-700 border-red-200 font-semibold';
      dotClass = 'bg-red-500 animate-pulse';
      label = status;
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs capitalize ${sizeClasses} ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
};
