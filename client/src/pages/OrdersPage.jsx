import { useEffect, useState } from 'react';
import { getOrders } from '../api/orders';
import { Package, Clock, CheckCircle, AlertCircle, Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
  // 1. Core State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Fetch orders on initial page mount
  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        setError('');
        const res = await getOrders();
        // res shape: { count: N, data: [...] }
        setOrders(res.data || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError(err.response?.data?.error || 'Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8 text-indigo-600" /> My Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review your order history, purchased items, and live transaction status.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-semibold transition"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>

      {/* Error Alert (Logical AND: renders only if error is non-empty) */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Conditional Rendering Block */}
      {loading ? (
        // State A: Loading Spinner
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-3" />
          <p className="text-sm font-medium">Fetching your orders from MySQL...</p>
        </div>
      ) : orders.length === 0 ? (
        // State B: Empty State (User has no orders yet)
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No orders placed yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            You haven't purchased anything yet. Browse our real-time inventory and place your first order!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        // State C: Orders List (Rendering array with .map())
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id} // Unique key required by React
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:border-slate-300 transition"
            >
              {/* Order Card Top Bar */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">ORDER ID</span>
                    <span className="font-mono font-bold text-slate-800">#{order.id}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">DATE PLACED</span>
                    <span className="text-slate-700 font-medium">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">CUSTOMER</span>
                    <span className="text-slate-700 font-medium">{order.customer_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {order.status || 'Completed'}
                  </span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">TOTAL AMOUNT</span>
                    <span className="text-base font-extrabold text-slate-900">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Purchased Items ({order.items?.length || 0})
                </h4>
                <div className="divide-y divide-slate-100">
                  {order.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600">
                          {item.quantity}x
                        </span>
                        <span className="font-medium text-slate-800">
                          Product #{item.product_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-slate-400 text-xs">
                          ${Number(item.unit_price).toFixed(2)} each
                        </span>
                        <span className="font-bold text-slate-900 w-20 text-right">
                          ${Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
