'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderDetail {
  id: number;
  bookId: number;
  bookTitle: string;
  quantity: number;
  price: number;
}

interface OrderFull {
  id: number;
  orderCode: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderDate: string;
  details: OrderDetail[];
  orderDetails: OrderDetail[];
}

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  
  const [order, setOrder] = useState<OrderFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy userId từ token
  const getUserIdFromToken = (): number | null => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log(' No token found');
      return null;
    }
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      console.log(' Token payload:', payload);
      console.log(' User ID from token:', payload.userId);
      
      return payload.userId || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      
      console.log('=== OrderSuccessPage Debug ===');
      console.log('Order ID from params:', orderId);
      console.log('Order ID type:', typeof orderId);
      
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        setError('Vui lòng đăng nhập để xem thông tin đơn hàng');
        setLoading(false);
        return;
      }
      
      if (!orderId) {
        setError('Không tìm thấy mã đơn hàng');
        setLoading(false);
        return;
      }
      
      // Chuyển orderId sang int
      const orderIdInt = parseInt(orderId as string, 10);
      if (isNaN(orderIdInt)) {
        setError('Mã đơn hàng không hợp lệ');
        setLoading(false);
        return;
      }
      
      // Lấy userId từ token
      const userId = getUserIdFromToken();
      console.log('User ID:', userId);
      console.log('Order ID (int):', orderIdInt);
      
      if (!userId) {
        setError('Không thể xác thực người dùng');
        setLoading(false);
        return;
      }
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      //  Gọi đúng API lấy chi tiết 
      const url = `${API_URL}/api/orders/${orderIdInt}?userId=${userId}`;
      console.log('Fetching URL:', url);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const orderData: OrderFull = await response.json();
          console.log(' Order data:', orderData);
          setOrder(orderData);
        } else if (response.status === 404) {
          console.log('Order not found');
          setError('Không tìm thấy đơn hàng');
        } else {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Có lỗi xảy ra</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 text-white text-center">           
            <h1 className="text-2xl font-bold">ĐẶT HÀNG THÀNH CÔNG!</h1>
            <p className="text-green-100 mt-2">Cảm ơn bạn đã mua sắm tại BookStore</p>
          </div>
          
          {/* Body */}
          <div className="p-8">
            {/* Order Info */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 uppercase tracking-wide">Mã đơn hàng</p>
                <p className="text-2xl font-bold text-red-600 font-mono">
                  {order.orderCode}
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="font-semibold text-green-600">
                    {order.status === 'PENDING' ? 'Chờ xử lý' : order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày đặt:</span>
                  <span className="font-semibold">
                    {new Date(order.orderDate).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-semibold">
                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                  <span className="text-gray-600 font-bold">Tổng tiền:</span>
                  <span className="text-xl font-bold text-red-600">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
            
            {/* Order Details */}
            {order.orderDetails && order.orderDetails.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Chi tiết đơn hàng:</h3>
                <div className="space-y-2">
                  {order.orderDetails.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b">
                      <span>{item.bookTitle} x {item.quantity}</span>
                      <span className="font-semibold">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-bold mb-2">Thông tin giao hàng:</h3>
              <p className="text-gray-700"> {order.customerName}</p>
              <p className="text-gray-700"> {order.customerPhone}</p>
              <p className="text-gray-700"> {order.customerAddress}</p>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <Link 
                href="/user/my-orders"
                className="block w-full bg-red-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-red-700 transition"
              >
                 Xem tất cả đơn hàng
              </Link>
              
              <Link 
                href="/"
                className="block w-full border-2 border-red-600 text-red-600 text-center py-3 rounded-xl font-semibold hover:bg-red-50 transition"
              >
                 Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}