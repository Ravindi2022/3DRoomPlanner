import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Trash2, Plus, Minus } from 'lucide-react';

export function Cart() {
  const { cart, removeFromCart, updateQuantity } = useStore();
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif mb-8">Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-6">Your cart is empty</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-charcoal text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {cart.map(item => (
            <div key={item.product.id} className="flex items-center gap-6 bg-white p-6 rounded-lg shadow-md">
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-32 h-32 object-cover rounded-md"
              />
              
              <div className="flex-1">
                <h3 className="text-xl font-serif mb-2">{item.product.name}</h3>
                <p className="text-gray-600">${item.product.price.toLocaleString()}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateQuantity(item.product.id, Math.max(0, item.quantity - 1))}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          <div className="flex justify-between items-center border-t pt-8">
            <div>
              <p className="text-lg text-gray-600">Total</p>
              <p className="text-3xl font-semibold">${total.toLocaleString()}</p>
            </div>
            
            <Link
              to="/checkout"
              className="px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}