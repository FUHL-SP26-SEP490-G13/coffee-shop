import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Plus, ChevronRight, ChevronLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import tableService from '../../services/tableService';

export function SplitBillModal({ isOpen, onClose, table, activeOrder, onSplitSuccess }) {
  const [splitBills, setSplitBills] = useState([{ id: 'bill_1', name: 'Đơn mới 1', items: {} }]);
  const [activeBillId, setActiveBillId] = useState('bill_1');
  const [splitting, setSplitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSplitBills([{ id: 'bill_1', name: 'Đơn mới 1', items: {} }]);
      setActiveBillId('bill_1');
      setSplitting(false);
    }
  }, [isOpen]);

  const getRemainingQty = (itemId, totalQty) => {
    let used = 0;
    for (const bill of splitBills) {
      used += (bill.items[itemId] || 0);
    }
    return totalQty - used;
  };

  const handleMoveToNewBill = (item) => {
    if (!activeBillId) {
      toast.error('Vui lòng chọn một đơn mới để chuyển món vào');
      return;
    }
    const remaining = getRemainingQty(item.id, item.quantity);
    if (remaining <= 0) return;

    setSplitBills(prev => prev.map(bill => {
      if (bill.id === activeBillId) {
        return {
          ...bill,
          items: {
            ...bill.items,
            [item.id]: (bill.items[item.id] || 0) + 1
          }
        };
      }
      return bill;
    }));
  };

  const handleMoveToOriginal = (billId, item) => {
    setSplitBills(prev => prev.map(bill => {
      if (bill.id === billId) {
        const currentQty = bill.items[item.id] || 0;
        if (currentQty <= 0) return bill;

        const newItems = { ...bill.items };
        if (currentQty === 1) {
          delete newItems[item.id];
        } else {
          newItems[item.id] = currentQty - 1;
        }
        return { ...bill, items: newItems };
      }
      return bill;
    }));
  };

  const addTargetBill = () => {
    const newId = `bill_${Date.now()}`;
    const newName = `Đơn mới ${splitBills.length + 1}`;
    setSplitBills(prev => [...prev, { id: newId, name: newName, items: {} }]);
    setActiveBillId(newId);
  };

  const removeTargetBill = (billId) => {
    setSplitBills(prev => {
      const filtered = prev.filter(b => b.id !== billId);
      if (activeBillId === billId) {
        setActiveBillId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const handleConfirmSplit = async () => {
    const validBills = splitBills.filter(b => Object.keys(b.items).length > 0);
    if (validBills.length === 0) {
      toast.error('Không có đơn nào chứa món để tách');
      return;
    }

    setSplitting(true);
    try {
      const billsPayload = validBills.map(bill => ({
        name: bill.name,
        items: Object.entries(bill.items).map(([id, quantity]) => ({
          order_detail_id: Number(id),
          quantity,
        })),
      }));

      await tableService.splitBill(table.id, { bills: billsPayload });

      toast.success(`Đã tách thành công ${validBills.length} đơn. Vui lòng thanh toán trong cửa sổ tiếp theo.`);
      onSplitSuccess(); // No need for orderIds, the next modal will fetch all unpaid
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tách đơn');
    } finally {
      setSplitting(false);
    }
  };

  if (!isOpen || !activeOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1400px] !w-[95vw] h-[85vh] flex flex-col p-4 bg-white dark:bg-gray-900">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">
            Tách đơn hàng - Bàn {table?.code}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0 mt-4 overflow-hidden">
          {/* Original Bill */}
          <div className="w-1/3 flex flex-col bg-card border rounded-xl shadow-sm dark:shadow-none overflow-hidden flex-shrink-0">
            <div className="bg-muted p-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Đơn gốc</h3>
              <p className="text-xs text-muted-foreground">Nhấn vào món để chuyển sang đơn mới</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {activeOrder.items?.map(item => {
                const remaining = getRemainingQty(item.id, item.quantity);
                if (remaining === 0) return null;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleMoveToNewBill(item)}
                    className="p-2 border rounded-lg bg-background hover:border-amber-400 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Size {item.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold bg-muted px-2 py-0.5 rounded text-sm">sl: {remaining}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>
                );
              })}
              {activeOrder.items?.every(i => getRemainingQty(i.id, i.quantity) === 0) && (
                <div className="text-center p-4 text-muted-foreground text-sm italic">
                  Tất cả món đã được chọn để tách
                </div>
              )}
            </div>
          </div>

          {/* Target Bills */}
          <div className="flex-1 flex gap-4 overflow-x-auto pt-4 pl-4 pb-4 items-start h-full scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {splitBills.map(bill => (
              <div
                key={bill.id}
                className={`w-64 max-h-full flex flex-col bg-card border rounded-xl overflow-hidden flex-shrink-0 transition-all ${activeBillId === bill.id ? 'ring-2 ring-amber-500 shadow-md transform scale-[1.02]' : 'opacity-80 hover:opacity-100 hover:shadow-sm cursor-pointer'}`}
                onClick={() => setActiveBillId(bill.id)}
              >
                <div className={`p-3 border-b border-border flex justify-between items-center ${activeBillId === bill.id ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-muted'}`}>
                  <h3 className={`font-bold text-sm ${activeBillId === bill.id ? 'text-amber-800' : 'text-foreground'}`}>{bill.name}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTargetBill(bill.id); }}
                    className="p-1 text-muted-foreground hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {Object.entries(bill.items).length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground text-sm italic">
                      Trống
                    </div>
                  ) : (
                    activeOrder.items?.filter(i => bill.items[i.id]).map(item => (
                      <div
                        key={item.id}
                        onClick={(e) => { e.stopPropagation(); handleMoveToOriginal(bill.id, item); }}
                        className="p-2 border border-amber-200 dark:border-amber-800/50 rounded-lg bg-background hover:bg-amber-50 dark:bg-amber-900/30 cursor-pointer transition-colors flex items-center justify-between group shadow-sm dark:shadow-none"
                      >
                        <ChevronLeft className="w-3 h-3 text-muted-foreground group-hover:text-red-400 transition-colors" />
                        <div className="flex-1 min-w-0 px-2 text-right">
                          <p className="font-semibold text-xs truncate">{item.name}</p>
                        </div>
                        <span className="font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs flex-shrink-0">
                          {bill.items[item.id]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={addTargetBill}
              className="w-16 h-24 mt-0 rounded-xl border-2 border-dashed border-muted hover:border-amber-400 hover:bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 transition-all text-muted-foreground hover:text-amber-500 shadow-sm dark:shadow-none"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border flex-shrink-0 bg-background -mx-4 -mb-4 px-4 pb-4">
          <Button variant="outline" onClick={onClose} disabled={splitting}>Quay lại</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 font-bold"
            onClick={handleConfirmSplit}
            disabled={splitting || splitBills.every(b => Object.keys(b.items).length === 0)}
          >
            {splitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Xác nhận tách đơn
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
