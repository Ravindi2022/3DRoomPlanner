import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useStore } from '../store/useStore';
import { ArrowRight, ShoppingCart } from 'lucide-react';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useStore();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          {product.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${product.name} - View ${index + 1}`}
              className="w-full rounded-lg shadow-md"
            />
          ))}
        </div>
        
        <div>
          <h1 className="text-4xl font-serif mb-4">{product.name}</h1>
          <p className="text-3xl font-semibold text-charcoal mb-6">
            ${product.price.toLocaleString()}
          </p>
          <p className="text-gray-600 mb-8">{product.description}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                addToCart(product);
                navigate('/cart');
              }}
              className="w-full flex items-center justify-center px-8 py-4 bg-charcoal text-white font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </button>
            
            <Link
              to={`/design-studio/${product.id}`}
              className="w-full flex items-center justify-center px-8 py-4 bg-gold text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors"
            >
              View in Design Studio
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}