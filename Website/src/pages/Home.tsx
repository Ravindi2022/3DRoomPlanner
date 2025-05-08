import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function Home() {
  const categories = [
    {
      name: 'Living Room',
      image: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=80',
      link: '/category/living-room'
    },
    {
      name: 'Bedroom',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
      link: '/category/bedroom'
    },
    {
      name: 'Dining',
      image: 'https://images.unsplash.com/photo-1533090368676-1fd25485db88?auto=format&fit=crop&w=800&q=80',
      link: '/category/dining'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="h-screen bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2400&q=80)'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-7xl font-serif mb-6">Luxury Living Redefined</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">Experience the perfect blend of comfort and sophistication with our premium furniture collection.</p>
            <Link
              to="/category/all"
              className="inline-flex items-center px-8 py-3 bg-gold text-black font-semibold rounded hover:bg-opacity-90 transition-colors"
            >
              Explore Collection
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-serif mb-6">Crafted for Distinction</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              At LUXE, we believe that every piece of furniture tells a story. Our artisans combine traditional craftsmanship with contemporary design to create pieces that become the centerpiece of your home.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-serif text-center mb-12">Explore Our Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className="group relative overflow-hidden rounded-lg aspect-square"
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <h3 className="text-2xl font-serif text-white">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}