/**
 * Shared TypeScript model and domain type definitions used throughout the app.
 */
// src/types/models.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin';
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  seller: User;
  status: 'active' | 'sold';
}

export interface Transaction {
  id: string;
  listingId: string;
  buyer: User;
  seller: User;
  price: number;
  status: 'pending' | 'completed';
}

