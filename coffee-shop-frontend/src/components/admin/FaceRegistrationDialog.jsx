import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/constants';

const FaceRegistrationDialog = ({ isOpen, onClose, user }) => {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const capture = useCallback(() => {
    const image = webcamRef.current.getScreenshot();
    setImageSrc(image);
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
  };

  const handleRegister = async () => {
    if (!imageSrc || !user) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attendance/register-face/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Đã đăng ký khuôn mặt cho ${user.first_name} thành công!`);
        onClose();
        setImageSrc(null);
      } else {
        throw new Error(data.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt');
      }
    } catch (error) {
      console.error('Lỗi đăng ký khuôn mặt:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi đăng ký khuôn mặt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setImageSrc(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng ký khuôn mặt</DialogTitle>
          <DialogDescription>
            {user ? `Quét khuôn mặt cho nhân viên ${user.first_name} ${user.last_name}` : 'Đang tải...'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 w-full aspect-video flex items-center justify-center">
            {imageSrc ? (
              <img src={imageSrc} alt="Captured face" className="w-full h-full object-cover" />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="flex gap-4">
            {!imageSrc ? (
              <Button type="button" onClick={capture} variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Chụp Ảnh
              </Button>
            ) : (
              <Button type="button" onClick={retake} variant="outline" className="w-full">
                Chụp Lại
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button 
            type="button" 
            onClick={handleRegister} 
            disabled={!imageSrc || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Khuôn Mặt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FaceRegistrationDialog;
