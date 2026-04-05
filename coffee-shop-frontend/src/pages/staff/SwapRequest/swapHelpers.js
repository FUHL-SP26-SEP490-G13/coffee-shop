// ─── Shared helpers & constants ──────────────────────────────────────────────

export const fmtTime = (t) => t?.slice(0, 5) || '';

export const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export const fmtDateShort = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

export const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
export const getDayName = (dateStr) => {
  const d = new Date(dateStr);
  return DAY_NAMES[d.getDay()];
};

export const timeAgo = (dateStr) => {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return fmtDate(dateStr);
};

export const COLOR_MAP = {
  red:     { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       border: 'border-red-200 dark:border-red-800',       dot: 'bg-red-500' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  yellow:  { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
  green:   { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   border: 'border-green-200 dark:border-green-800',   dot: 'bg-green-500' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-800',     dot: 'bg-blue-500' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', dot: 'bg-indigo-500' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-900/20',     text: 'text-teal-700 dark:text-teal-400',     border: 'border-teal-200 dark:border-teal-800',     dot: 'bg-teal-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
};
export const getColor = (v) => COLOR_MAP[v] || COLOR_MAP.blue;

import { AlertCircle, CheckCircle, XCircle, Ban } from 'lucide-react';

export const STATUS_CONFIG = {
  pending:   { label: 'Chờ phản hồi', icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  accepted:  { label: 'Đã chấp nhận', icon: CheckCircle,  className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected:  { label: 'Đã từ chối',   icon: XCircle,      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  cancelled: { label: 'Đã hủy',       icon: Ban,          className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};
