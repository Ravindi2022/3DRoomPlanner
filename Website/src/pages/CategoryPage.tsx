import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';

interface SubCategoryCard {
  name: string;
  path: string;
  image: string;
}

const subCategoryMap: Record<string, SubCategoryCard[]> = {
  'living-room': [
    { name: 'Sofa', path: '/category/living-room/sofa', image: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=80' },
    { name: 'Table', path: '/category/living-room/table', image: 'https://images.unsplash.com/photo-1533090368676-1fd25485db88?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cabinet', path: '/category/living-room/cabinet', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80' }
  ],
  'bedroom': [
    { name: 'Bed', path: '/category/bedroom/bed', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80' },
    { name: 'Wardrobe', path: '/category/bedroom/wardrobe', image: 'https://images.unsplash.com/photo-1558997519-83c9716b1aca?auto=format&fit=crop&w=800&q=80' },
    { name: 'Rack', path: '/category/bedroom/rack', image: 'https://images.unsplash.com/photo-1628177142898-93d4c86c4a16?auto=format&fit=crop&w=800&q=80' }
  ],
  'dining': [
    { name: 'Table', path: '/category/dining/table', image: 'https://images.unsplash.com/photo-1533090368676-1fd25485db88?auto=format&fit=crop&w=800&q=80' },
    { name: 'Chair', path: '/category/dining/chair', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cabinet', path: '/category/dining/cabinet', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80' }
  ]
};

export function CategoryPage() {
  const { category, subcategory } = useParams();
  
  const filteredProducts = products.filter(product => {
    if (subcategory) {
      return product.category === category && product.subCategory === subcategory;
    }
    if (category === 'all') {
      return true;
    }
    return product.category === category;
  });

  const title = subcategory 
    ? `${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}s`
    : category === 'all'
    ? 'All Products'
    : category?.charAt(0).toUpperCase() + category?.slice(1);

  // If we're on a main category page, show subcategories instead of products
  if (category && category !== 'all' && !subcategory && subCategoryMap[category]) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif mb-8">{title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subCategoryMap[category].map((subCat) => (
            <Link
              key={subCat.path}
              to={subCat.path}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <div className="aspect-w-4 aspect-h-3">
                  <img
                    src={subCat.image}
                    alt={subCat.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-serif text-center">{subCat.name}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif mb-8">{title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="aspect-w-4 aspect-h-3">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-64 object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-serif mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <p className="text-2xl font-semibold text-charcoal">${product.price.toLocaleString()}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}