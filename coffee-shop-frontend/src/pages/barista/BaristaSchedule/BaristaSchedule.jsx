import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, Users, User, Coffee, Star } from 'lucide-react';
import { toast } from 'sonner';
import shiftService from '../../../services/shiftService';
import authenticationService from '../../../services/authenticationService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fmtTime = (t) => t?.slice(0, 5) || '';
const getMonday = (d) => {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  return m;
};
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const COLOR_MAP = {
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-800' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', border: 'border-orange-200 dark:border-orange-800' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-800' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', border: 'border-green-200 dark:border-green-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-400', dot: 'bg-teal-500', border: 'border-teal-200 dark:border-teal-800' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-800' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800' },
};
const getColor = (v) => COLOR_MAP[v] || COLOR_MAP.blue;

// ─── Avatar ──────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'sm' }) {
  const initials = name?.split(' ').slice(-1)[0]?.[0]?.toUpperCase() || '?';
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground mt-1">View your upcoming shifts</p>
        </div>

        <div className="space-y-4">
          {baristaShifts.map((shift) => (
            <Card key={shift.id} className={isToday(shift.date) ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isToday(shift.date) ? 'bg-primary text-primary-foreground' : 'bg-accent'
                      }`}
                    >
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {new Date(shift.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{shift.role}</p>
                    </div>
                  </div>
                  {isToday(shift.date) && <Badge>Today</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{calculateDuration(shift.startTime, shift.endTime)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
