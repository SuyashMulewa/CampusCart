/**
 * Shared API client setup and helper functions for backend communication.
 */
// src/api/client.ts
// All backend communication goes through this file.
// TODO: Replace mock implementations with real API calls when backend is ready.

import type { User, Listing, Transaction } from '@/types/models';

// Simulated in-memory data for MVP
let mockListings: Listing[] = [];
let mockUsers: User[] = [];
let mockTransactions: Transaction[] = [];

export const api = {
  // Listings
  async getListings(params?: Record<string, any>): Promise<Listing[]> {
    // TODO: Replace with real fetch/axios call:
    // return fetch('/api/listings?' + new URLSearchParams(params)).then(r => r.json());
    return Promise.resolve(mockListings);
  },
  async createListing(data: Partial<Listing>): Promise<Listing> {
    // TODO: POST to /api/listings
    const newListing = { ...data, id: Date.now().toString(), status: 'active' } as Listing;
    mockListings.push(newListing);
    return Promise.resolve(newListing);
  },
  async updateListing(id: string, data: Partial<Listing>): Promise<Listing | undefined> {
    // TODO: PUT /api/listings/:id
    const idx = mockListings.findIndex(l => l.id === id);
    if (idx !== -1) {
      mockListings[idx] = { ...mockListings[idx], ...data };
      return Promise.resolve(mockListings[idx]);
    }
    return Promise.resolve(undefined);
  },
  async deleteListing(id: string): Promise<boolean> {
    // TODO: DELETE /api/listings/:id
    mockListings = mockListings.filter(l => l.id !== id);
    return Promise.resolve(true);
  },

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User } | null> {
    // TODO: POST /api/auth/login
    const user = mockUsers.find(u => u.email === email);
    if (user) return { token: 'mock-token', user };
    return null;
  },
  async signup(data: Partial<User>): Promise<{ token: string; user: User }> {
    // TODO: POST /api/auth/signup
    const newUser = { ...data, id: Date.now().toString(), role: 'student' } as User;
    mockUsers.push(newUser);
    return { token: 'mock-token', user: newUser };
  },
  async getMe(token: string): Promise<User | null> {
    // TODO: GET /api/user/me
    return mockUsers[0] || null;
  },

  // Transactions
  async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    // TODO: POST /api/orders
    const newTx = { ...data, id: Date.now().toString(), status: 'pending' } as Transaction;
    mockTransactions.push(newTx);
    return Promise.resolve(newTx);
  },
  async getTransactions(userId: string): Promise<Transaction[]> {
    // TODO: GET /api/orders?userId=...
    return Promise.resolve(mockTransactions.filter(t => t.buyer.id === userId || t.seller.id === userId));
  },
};

