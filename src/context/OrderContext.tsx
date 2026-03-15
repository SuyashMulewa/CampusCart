/**
 * Provides shared order state for pending purchases so the UI can remember in-progress bids across navigation.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { orders as mockOrders, currentUser } from '@/data/mockData';
import type { ReactNode } from 'react';
import type { Order, Product } from '@/data/mockData';

interface OrderContextType {
  orders: Order[];
  addPendingOrder: (product: Product) => void;
  isProductPending: (productId: string) => boolean;
  cancelOrder: (orderId: string) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const addPendingOrder = useCallback((product: Product) => {
    setOrders(prev => {
      if (prev.some(order => order.product.id === product.id && order.status === 'pending')) {
        return prev;
      }
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        product,
        buyer: currentUser,
        seller: product.seller,
        agreedPrice: product.price,
        originalPrice: product.originalPrice ?? product.price,
        status: 'pending',
        meetupLocation: product.location,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryMethod: 'campus_meetup',
      };
      return [...prev, newOrder];
    });
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'cancelled' } : order
    ));
  }, []);

  const isProductPending = useCallback(
    (productId: string) => {
      return orders.some(order => order.product.id === productId && order.status === 'pending');
    },
    [orders]
  );

  return (
    <OrderContext.Provider value={{ orders, addPendingOrder, isProductPending, cancelOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
