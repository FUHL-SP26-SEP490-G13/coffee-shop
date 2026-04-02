import { Coffee, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import authenticationService from '@/services/authenticationService';
import orderOnlineService from '@/services/orderOnlineService';
import { PrintableReceipt } from '../PrintableReceipt';

const formatOrderCode = (order) => {
  const id = Number(order?.order_id || order?.id || 0);
  return `#${String(Number.isFinite(id) && id > 0 ? id : 0).padStart(6, '0')}`;
};

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
      <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-none w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95'>
        <div className='bg-gray-800 text-white p-5 text-center'>
          <Coffee size={28} className='mx-auto mb-2 text-amber-400' />
          <p className='text-xs text-gray-400 uppercase tracking-widest'>
            Hóa đơn
          </p>
          <h3 className='font-bold text-xl mt-1'>{formatOrderCode(order)}</h3>
        </div>

        <div className='p-5 space-y-3'>
          <div className='rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>Nhân viên in hóa đơn</p>
            <p className='mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100'>{printerName}</p>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              Tên được lấy tự động từ tài khoản staff đang đăng nhập.
            </p>
          </div>
        </div>

        <div className='p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2'>
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
            disabled={isPreparingPrint}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white font-semibold text-sm hover:bg-gray-900 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
