import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { FormInput } from '../../components/ui/FormInput';
import { Button } from '../../components/ui/Button';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Store,
} from 'lucide-react';

export const RegisterPage = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState('');
  const [serverNotice, setServerNotice] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setServerError('');
    setServerNotice('');
    try {
      await authRegister(data.email, data.password, data.otp);
      navigate('/', { replace: true });
    } catch (err) {
      const respData = err?.response?.data;
      const validationErrorMsg = respData?.validationErrors
        ? Object.values(respData.validationErrors).join(', ')
        : null;
      setServerError(
        validationErrorMsg ||
          respData?.message ||
          respData?.error ||
          'Registration failed. Please verify your verification code and try again.'
      );
    }
  };

  const sendOtp = async () => {
    const isEmailValid = await trigger('email');
    if (!isEmailValid) return;

    const email = watch('email');
    setServerError('');
    setServerNotice('');
    setSendingOtp(true);

    try {
      await authApi.sendOtp(email);
      setOtpSent(true);
      setResendCooldown(45);
      setServerNotice(`Verification code sent to ${email}. Check your inbox!`);
    } catch (err) {
      const respData = err?.response?.data;
      setServerError(
        respData?.message ||
          respData?.error ||
          'Unable to send verification code. Please check your email and try again.'
      );
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-7 space-y-4 sm:space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100/80 shadow-2xs">
            <UserPlus className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-xs text-slate-500">
            Join Nexus Marketplace to shop and compare seller offers
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-semibold leading-relaxed">{serverError}</span>
          </div>
        )}

        {serverNotice && (
          <div
            role="status"
            className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-semibold leading-relaxed">{serverNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
          <div>
            <FormInput
              id="reg-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={errors.email?.message}
              registration={register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
              })}
            />

            <div className="mt-1.5 flex justify-end">
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp || resendCooldown > 0}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition focus:outline-none focus:underline"
              >
                {sendingOtp
                  ? 'Sending verification code...'
                  : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : otpSent
                  ? 'Resend Verification Code'
                  : 'Send Verification Code'}
              </button>
            </div>
          </div>

          <FormInput
            id="reg-otp"
            label="6-Character Verification Code (OTP)"
            type="text"
            placeholder="e.g. A1B2C3"
            autoComplete="one-time-code"
            required
            hint="Check your inbox"
            error={errors.otp?.message}
            registration={register('otp', {
              required: 'Verification code is required',
              pattern: {
                value: /^[A-Za-z0-9]{6}$/,
                message: 'Code must be exactly 6 alphanumeric characters',
              },
            })}
          />

          <FormInput
            id="reg-password"
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            registration={register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              maxLength: { value: 100, message: 'Password cannot exceed 100 characters' },
            })}
          />

          <FormInput
            id="reg-confirm-password"
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            registration={register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (val) => val === password || 'Passwords do not match',
            })}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="md"
            isLoading={isSubmitting}
            id="btn-register-submit"
            className="mt-1 py-2.5 rounded-xl shadow-xs"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Create Account
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Looking to sell products?</span>
          <Link
            to="/seller"
            className="font-bold text-indigo-600 hover:text-indigo-800 transition inline-flex items-center gap-1"
          >
            <Store className="w-3 h-3" />
            <span>Merchant Hub</span>
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
