import React from 'react';
import { useCashSession } from './CashSessionContext';
import { Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RequireOpenShift({ children }) {
  const { session, loading, openShift } = useCashSession();

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground text-sm font-medium">Đang tải thông tin ca làm việc...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[500px]">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-rose-100">
          <AlertCircle className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3 text-center">Chưa mở ca làm việc!</h2>
        <p className="text-slate-500 mb-8 max-w-md text-center leading-relaxed">
          Vui lòng mở ca làm việc để thực hiện các thao tác phòng bàn, đặt món và thanh toán.
        </p>
        <Button 
          onClick={openShift}
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 px-8 h-12 text-base font-bold transition-all hover:scale-105 active:scale-95"
        >
          <Clock className="w-5 h-5 mr-2" />
          Mở ca làm việc ngay
        </Button>
      </div>
    );
  }

  return children;
}
