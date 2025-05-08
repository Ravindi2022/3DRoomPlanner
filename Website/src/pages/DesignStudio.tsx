import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { products } from '../data/products';
import { Sun, Moon, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

export function DesignStudio() {
  const { productId } = useParams();
  const product = products.find(p => p.id === productId);
  const [lighting, setLighting] = useState<'day' | 'night'>('day');
  const [zoom, setZoom] = useState<'in' | 'out'>('out');
  const [rotation, setRotation] = useState(0);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif mb-8">Design Studio</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className={`relative aspect-video rounded-lg overflow-hidden ${
            lighting === 'night' ? 'bg-gray-900' : 'bg-gray-100'
          }`}>
            <img
              src={product.images[0]}
              alt={product.name}
              className={`w-full h-full object-contain transition-all duration-300 ${
                zoom === 'in' ? 'scale-150' : 'scale-100'
              }`}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-serif mb-6">{product.name}</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Lighting</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setLighting('day')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    lighting === 'day'
                      ? 'bg-gold text-black'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  Day
                </button>
                <button
                  onClick={() => setLighting('night')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    lighting === 'night'
                      ? 'bg-gold text-black'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  Night
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Zoom</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setZoom('in')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    zoom === 'in'
                      ? 'bg-gold text-black'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Maximize2 className="w-5 h-5" />
                  Zoom In
                </button>
                <button
                  onClick={() => setZoom('out')}
                  className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    zoom === 'out'
                      ? 'bg-gold text-black'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Minimize2 className="w-5 h-5" />
                  Zoom Out
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Rotation</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setRotation(0)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                Note: This is a basic visualization. In a production environment,
                this would include more advanced features like room customization,
                material selection, and AR viewing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}