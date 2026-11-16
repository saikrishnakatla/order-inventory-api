import { ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { addToCart, cartItems } = useCart();
  const [added, setAdded] = useState(false);

  // Calculate live available stock taking items in the cart into account
  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const inCartQuantity = cartItem ? cartItem.quantity : 0;
  const availableStock = Math.max(0, product.stock - inCartQuantity);

  const handleAdd = () => {
    if (availableStock <= 0) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const isOutOfStock = product.stock <= 0;
  const isCartFull = !isOutOfStock && availableStock === 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="p-5">
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {product.category}
          </span>

          {isOutOfStock ? (
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">
              Out of stock
            </span>
          ) : isCartFull ? (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              All {product.stock} in cart
            </span>
          ) : isLowStock ? (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" /> Only {availableStock} left
            </span>
          ) : (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {availableStock} in stock
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-1">{product.name}</h3>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">
          ${Number(product.price).toFixed(2)}
        </p>
      </div>

      <div className="p-5 pt-0">
        <button
          onClick={handleAdd}
          disabled={isOutOfStock || isCartFull}
          className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : isCartFull
              ? 'bg-amber-100 text-amber-800 cursor-not-allowed font-semibold'
              : added
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" /> Added to Cart
            </>
          ) : isOutOfStock ? (
            'Sold Out'
          ) : isCartFull ? (
            'Max in Cart'
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
