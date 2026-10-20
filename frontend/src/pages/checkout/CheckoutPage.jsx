import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { cartApi } from '../../api/cart';
import { ordersApi } from '../../api/orders';
import { productsApi } from '../../api/products';
import { userApi } from '../../api/user';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  PackageCheck,
  Phone,
  User,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Package,
  ShoppingBag,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Info,
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badges';

const EMPTY_ADDRESS_FORM = {
  recipientName: '',
  phone: '',
  addressType: 'HOME',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  countryCode: 'IN',
  isDefault: false,
};

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [activeStep, setActiveStep] = useState(2);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [deleteConfirmAddrId, setDeleteConfirmAddrId] = useState(null);
  const [deleteAddrLoading, setDeleteAddrLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [modalFormData, setModalFormData] = useState(EMPTY_ADDRESS_FORM);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  const [manualForm, setManualForm] = useState(EMPTY_ADDRESS_FORM);
  const [saveToBook, setSaveToBook] = useState(true);

  const [customerNote, setCustomerNote] = useState('');

  const [checkoutIdempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'idemp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
  );

  useEffect(() => {
    loadCart();
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setAddressLoading(true);
      const res = await userApi.getAddresses();
      const addrs = Array.isArray(res.data) ? res.data : [];
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        setSelectedAddressId((current) => {
          if (current && addrs.some((a) => a.id === current)) return current;
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          return defaultAddr.id;
        });
      }
    } catch {} finally {
      setAddressLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.getCart();
      const cartData = res.data?.data || res.data || null;
      if (cartData?.items?.length) {
        const hydratedItems = await Promise.all(
          cartData.items.map(async (item) => {
            if (item.product?.name || item.productName) return item;
            try {
              const pRes = await productsApi.getProductById(item.productId);
              const p = pRes.data?.data || pRes.data;
              return { ...item, product: p, productName: p?.name || item.productName };
            } catch {
              return item;
            }
          })
        );
        cartData.items = hydratedItems;
      }
      setCart(cartData);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: { pathname: '/checkout' } } });
      } else {
        setError('Failed to load your cart. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((acc, item) => {
      const price = item.price || item.unitPrice || 0;
      return acc + Number(item.subtotal ?? price * item.quantity);
    }, 0);
  };

  const calculateTotalUnits = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setModalFormData(EMPTY_ADDRESS_FORM);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr, e) => {
    if (e) e.stopPropagation();
    setEditingAddress(addr);
    setModalFormData({
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      addressType: addr.addressType || 'HOME',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'India',
      countryCode: addr.countryCode || 'IN',
      isDefault: Boolean(addr.isDefault),
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    setModalError(null);
  };

  const handleSaveModalAddress = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    if (!modalFormData.recipientName.trim()) {
      setModalError('Recipient name is required.');
      setModalSubmitting(false);
      return;
    }
    if (!modalFormData.phone.trim()) {
      setModalError('Contact phone number is required.');
      setModalSubmitting(false);
      return;
    }
    if (!modalFormData.addressLine1.trim()) {
      setModalError('Address line 1 is required.');
      setModalSubmitting(false);
      return;
    }
    if (!modalFormData.city.trim()) {
      setModalError('City is required.');
      setModalSubmitting(false);
      return;
    }
    if (!modalFormData.state.trim()) {
      setModalError('State is required.');
      setModalSubmitting(false);
      return;
    }
    if (!modalFormData.postalCode.trim()) {
      setModalError('Postal code is required.');
      setModalSubmitting(false);
      return;
    }

    const payload = {
      ...modalFormData,
      countryCode: (modalFormData.countryCode || 'IN').toUpperCase(),
    };

    try {
      if (editingAddress) {
        const res = await userApi.updateAddress(editingAddress.id, payload);
        const updated = res.data?.data || res.data;
        setSavedAddresses((prev) =>
          prev.map((a) => (a.id === editingAddress.id ? { ...a, ...payload, id: editingAddress.id } : a))
        );
      } else {
        const res = await userApi.addAddress(payload);
        const created = res.data?.data || res.data;
        const newAddr = created?.id ? created : { ...payload, id: 'temp-' + Date.now() };
        setSavedAddresses((prev) => [newAddr, ...prev]);
        setSelectedAddressId(newAddr.id);
      }
      handleCloseModal();
      loadAddresses();
    } catch (err) {
      setModalError(
        err.response?.data?.message || err.response?.data?.error || 'Failed to save address.'
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (addressId, e) => {
    if (e) e.stopPropagation();
    try {
      await userApi.setDefaultAddress(addressId);
      setSavedAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update default address.');
    }
  };

  const handleDeleteAddress = (addressId, e) => {
    if (e) e.stopPropagation();
    setDeleteConfirmAddrId(addressId);
  };

  const executeDeleteAddress = async () => {
    if (!deleteConfirmAddrId) return;
    setDeleteAddrLoading(true);
    try {
      await userApi.deleteAddress(deleteConfirmAddrId);
      setSavedAddresses((prev) => {
        const filtered = prev.filter((a) => a.id !== deleteConfirmAddrId);
        if (selectedAddressId === deleteConfirmAddrId && filtered.length > 0) {
          setSelectedAddressId(filtered[0].id);
        } else if (filtered.length === 0) {
          setSelectedAddressId(null);
        }
        return filtered;
      });
      setDeleteConfirmAddrId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address.');
      setDeleteConfirmAddrId(null);
    } finally {
      setDeleteAddrLoading(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    let shippingAddressPayload = null;

    if (savedAddresses.length > 0) {
      const activeAddress = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!activeAddress) {
        setError('Please select a delivery address to proceed.');
        setActiveStep(2);
        return;
      }
      shippingAddressPayload = {
        fullName: activeAddress.recipientName,
        phone: activeAddress.phone || '',
        line1: activeAddress.addressLine1,
        line2: activeAddress.addressLine2 || '',
        city: activeAddress.city,
        state: activeAddress.state,
        postalCode: activeAddress.postalCode,
        countryCode: (activeAddress.countryCode || 'IN').toUpperCase(),
      };
    } else {
      if (!manualForm.recipientName || !manualForm.phone || !manualForm.addressLine1 || !manualForm.city || !manualForm.postalCode) {
        setError('Please complete all required shipping address fields.');
        setActiveStep(2);
        return;
      }
      shippingAddressPayload = {
        fullName: manualForm.recipientName,
        phone: manualForm.phone || '',
        line1: manualForm.addressLine1,
        line2: manualForm.addressLine2 || '',
        city: manualForm.city,
        state: manualForm.state,
        postalCode: manualForm.postalCode,
        countryCode: (manualForm.countryCode || 'IN').toUpperCase(),
      };
      if (saveToBook) {
        try {
          await userApi.addAddress({
            ...manualForm,
            countryCode: (manualForm.countryCode || 'IN').toUpperCase(),
          });
        } catch {}
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        shippingAddress: shippingAddressPayload,
        customerNote: customerNote.trim() || undefined,
        currencyCode: 'INR',
      };

      const res = await ordersApi.checkoutCart(payload, checkoutIdempotencyKey);
      const createdOrder = res.data?.data || res.data;
      setOrderSuccess(createdOrder);

      window.dispatchEvent(new CustomEvent('cart:updated'));
      if (outletContext?.refreshCounts) {
        outletContext.refreshCounts();
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Order placement failed. Please verify item stock availability and try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-3">
            <div className="h-14 bg-white border border-slate-200 rounded-xl" />
            <div className="h-56 bg-white border border-slate-200 rounded-xl" />
            <div className="h-32 bg-white border border-slate-200 rounded-xl" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-white border border-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    const orderId = orderSuccess.id || orderSuccess.orderId;
    const orderNumber = orderSuccess.orderNumber || (orderId ? `ORD-${orderId.substring(0, 8)}` : 'Confirmed');
    const orderItems = orderSuccess.items || cart?.items || [];

    return (
      <div className="max-w-3xl mx-auto py-8 px-3 sm:px-6 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Order Placed Successfully!
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Your marketplace order has been recorded. Merchant inventory is atomically reserved.
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">Payment Status: PENDING</span>
              <p className="text-[11px] text-amber-800 leading-normal">
                Online payment processing is currently not integrated. No funds were charged. Settlement or invoice processing will be coordinated per order status.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">Order Reference</span>
              <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">Order Status</span>
              <StatusBadge status={orderSuccess.status || 'PENDING'} size="xs" />
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-500">Payment Status</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                {orderSuccess.paymentStatus || 'PENDING'}
              </span>
            </div>

            {orderSuccess.shipFullName && (
              <div className="flex justify-between items-start py-1 border-b border-slate-200/60">
                <span className="font-semibold text-slate-500 shrink-0">Delivery Address</span>
                <span className="text-right text-slate-800 text-xs max-w-xs font-medium">
                  {orderSuccess.shipFullName}, {orderSuccess.shipLine1}
                  {orderSuccess.shipLine2 ? `, ${orderSuccess.shipLine2}` : ''}, {orderSuccess.shipCity}, {orderSuccess.shipState} - {orderSuccess.shipPostalCode}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 pt-2">
              <span className="font-bold text-slate-700">Total Amount</span>
              <span className="font-black text-slate-900 text-base">
                ₹{Number(orderSuccess.grandTotal || calculateSubtotal()).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {orderItems.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-left">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
                <span>Ordered Items ({orderItems.length})</span>
                <span>Qty & Price</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {orderItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.productImageUrl || item.product?.imageUrl ? (
                          <img
                            src={item.productImageUrl || item.product?.imageUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-800 truncate">
                        {item.productName || item.product?.name || `Item #${item.listingId || idx}`}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-500 text-[11px]">Qty: {item.quantity} × </span>
                      <span className="font-bold text-slate-900">
                        ₹{Number(item.unitPrice || item.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            {orderId && (
              <Link to={`/orders/${orderId}`}>
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <PackageCheck className="w-4 h-4 mr-1.5" /> View Order Details
                </Button>
              </Link>
            )}
            <Link to="/orders">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                My Orders
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                Continue Shopping →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            There are no items ready for checkout. Add products from the catalog to continue.
          </p>
        </div>
        <Link to="/products">
          <Button variant="primary" size="sm">
            Explore Catalog <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const totalUnits = calculateTotalUnits();
  const grandTotal = subtotal;

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-16">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <Link
            to="/cart"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200"
            title="Return to cart"
            aria-label="Return to cart"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Checkout
          </h1>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium hidden sm:inline">Secure Checkout</span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Checkout Notice: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-3.5 bg-slate-50/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  LOGIN
                </span>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="font-bold text-slate-900">
                  {user?.fullName || user?.name || user?.email || 'Customer'}
                </span>
                {user?.email && (
                  <span className="text-slate-400 hidden sm:inline">({user.email})</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div
              className={`p-3.5 flex items-center justify-between text-xs ${
                activeStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-50/70 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    activeStep === 2 ? 'bg-white text-indigo-700' : 'bg-slate-900 text-white'
                  }`}
                >
                  2
                </span>
                <span
                  className={`font-bold uppercase tracking-wider text-[11px] ${
                    activeStep === 2 ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  DELIVERY ADDRESS
                </span>
                {activeStep > 2 && selectedAddress && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                )}
              </div>

              {activeStep > 2 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition"
                >
                  CHANGE
                </button>
              )}
            </div>

            {activeStep > 2 && selectedAddress && (
              <div className="p-3.5 text-xs text-slate-700 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-slate-900 mr-2">{selectedAddress.recipientName}</span>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-2">
                    {selectedAddress.addressType || 'HOME'}
                  </span>
                  <span>
                    {selectedAddress.addressLine1}
                    {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''},{' '}
                    {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                  </span>
                  {selectedAddress.phone && (
                    <span className="block text-slate-500 text-[11px] mt-0.5 font-medium">
                      Phone: {selectedAddress.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="p-4 space-y-4">
                {savedAddresses.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-600">
                        Select Delivery Address ({savedAddresses.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Address
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-3 rounded-lg cursor-pointer transition flex items-start gap-3 ${
                              isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {addr.recipientName}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                  {addr.addressType || 'HOME'}
                                </span>
                                {addr.isDefault && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                                    Default
                                  </span>
                                )}
                                {addr.phone && (
                                  <span className="text-[11px] text-slate-500 ml-auto font-medium">
                                    {addr.phone}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-600 leading-normal">
                                {addr.addressLine1}
                                {addr.addressLine2 ? `, ${addr.addressLine2}` : ''},{' '}
                                {addr.city}, {addr.state} -{' '}
                                <span className="font-bold text-slate-800">{addr.postalCode}</span>
                              </p>

                              <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100/80">
                                <div>
                                  {isSelected && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveStep(3);
                                      }}
                                      className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-black uppercase tracking-wider shadow-xs transition"
                                    >
                                      DELIVER HERE
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px]">
                                  {!addr.isDefault && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                      className="text-slate-500 hover:text-indigo-600 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100"
                                      title="Set as primary address"
                                    >
                                      Make Default
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenEditModal(addr, e)}
                                    className="text-slate-600 hover:text-indigo-600 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100 inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteAddress(addr.id, e)}
                                    className="text-slate-400 hover:text-rose-600 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-50 inline-flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Enter your shipping address to proceed with checkout.</span>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={manualForm.recipientName}
                          onChange={(e) => setManualForm({ ...manualForm, recipientName: e.target.value })}
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          10-digit Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={manualForm.phone}
                          onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          value={manualForm.postalCode}
                          onChange={(e) => setManualForm({ ...manualForm, postalCode: e.target.value })}
                          placeholder="6 digits [0-9] PIN code"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          Address Type
                        </label>
                        <select
                          value={manualForm.addressType}
                          onChange={(e) => setManualForm({ ...manualForm, addressType: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                          <option value="HOME">Home (All Day Delivery)</option>
                          <option value="WORK">Work (Delivery between 10 AM - 5 PM)</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Street Address (House No, Building, Street, Area) *
                      </label>
                      <input
                        type="text"
                        required
                        value={manualForm.addressLine1}
                        onChange={(e) => setManualForm({ ...manualForm, addressLine1: e.target.value })}
                        placeholder="Flat, House No., Building, Company, Apartment"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Landmark / Locality (Optional)
                      </label>
                      <input
                        type="text"
                        value={manualForm.addressLine2}
                        onChange={(e) => setManualForm({ ...manualForm, addressLine2: e.target.value })}
                        placeholder="Near landmark, sector"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          City / District *
                        </label>
                        <input
                          type="text"
                          required
                          value={manualForm.city}
                          onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                          placeholder="City"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={manualForm.state}
                          onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                          placeholder="State"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveToBook}
                          onChange={(e) => setSaveToBook(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Save this address to my account for future orders</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          if (!manualForm.recipientName || !manualForm.phone || !manualForm.addressLine1 || !manualForm.city || !manualForm.postalCode) {
                            setError('Please fill in all required address fields.');
                            return;
                          }
                          setActiveStep(3);
                        }}
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold uppercase tracking-wider"
                      >
                        SAVE & DELIVER HERE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div
              className={`p-3.5 flex items-center justify-between text-xs ${
                activeStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-50/70 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    activeStep === 3 ? 'bg-white text-indigo-700' : 'bg-slate-900 text-white'
                  }`}
                >
                  3
                </span>
                <span
                  className={`font-bold uppercase tracking-wider text-[11px] ${
                    activeStep === 3 ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  ORDER SUMMARY
                </span>
                {activeStep > 3 && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                )}
              </div>

              {activeStep > 3 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 bg-white border border-indigo-200 rounded hover:bg-indigo-50 transition"
                >
                  CHANGE
                </button>
              )}
            </div>

            {activeStep > 3 && (
              <div className="p-3.5 text-xs text-slate-700 flex justify-between items-center">
                <span>
                  <strong className="text-slate-900">{items.length}</strong> {items.length === 1 ? 'item' : 'items'} ({totalUnits} total units)
                </span>
                <span className="font-bold text-slate-900">
                  ₹{Number(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {activeStep === 3 && (
              <div className="p-4 space-y-4">
                <div className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const itemPrice = item.price || item.unitPrice || 0;
                    const lineTotal = item.subtotal ?? itemPrice * item.quantity;
                    const itemImg = item.product?.imageUrl || item.productImageUrl;
                    const itemName = item.product?.name || item.productName || `Listing #${item.listingId}`;

                    return (
                      <div key={item.id || idx} className="py-3 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden p-1">
                            {itemImg ? (
                              <img src={itemImg} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-300 stroke-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/products/${item.productId}`}
                              className="font-bold text-slate-900 text-xs sm:text-sm hover:text-indigo-600 transition line-clamp-1 block"
                            >
                              {itemName}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>Qty: <strong className="text-slate-800">{item.quantity}</strong></span>
                              <span>•</span>
                              <span className="font-mono">
                                Seller #{item.sellerId ? item.sellerId.substring(0, 8) : 'Direct'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              ₹{Number(itemPrice).toLocaleString('en-IN')} each
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                            ₹{Number(lineTotal).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Delivery Instructions / Customer Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. Leave package with reception, call on arrival..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 transition resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Up to 1,000 characters</span>
                    <span className="font-mono">{customerNote.length}/1000</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold uppercase tracking-wider shadow-xs transition"
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div
              className={`p-3.5 flex items-center justify-between text-xs ${
                activeStep === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-50/70 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    activeStep === 4 ? 'bg-white text-indigo-700' : 'bg-slate-900 text-white'
                  }`}
                >
                  4
                </span>
                <span
                  className={`font-bold uppercase tracking-wider text-[11px] ${
                    activeStep === 4 ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  PAYMENT & SETTLEMENT
                </span>
              </div>
            </div>

            {activeStep === 4 && (
              <div className="p-4 space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Direct Marketplace Order Placement (Payment Pending)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Third-party payment gateway integration is currently pending in this environment. Placing this order will create your order record with <strong className="font-bold text-slate-900">Payment Status: PENDING</strong> and atomically reserve merchant inventory.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Total Amount Payable</span>
                    <span className="text-slate-500 text-[11px]">Subtotal for {totalUnits} units</span>
                  </div>
                  <span className="text-base font-black text-slate-900">
                    ₹{Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={submitting}
                    disabled={submitting}
                    onClick={handleSubmitOrder}
                    className="py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black uppercase tracking-wider text-xs shadow-xs"
                  >
                    {submitting ? (
                      'Securing Order...'
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-1.5" />
                        CONFIRM & PLACE ORDER • ₹{Number(grandTotal).toLocaleString('en-IN')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-2xs sticky top-20">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-100">
              Price Details
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Price ({totalUnits} {totalUnits === 1 ? 'item' : 'items'})</span>
                <span className="font-bold text-slate-900">
                  ₹{Number(subtotal).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Delivery Charges</span>
                <span className="text-slate-700 font-medium text-[11px]">
                  No added fees
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Platform & Packaging</span>
                <span className="text-slate-500 text-[11px]">Included</span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline text-sm font-black text-slate-900">
                <span>Total Payable</span>
                <span className="text-indigo-600 text-lg font-black tracking-tight">
                  ₹{Number(grandTotal).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Safe and secure order processing with synchronous inventory reservation.</span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModalAddress} className="space-y-3">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={modalFormData.recipientName}
                    onChange={(e) => setModalFormData({ ...modalFormData, recipientName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={modalFormData.phone}
                    onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={modalFormData.postalCode}
                    onChange={(e) => setModalFormData({ ...modalFormData, postalCode: e.target.value })}
                    placeholder="6 digits PIN"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Address Type
                  </label>
                  <select
                    value={modalFormData.addressType}
                    onChange={(e) => setModalFormData({ ...modalFormData, addressType: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="HOME">Home (All Day Delivery)</option>
                    <option value="WORK">Work (Office Hours)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Street Address & Building *
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={modalFormData.addressLine1}
                  onChange={(e) => setModalFormData({ ...modalFormData, addressLine1: e.target.value })}
                  placeholder="Flat, House No., Building, Street"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Area / Landmark (Optional)
                </label>
                <input
                  type="text"
                  maxLength={255}
                  value={modalFormData.addressLine2}
                  onChange={(e) => setModalFormData({ ...modalFormData, addressLine2: e.target.value })}
                  placeholder="Area, Sector, Landmark"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={modalFormData.city}
                    onChange={(e) => setModalFormData({ ...modalFormData, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={modalFormData.state}
                    onChange={(e) => setModalFormData({ ...modalFormData, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  checked={modalFormData.isDefault}
                  onChange={(e) => setModalFormData({ ...modalFormData, isDefault: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="modalIsDefault" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Make this my default address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={modalSubmitting}
                  disabled={modalSubmitting}
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteConfirmAddrId)}
        onClose={() => setDeleteConfirmAddrId(null)}
        onConfirm={executeDeleteAddress}
        title="Delete Saved Address?"
        message="Are you sure you want to delete this saved delivery address? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteAddrLoading}
      />
    </div>
  );
};

export default CheckoutPage;
