import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { FormInput } from '../../components/ui/FormInput';
import { Button } from '../../components/ui/Button';
import {
  Lock,
  KeyRound,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loginWithOtp, isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [activeTab, setActiveTab] = useState('password');
  const [serverError, setServerError] = useState('');
  const [serverNotice, setServerNotice] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const destination =
        from !== '/'
          ? from
          : user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN'
          ? '/admin'
          : user?.role === 'ROLE_SELLER' || user?.role === 'SELLER'
          ? '/seller'
          : '/';
      navigate(destination, { replace: true });
    }
  }, [from, isAuthenticated, isLoading, navigate, user?.role]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const {
    register: registerPasswordForm,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm();

  const {
    register: registerOtpForm,
    handleSubmit: handleOtpSubmit,
    watch: watchOtpForm,
    trigger: triggerOtpForm,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
  } = useForm();

  const onPasswordLogin = async (data) => {
    setServerError('');
    setServerNotice('');
    try {
      await login(data.email, data.password);
    } catch (err) {
      const respData = err?.response?.data;
      setServerError(
        respData?.message ||
          respData?.error ||
          'Invalid email or password. Please verify your credentials.'
      );
    }
  };

  const handleSendOtp = async () => {
    const isEmailValid = await triggerOtpForm('otpEmail');
    if (!isEmailValid) return;

    const email = watchOtpForm('otpEmail');
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

  const onOtpLogin = async (data) => {
    setServerError('');
    setServerNotice('');
    try {
      await loginWithOtp(data.otpEmail, data.otpCode);
    } catch (err) {
      const respData = err?.response?.data;
      setServerError(
        respData?.message ||
          respData?.error ||
          'Invalid or expired verification code. Please try again.'
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-7 space-y-4 sm:space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 mb-1 border border-indigo-100/80 shadow-2xs">
            <Lock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sign In to Nexus
          </h1>
          <p className="text-xs text-slate-500">
            Access your orders, saved items, and marketplace cart
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Login authentication method"
          className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/70"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'password'}
            onClick={() => {
              setActiveTab('password');
              setServerError('');
              setServerNotice('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
              activeTab === 'password'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'otp'}
            onClick={() => {
              setActiveTab('otp');
              setServerError('');
              setServerNotice('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
              activeTab === 'otp'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>One-Time Code (OTP)</span>
          </button>
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

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit(onPasswordLogin)} className="space-y-3.5" noValidate>
            <FormInput
              id="login-email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={passwordErrors.email?.message}
              registration={registerPasswordForm('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
              })}
            />

            <FormInput
              id="login-password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              error={passwordErrors.password?.message}
              registration={registerPasswordForm('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              isLoading={isPasswordSubmitting}
              id="btn-login-submit"
              className="mt-1 py-2.5 rounded-xl shadow-xs"
            >
              <KeyRound className="w-4 h-4 mr-1.5" />
              Sign In with Password
            </Button>
          </form>
        )}

        {activeTab === 'otp' && (
          <form onSubmit={handleOtpSubmit(onOtpLogin)} className="space-y-3.5" noValidate>
            <div>
              <FormInput
                id="login-otp-email"
                label="Registered Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                error={otpErrors.otpEmail?.message}
                registration={registerOtpForm('otpEmail', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email address' },
                })}
              />

              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSendOtp}
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

            {otpSent && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3.5 pt-1 border-t border-slate-100">
                <FormInput
                  id="login-otp-code"
                  label="6-Character Verification Code"
                  type="text"
                  placeholder="e.g. A1B2C3"
                  autoComplete="one-time-code"
                  required
                  hint="Check your email"
                  error={otpErrors.otpCode?.message}
                  registration={registerOtpForm('otpCode', {
                    required: 'Enter the 6-character code',
                    pattern: {
                      value: /^[A-Za-z0-9]{6}$/,
                      message: 'Code must be exactly 6 alphanumeric characters',
                    },
                  })}
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  isLoading={isOtpSubmitting}
                  id="btn-login-otp-submit"
                  className="py-2.5 rounded-xl shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Verify & Sign In
                </Button>
              </div>
            )}
          </form>
        )}

        <div className="pt-3.5 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-bold text-indigo-600 hover:text-indigo-800 transition"
          >
            Create an account →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
