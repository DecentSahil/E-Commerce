import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/user';
import { updateStoredUser } from '../../api/authStorage';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  User,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Home,
  Briefcase,
  Edit3,
  Check,
  X,
  Mail,
  RotateCcw,
  Camera,
  Loader2,
  Package,
  Heart,
  Bell,
  ChevronRight,
  Lock,
  LogOut,
} from 'lucide-react';

const EMPTY_ADDRESS = {
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

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const avatarFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressFormError, setAddressFormError] = useState('');
  const [deleteAddrId, setDeleteAddrId] = useState(null);
  const [deleteAddrLoading, setDeleteAddrLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const userId = user?.userId || user?.id || 'me';

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
  }, [userId]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await userApi.getProfile(userId);
      const data = res.data?.data || res.data;
      if (data) {
        setProfile(data);
        setAvatarError(false);
        if (data.profilePictureUrl) {
          updateStoredUser({ profilePictureUrl: data.profilePictureUrl });
        }
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
        });
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to load profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    setAddressesError('');
    try {
      const res = await userApi.getAddresses();
      const data = res.data?.data || res.data || [];
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setAddressesError(err.response?.data?.message || 'Failed to load saved addresses.');
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        profilePictureUrl: profile?.profilePictureUrl || undefined,
      };

      const res = await userApi.updateProfile(userId, payload);
      const updated = res.data?.data || res.data;
      setProfile(updated || { ...profile, ...payload });
      showToast('Profile information saved successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarFileSelect = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (JPEG, PNG, WebP).', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(false);
    try {
      const res = await userApi.uploadAvatar(userId, file);
      const updated = res.data?.data || res.data;
      if (updated?.profilePictureUrl) {
        setProfile((prev) => ({ ...prev, profilePictureUrl: updated.profilePictureUrl }));
        setAvatarError(false);
        updateStoredUser({ profilePictureUrl: updated.profilePictureUrl });
        showToast('Profile photo updated.');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload photo.', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleOpenAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
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
    } else {
      setEditingAddress(null);
      setAddressForm(EMPTY_ADDRESS);
    }
    setAddressFormError('');
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressFormError('');

    if (!addressForm.recipientName.trim()) {
      setAddressFormError('Recipient name is required.');
      return;
    }
    if (!addressForm.addressLine1.trim()) {
      setAddressFormError('Street address line 1 is required.');
      return;
    }
    if (!addressForm.city.trim()) {
      setAddressFormError('City is required.');
      return;
    }
    if (!addressForm.state.trim()) {
      setAddressFormError('State is required.');
      return;
    }
    if (!addressForm.postalCode.trim()) {
      setAddressFormError('Postal code is required.');
      return;
    }

    setAddressSaving(true);
    const payload = {
      ...addressForm,
      countryCode: (addressForm.countryCode || 'IN').toUpperCase(),
    };

    try {
      if (editingAddress) {
        await userApi.updateAddress(editingAddress.id, payload);
        showToast('Address updated successfully.');
      } else {
        await userApi.addAddress(payload);
        showToast('New address saved to address book.');
      }
      setAddressModalOpen(false);
      fetchAddresses();
    } catch (err) {
      setAddressFormError(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addrId, e) => {
    if (e) e.stopPropagation();
    try {
      await userApi.setDefaultAddress(addrId);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addrId,
        }))
      );
      showToast('Default delivery address updated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to set default address.', 'error');
    }
  };

  const executeDeleteAddress = async () => {
    if (!deleteAddrId) return;
    setDeleteAddrLoading(true);
    try {
      await userApi.deleteAddress(deleteAddrId);
      setAddresses((prev) => prev.filter((a) => a.id !== deleteAddrId));
      setDeleteAddrId(null);
      showToast('Address deleted successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete address.', 'error');
      setDeleteAddrId(null);
    } finally {
      setDeleteAddrLoading(false);
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case 'WORK':
        return <Briefcase className="w-3.5 h-3.5 text-slate-500" />;
      case 'HOME':
      default:
        return <Home className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const initials = profile?.firstName
    ? `${profile.firstName[0]}${profile.lastName ? profile.lastName[0] : ''}`.toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'U';

  useEffect(() => {
    setAvatarError(false);
  }, [profile?.profilePictureUrl]);

  const avatarUrl = !avatarError && profile?.profilePictureUrl;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-16">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pb-1 border-b border-slate-200">
        <Link to="/" className="hover:text-indigo-600 transition">Home</Link>
        <span>›</span>
        <span className="text-slate-800 font-bold">My Account</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarFileSelect(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={avatarUploading}
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                  className="w-12 h-12 rounded-full overflow-hidden bg-indigo-50 text-indigo-600 font-bold text-base flex items-center justify-center border border-indigo-200 group relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    {avatarUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </div>
                </button>
              </div>

              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium">Hello,</p>
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : (user?.email?.split('@')[0] || 'Customer')}
                </h2>
                <p className="text-[11px] text-slate-500 truncate">
                  {profile?.email || user?.email}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Personal Information</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'addresses'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>Manage Addresses</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {addresses.length}
              </span>
            </button>

            <div className="pt-2 my-1 border-t border-slate-100" />

            <Link
              to="/orders"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-slate-400" />
                <span>My Orders</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/wishlist"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-slate-400" />
                <span>My Wishlist</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/notifications"
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-400" />
                <span>Notifications</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <div className="pt-2 my-1 border-t border-slate-100" />

            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8">
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Personal Information
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact details and name stored in user profile
                </p>
              </div>

              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between gap-2">
                  <span>{profileError}</span>
                  <button type="button" onClick={fetchProfile} className="underline font-bold">
                    Retry
                  </button>
                </div>
              )}

              {profileLoading ? (
                <div className="space-y-3 animate-pulse py-4">
                  <div className="h-9 bg-slate-100 rounded" />
                  <div className="h-9 bg-slate-100 rounded" />
                  <div className="h-9 bg-slate-100 rounded" />
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="First name"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Last name"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        maxLength={50}
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Registered Email
                      </label>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 select-none">
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{profile?.email || user?.email || 'N/A'}</span>
                        <span className="ml-auto text-[10px] text-slate-400 font-semibold uppercase">Protected</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={profileSaving}
                      disabled={profileSaving}
                    >
                      Save Profile
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    Manage Addresses
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saved delivery endpoints for merchant fulfillment
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddressModal()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              {addressesError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center justify-between gap-2">
                  <span>{addressesError}</span>
                  <button type="button" onClick={fetchAddresses} className="underline font-bold">
                    Retry
                  </button>
                </div>
              )}

              {addressesLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 animate-pulse py-2">
                  <div className="h-32 bg-slate-100 rounded-lg" />
                  <div className="h-32 bg-slate-100 rounded-lg" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-slate-200 rounded-xl">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No saved addresses yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Add delivery addresses to speed up multi-merchant checkouts.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => handleOpenAddressModal()}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Address
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-3.5 rounded-lg border flex flex-col justify-between transition ${
                        addr.isDefault
                          ? 'border-indigo-300 bg-indigo-50/20 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            {getAddressIcon(addr.addressType)}
                            <span className="font-bold text-slate-900 text-xs">
                              {addr.recipientName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                              {addr.addressType || 'HOME'}
                            </span>
                            {addr.isDefault && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-normal">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          <br />
                          {addr.city}, {addr.state} - <span className="font-bold">{addr.postalCode}</span>
                          <br />
                          {addr.country}
                        </p>

                        {addr.phone && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            Phone: {addr.phone}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                              className="text-slate-500 hover:text-indigo-600 font-semibold"
                            >
                              Set as Default
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenAddressModal(addr)}
                            className="text-slate-600 hover:text-indigo-600 font-semibold inline-flex items-center gap-0.5"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteAddrId(addr.id)}
                            className="text-slate-400 hover:text-rose-600 font-semibold inline-flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addressFormError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{addressFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={150}
                    value={addressForm.recipientName}
                    onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    maxLength={30}
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
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
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="6 digits PIN"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Address Type
                  </label>
                  <select
                    value={addressForm.addressType}
                    onChange={(e) => setAddressForm({ ...addressForm, addressType: e.target.value })}
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
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  placeholder="House No., Building, Street"
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
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  placeholder="Area, landmark"
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
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
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
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsDefaultAddr"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="modalIsDefaultAddr" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Make this my default address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="secondary" size="sm" onClick={() => setAddressModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={addressSaving}
                  disabled={addressSaving}
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteAddrId)}
        onClose={() => setDeleteAddrId(null)}
        onConfirm={executeDeleteAddress}
        title="Delete Saved Address?"
        message="Are you sure you want to delete this delivery address from your account? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteAddrLoading}
      />
    </div>
  );
};

export default ProfilePage;
