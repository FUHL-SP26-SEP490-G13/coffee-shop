import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import authenticationService from '@/services/authenticationService';
import orderOnlineService from '@/services/orderOnlineService';
import { PrintableReceipt } from '../PrintableReceipt';

const getDisplayName = (user) => {
  const firstName = String(user?.first_name || '').trim();
  const lastName = String(user?.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user?.username || user?.email || 'Nhân viên';
};

/**
 * @param {{ order: Object, onClose: Function, onPrint?: Function }} props
 */
export function ReceiptModal({ order, onClose, onPrint, autoPrint = false }) {
  const defaultPrinterName = String(order?.printed_by || order?.staff || '').trim();
  const [isPrinting, setIsPrinting] = useState(autoPrint);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [printerName, setPrinterName] = useState(defaultPrinterName || 'Nhân viên');

  useEffect(() => {
    let isMounted = true;

    const loadCurrentStaff = async () => {
      try {
        const res = await authenticationService.getProfile();
        const user = res?.data?.id ? res.data : res?.data?.data || res?.data;
        const displayName = getDisplayName(user);
        if (isMounted && displayName) {
          setPrinterName(displayName);
        }
      } catch {
        if (isMounted && !defaultPrinterName) {
          setPrinterName('Nhân viên');
        }
      }
    };

    loadCurrentStaff();

    return () => {
      isMounted = false;
    };
  }, [defaultPrinterName]);

  const handlePrint = () => {
    if (isPreparingPrint || isPrinting) return;

    setIsPreparingPrint(true);
    setIsPrinting(true);
  };

  const handlePrintSuccess = async (printedOrder) => {
    if (typeof onPrint === 'function') {
      await onPrint(printedOrder);
      return;
    }

    const orderId = Number(printedOrder?.order_id || printedOrder?.id || 0);
    if (!orderId) return;

    try {
      await orderOnlineService.markPrintSuccess(orderId);
    } catch {
      // Keep modal flow smooth even if print status update fails.
    }
  };

  if (isPrinting) {
    const nameToPrint = String(printerName || '').trim() || 'Nhân viên';
    return (
      <PrintableReceipt
        order={{
          ...order,
          printed_by: nameToPrint,
        }}
        onPrintSuccess={handlePrintSuccess}
        onDone={onClose}
      />
    );
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
      <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-none w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 p-4'>
        <div className='flex gap-2'>
          <button
            onClick={handlePrint}
            disabled={isPreparingPrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            <Printer size={16} />
            {isPreparingPrint ? 'Đang xử lý...' : 'In hóa đơn'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white font-semibold text-sm hover:bg-gray-900 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
