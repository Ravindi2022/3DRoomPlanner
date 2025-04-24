import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function Login() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in production, this would validate against a backend
    if (formData.email === 'admin@luxe.com' && formData.password === 'admin') {
      setUser({
        id: '1',
        email: formData.email,
        isAdmin: true
      });
      navigate('/admin');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif mb-8 text-center">Admin Login</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gold"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-charcoal text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Login
          </button>
        </div>
      </form>
      
      <p className="mt-4 text-sm text-gray-600 text-center">
        Demo credentials: admin@luxe.com / admin
      </p>
    </div>
  );
}