import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SubCategory {
  name: string;
  path: string;
}

interface Category {
  name: string;
  path: string;
  subCategories: SubCategory[];
}

const categories: Category[] = [
  {
    name: 'Living Room',
    path: '/category/living-room',
    subCategories: [
      { name: 'Sofa', path: '/category/living-room/sofa' },
      { name: 'Table', path: '/category/living-room/table' },
      { name: 'Cabinet', path: '/category/living-room/cabinet' }
    ]
  },
  {
    name: 'Bedroom',
    path: '/category/bedroom',
    subCategories: [
      { name: 'Bed', path: '/category/bedroom/bed' },
      { name: 'Wardrobe', path: '/category/bedroom/wardrobe' },
      { name: 'Rack', path: '/category/bedroom/rack' }
    ]
  },
  {
    name: 'Dining',
    path: '/category/dining',
    subCategories: [
      { name: 'Table', path: '/category/dining/table' },
      { name: 'Chair', path: '/category/dining/chair' },
      { name: 'Cabinet', path: '/category/dining/cabinet' }
    ]
  }
];

export function Navbar() {
  const { cart, user } = useStore();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed top-0 w-full bg-zinc-900 text-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-serif">LUXE</Link>
          
          <div className="hidden md:flex space-x-8">
            {/* {categories.map((category) => (
              <div
                key={category.name}
                className="relative group"
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <Link
                  to={category.path}
                  className="flex items-center space-x-1 hover:text-gold transition-colors"
                >
                  <span>{category.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Link>
                
                {hoveredCategory === category.name && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    {category.subCategories.map((subCategory) => (
                      <Link
                        key={subCategory.path}
                        to={subCategory.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {subCategory.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))} */}

              {categories.map((category) => (
                <div
                  key={category.name}
                  className="relative"
                  onMouseEnter={() => setHoveredCategory(category.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <Link
                    to={category.path}
                    className="flex items-center space-x-1 hover:text-gold transition-colors"
                  >
                    <span>{category.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Link>

                  {hoveredCategory === category.name && (
                    <div
                      className="absolute left-0 top-full w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-red-400"
                      style={{ marginTop: '0px' }} // ensures NO GAP
                    >
                      {category.subCategories.map((subCategory) => (
                        <Link
                          key={subCategory.path}
                          to={subCategory.path}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          {subCategory.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/orders" className="hover:text-gold transition-colors">Orders</Link>
            <Link to="/cart" className="relative">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link to={user ? "/admin" : "/login"}>
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}