export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subCategory: string;
  images: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered';
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
}