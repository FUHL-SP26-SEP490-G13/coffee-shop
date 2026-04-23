import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { toast } from 'sonner';

const AttendanceKiosk = () => {
  const webcamRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultStatus, setResultStatus] = useState('success');
  const [message, setMessage] = useState('Đang tải mô hình AI...');
  const [scanMode, setScanMode] = useState(null);
  
  // Trạng thái ủy quyền thiết bị
  const [kioskKey, setKioskKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [inputKey, setInputKey] = useState(localStorage.getItem('kiosk_key') || '');

  // 1. Tải mô hình Blazeface
  useEffect(() => {
    const loadModel = async () => {
      if (!isAuthorized) return; // Không tải AI nếu chưa nhập mã

      try {
        await tf.ready();
        const loadedModel = await blazeface.load();
        setModel(loadedModel);
        setMessage('Sẵn sàng. Vui lòng chọn loại điểm danh.');
        setIsDetecting(false); // Không quét ngay lập tức
      } catch (error) {
        console.error('Error loading blazeface model:', error);
        setMessage('Lỗi tải mô hình nhận diện khuôn mặt.');
      }
    };
    loadModel();
  }, [isAuthorized]);

  const handleAuthorize = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/attendance/verify-kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kioskKey: inputKey })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Mã bảo mật không hợp lệ');
        return;
      }
      
      localStorage.setItem('kiosk_key', inputKey);
      setKioskKey(inputKey);
      setIsAuthorized(true);
      toast.success('Kích hoạt máy chấm công thành công');
    } catch (error) {
      toast.error('Lỗi kết nối đến máy chủ');
    }
  };

  const handleLogoutKiosk = () => {
    localStorage.removeItem('kiosk_key');
    setKioskKey('');
    setIsAuthorized(false);
    setModel(null);
    setIsDetecting(false);
    setShowResult(false);
    setScanMode(null);
  };

  // 2. Hàm gọi API lên Backend
  const handleClockIn = async (imageSrc) => {
    if (isProcessing || showResult) return;
    setIsProcessing(true);
    setShowResult(false);
    setIsDetecting(false); // Tạm dừng quét
    setMessage('Đang nhận diện...');
    
    try {
      // Chuyển base64 thành Blob để gửi dạng multipart/form-data
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      const response = await fetch('http://localhost:5000/api/attendance/clock-face', {
        method: 'POST',
        headers: {
          'x-kiosk-key': kioskKey
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 403) {
         // Sai mã Kiosk
         toast.error(data.message || 'Thiết bị không được ủy quyền');
         handleLogoutKiosk();
         return;
      }

      if (data.success) {
        toast.success(data.message || 'Điểm danh thành công');
        setMessage(data.message);
        setResultStatus('success');
      } else {
        throw new Error(data.message || 'Không thể nhận diện, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Lỗi điểm danh:', error);
      const errorMsg = error.message || 'Không thể nhận diện, vui lòng thử lại';
      toast.error(errorMsg);
      setMessage(errorMsg);
      setResultStatus('error');
    } finally {
      setIsProcessing(false);
      setShowResult(true);
      // Đợi 5 giây rồi trở về màn hình chờ chọn
      setTimeout(() => {
        setShowResult(false);
        setIsDetecting(false); // Không tự động quét tiếp
        setScanMode(null);
        setMessage('Sẵn sàng. Vui lòng chọn loại điểm danh.');
      }, 5000);
    }
  };

  // 3. Quét khuôn mặt liên tục từ camera
  const detectFace = useCallback(async () => {
    if (!model || !isDetecting || isProcessing || showResult) return;
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const predictions = await model.estimateFaces(video, false);

      // Nếu có mặt và tỷ lệ tin cậy cao
      if (predictions.length > 0) {
        const face = predictions[0];
        const confidence = face.probability[0];

        // Nếu chắc chắn > 90% là khuôn mặt và mặt đủ lớn
        if (confidence > 0.9) {
          const width = face.bottomRight[0] - face.topLeft[0];
          // Kích thước mặt phải chiếm ít nhất 100px chiều ngang để tránh nhận diện người ở quá xa
          if (width > 100) {
             const imageSrc = webcamRef.current.getScreenshot();
             if (imageSrc) {
                await handleClockIn(imageSrc);
             }
          }
        }
      }
    }
  }, [model, isDetecting, isProcessing, showResult]);

  useEffect(() => {
    let interval;
    if (isDetecting && !isProcessing && !showResult && isAuthorized) {
      interval = setInterval(() => {
        detectFace();
      }, 500); // Quét mỗi 0.5 giây
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [detectFace, isDetecting, isProcessing, showResult, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl max-w-md w-full shadow-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-2 text-center text-primary">Kích Hoạt Kiosk Điểm Danh</h2>
          <p className="text-gray-400 mb-6 text-center text-sm">Vui lòng nhập mã bảo mật để cho phép thiết bị này hoạt động như một máy chấm công.</p>
          
          <form onSubmit={handleAuthorize} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Nhập mã bảo mật Kiosk..."
                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-600 focus:border-primary focus:outline-none text-white"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold transition-colors"
            >
              Kích Hoạt Thiết Bị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-8 text-center relative w-full max-w-3xl">
        <button 
          onClick={handleLogoutKiosk}
          className="absolute right-0 top-0 text-sm text-gray-500 hover:text-white transition-colors"
        >
          Thoát Kiosk
        </button>
        <h1 className="text-4xl font-bold mb-2 text-primary">Điểm Danh Tự Động</h1>
        <p className="text-gray-400 text-lg">Hệ Thống Nhận Diện Khuôn Mặt - Coffee Shop</p>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(206,160,116,0.3)] border-4 border-gray-800">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 720,
            height: 480,
            facingMode: "user"
          }}
          className="w-[720px] h-[480px] object-cover"
        />
        
        {/* Lớp phủ chứa 2 nút Check In / Check Out khi chưa bắt đầu quét */}
        {!isDetecting && !isProcessing && !showResult && model && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-20 space-y-6">
            <h3 className="text-2xl font-bold text-white mb-2">Vui Lòng Chọn Loại Điểm Danh</h3>
            <div className="flex space-x-6">
              <button
                onClick={() => {
                  setScanMode('checkin');
                  setIsDetecting(true);
                  setMessage('Sẵn sàng. Vui lòng nhìn thẳng vào camera.');
                }}
                className="px-10 py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xl shadow-lg transition-transform hover:scale-105 border-2 border-green-400 flex flex-col items-center"
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                CHECK IN
              </button>
              <button
                onClick={() => {
                  setScanMode('checkout');
                  setIsDetecting(true);
                  setMessage('Sẵn sàng. Vui lòng nhìn thẳng vào camera.');
                }}
                className="px-10 py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xl shadow-lg transition-transform hover:scale-105 border-2 border-amber-400 flex flex-col items-center"
              >
                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                CHECK OUT
              </button>
            </div>
          </div>
        )}

        {/* Khung hướng dẫn mặt */}
        {isDetecting && !isProcessing && !showResult && (
          <>
            <div className="absolute inset-0 border-4 border-dashed border-primary opacity-50 m-16 rounded-[40px] animate-pulse"></div>
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
              <button
                onClick={() => {
                  setIsDetecting(false);
                  setScanMode(null);
                  setMessage('Sẵn sàng. Vui lòng chọn loại điểm danh.');
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold shadow-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                <span>Hủy Quét</span>
              </button>
            </div>
          </>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-30">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary mb-4"></div>
            <p className="text-xl font-semibold text-primary">{message}</p>
          </div>
        )}

        {showResult && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-6 z-40">
            <div className={`p-8 rounded-2xl flex flex-col items-center text-center max-w-md animate-in zoom-in duration-300 ${resultStatus === 'success' ? 'bg-green-900/40 border border-green-500' : 'bg-red-900/40 border border-red-500'}`}>
              {resultStatus === 'success' ? (
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${resultStatus === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {resultStatus === 'success' ? 'Thành Công' : 'Thông Báo'}
              </h3>
              <p className="text-lg text-white font-medium">{message}</p>
              <div className="mt-6 text-sm text-gray-400 animate-pulse">Hệ thống sẽ quay lại màn hình chọn sau vài giây...</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 h-14">
        {!showResult && (
          <div className={`px-6 py-3 rounded-full text-lg font-medium transition-colors ${
            isProcessing ? 'bg-yellow-600' : 'bg-gray-800 text-primary'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceKiosk;

