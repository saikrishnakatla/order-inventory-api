import { X, Trash2, Plus, Minus, ArrowRight, Loader2, CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../api/orders';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setIsCartOpen(false);
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await createOrder(payload);
      setSuccessOrder(res.data);
      clearCart();
      window.dispatchEvent(new Event('order-placed'));
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.response?.data?.error || 'Failed to place order. Try again.';
      setError(errMsg);
      // Refresh catalog immediately so the user sees the actual remaining stock in MySQL
      window.dispatchEvent(new Event('order-placed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Cart</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {successOrder ? (
              <div className="text-center py-10 px-2">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">Order Confirmed!</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Order ID: <span className="font-mono font-bold text-slate-800">#{successOrder.id}</span>
                </p>
                <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  Thank you, <span className="font-semibold text-slate-800">{successOrder.customerName}</span>. Your order of{' '}
                  <span className="font-bold text-indigo-600">${Number(successOrder.totalAmount).toFixed(2)}</span> has been
                  processed with ACID transaction safety.
                </p>
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      setSuccessOrder(null);
                      setIsCartOpen(false);
                      navigate('/orders');
                    }}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Package className="w-4 h-4" /> View in My Orders
                  </button>
                  <button
                    onClick={() => {
                      setSuccessOrder(null);
                      setIsCartOpen(false);
                    }}
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
                >
                  Start Browsing Products
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                    {error}
                  </div>
                )}

                {cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-semibold text-slate-800 truncate">{product.name}</p>
                      <p className="text-xs text-slate-500">
                        ${Number(product.price).toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1 text-slate-500 hover:bg-white rounded border border-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold w-5 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="p-1 text-slate-500 hover:bg-white rounded border border-slate-200 disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer Checkout */}
          {!successOrder && cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total:</span>
                <span className="text-2xl font-bold text-slate-900">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                  </>
                ) : (
                  <>
                    <span>Checkout Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
