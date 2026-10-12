import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, Stethoscope, UserCog, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { authApi } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password, rememberMe);
      success('Logged in successfully', 'Welcome back');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'ADMINISTRATOR' | 'DOCTOR' | 'STAFF') => {
    setLoading(true);
    try {
      await quickDemoLogin(role);
      const roleLabel =
        role === 'ADMINISTRATOR' ? 'Dr. Eleanor Vance, MD (Administrator)' :
        role === 'DOCTOR' ? 'Dr. Marcus Chen, MD (Doctor)' :
        'Sarah Jenkins, RN (Prior Auth Staff)';
      success(`Logged in as ${roleLabel}`, 'Demo Account Ready');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg('Error processing reset request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            PriorAuth<span className="text-blue-600">Assistant</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Sign in to your clinical portal</h2>
        <p className="mt-1 text-xs text-slate-500">
          Or{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            create a new provider account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200/80 rounded-3xl">
          {/* Quick Demo Accounts Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-900">
                1-Click Demo Login (Hackathon)
              </h4>
            </div>
            <p className="text-[11px] text-cyan-800 mb-3">
              Instantly access pre-seeded patient clinical records and payer guideline profiles:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('DOCTOR')}
                disabled={loading}
                className="w-full py-2 px-3 bg-white hover:bg-blue-50 border border-cyan-300 text-blue-900 text-xs font-semibold rounded-xl flex items-center justify-between transition shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  Dr. Marcus Chen, MD
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Doctor
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('STAFF')}
                disabled={loading}
                className="w-full py-2 px-3 bg-white hover:bg-cyan-50 border border-cyan-300 text-cyan-900 text-xs font-semibold rounded-xl flex items-center justify-between transition shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-600" />
                  Sarah Jenkins, RN
                </span>
                <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                  Staff
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('ADMINISTRATOR')}
                disabled={loading}
                className="w-full py-2 px-3 bg-white hover:bg-purple-50 border border-cyan-300 text-purple-900 text-xs font-semibold rounded-xl flex items-center justify-between transition shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-purple-600" />
                  Dr. Eleanor Vance, MD
                </span>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Admin
                </span>
              </button>
            </div>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">
              Or sign in with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                Remember my session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-lg">Reset Password</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email address to receive a secure password recovery dispatch (simulated).
            </p>

            {forgotMsg ? (
              <div className="my-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {forgotMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@hospital.example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Send Reset Link
                </button>
              </form>
            )}

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMsg('');
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
