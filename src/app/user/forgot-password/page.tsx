'use client';

import { useState } from 'react';
import { forgotPassword, verifyOtp } from '@/services/passwordService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const result = await forgotPassword({ email });
      setMessage(result.message);
      setIsSuccess(result.success);
      
      if (result.success) {
        setStep('otp');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      setMessage(error.message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp!');
      setIsSuccess(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage('Mật khẩu phải có ít nhất 6 ký tự!');
      setIsSuccess(false);
      return;
    }
    
    if (otp.length !== 6) {
      setMessage('Mã OTP phải có 6 chữ số!');
      setIsSuccess(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await verifyOtp({ email, otp, newPassword });
      setMessage(result.message);
      setIsSuccess(result.success);
      
      if (result.success) {
        setTimeout(() => {
          router.push('/user/login');
        }, 3000);
      }
    } catch (error: any) {
      setMessage(error.message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      const result = await forgotPassword({ email });
      setMessage(result.message);
      setIsSuccess(result.success);
      if (result.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      setMessage(error.message);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-[420px] max-w-[90%] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          {step === 'email' ? (
            <>
              <h2 className="text-lg font-bold text-gray-800">Quên mật khẩu?</h2>
              <p className="text-xs text-gray-500 mt-1">Nhập email đã đăng ký</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-800">Xác thực OTP</h2>
              <p className="text-xs text-gray-500 mt-1">
                Mã đã gửi đến <span className="font-medium text-blue-600">{email}</span>
              </p>
            </>
          )}
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {/* Message */}
          {message && (
            <div className={`p-2 rounded-lg mb-4 text-xs ${
              isSuccess 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className="flex items-center gap-1">
                {isSuccess ? (
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{message}</span>
              </div>
            </div>
          )}
          
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp}>
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </form>
          )}
          
          {/* Step 2: OTP + New Password */}
          {step === 'otp' && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-3">
                <label className="block text-gray-700 text-xs font-medium mb-1">Mã OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest"
                  placeholder="Nhập OTP"
                  maxLength={6}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-xs font-medium mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-xs font-medium mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
              
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  className={`text-xs ${countdown > 0 ? 'text-gray-400' : 'text-blue-600 hover:underline'}`}
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                </button>
              </div>
            </form>
          )}
          
          {/* Footer */}
          <div className="mt-4 pt-3 border-t text-center">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-xs inline-flex items-center gap-1">       
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}