import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Users, ShoppingBag, MessageSquare } from 'lucide-react';

export function Admin() {
  const navigate = useNavigate();
  const { user } = useStore();

  if (!user?.isAdmin) {
    navigate('/login');
    return null;
  }

  const mockSessions = [
    { id: 1, user: 'John Doe', product: 'Luxe Leather Sofa', duration: '15 minutes' },
    { id: 2, user: 'Jane Smith', product: 'Modern Accent Chair', duration: '8 minutes' }
  ];

  const mockOrders = [
    { id: 'ORD001', customer: 'Alice Johnson', total: 2999, status: 'Processing' },
    { id: 'ORD002', customer: 'Bob Wilson', total: 1798, status: 'Shipped' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <Users className="w-6 h-6 text-gold" />
            <h2 className="text-xl font-semibold">Active Sessions</h2>
          </div>
          <p className="text-3xl font-bold">{mockSessions.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <ShoppingBag className="w-6 h-6 text-gold" />
            <h2 className="text-xl font-semibold">Pending Orders</h2>
          </div>
          <p className="text-3xl font-bold">
            {mockOrders.filter(order => order.status === 'Processing').length}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <MessageSquare className="w-6 h-6 text-gold" />
            <h2 className="text-xl font-semibold">Support Requests</h2>
          </div>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-serif mb-6">Design Studio Sessions</h2>
          <div className="space-y-4">
            {mockSessions.map(session => (
              <div key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{session.user}</p>
                  <p className="text-sm text-gray-600">{session.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p>{session.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-serif mb-6">Recent Orders</h2>
          <div className="space-y-4">
            {mockOrders.map(order => (
              <div key={order.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{order.customer}</p>
                  <p className="text-sm text-gray-600">Order ID: {order.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${order.total}</p>
                  <p className="text-sm text-gray-600">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}