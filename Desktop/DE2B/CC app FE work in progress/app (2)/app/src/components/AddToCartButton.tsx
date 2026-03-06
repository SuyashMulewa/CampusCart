/**
 * Shared add-to-cart button that handles the fade & feedback experience consistently.
 */
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/data/mockData';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

type AddToCartButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  product: Product;
  fadeDuration?: number;
};

export function AddToCartButton({
  product,
  fadeDuration = 300,
  children,
  className,
  ...rest
}: AddToCartButtonProps) {
  const { addToCart, isInCart, removeFromCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const timeoutRef = useRef<number | undefined>();

  const alreadyInCart = isInCart(product.id);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isProcessing) {
      return;
    }
    if (alreadyInCart) {
      setIsProcessing(true);
      removeFromCart(product.id);
      toast.success('Removed from your cart', {
        position: 'bottom-right',
        duration: 2500,
        style: { fontWeight: 'bold' }
      });
      timeoutRef.current = window.setTimeout(() => {
        setIsProcessing(false);
      }, fadeDuration);
      return;
    }
    setIsProcessing(true);
    addToCart(product);
    toast.success('Added to your cart', {
      position: 'bottom-right',
      duration: 2500,
      style: { fontWeight: 'bold' }
    });
    timeoutRef.current = window.setTimeout(() => {
      setIsProcessing(false);
    }, fadeDuration);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        'transition-all duration-300 ease-out disabled:cursor-not-allowed',
        alreadyInCart
          ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100'
          : 'hover:-translate-y-px',
        className
      )}
      {...rest}
    >
      {isProcessing ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : alreadyInCart ? (
        <>
          <Check className="w-5 h-5 mr-2" />
          Remove from Cart
        </>
      ) : children ? (
        children
      ) : (
        <>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
