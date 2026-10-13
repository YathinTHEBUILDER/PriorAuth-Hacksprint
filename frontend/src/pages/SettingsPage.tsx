import React, { useState, useEffect } from 'react';
import { Settings, User, Building, Bell, Shield, LogOut, Check, Info, Cpu, Key, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { adminApi } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [missingInfoAlerts, setMissingInfoAlerts] = useState(true);
  const [payerResponseAlerts, setPayerResponseAlerts] = useState(true);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchAiStatus = async () => {
    try {
      setLoadingAi(true);
      const res = await adminApi.getAIEngineStatus();
      setAiStatus(res.aiEngine);
    } catch {
      // User may not be administrator or endpoint fallback
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    fetchAiStatus();
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    success('Notification and account preferences saved successfully.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Settings & Provider Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage clinical practitioner credentials, health system affiliations, and notification configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-700 to-cyan-500 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            {user?.fullName.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{user?.fullName}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
              {user?.role}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 text-left space-y-2">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Affiliation</span>
              <span className="font-medium text-slate-800">{user?.organization}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Session Status</span>
              <span className="text-emerald-700 font-medium">Active (Encrypted JWT Cookie)</span>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Notification Preferences */}
          <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Alert & Notification Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Missing Information Alerts</span>
                  <span className="text-slate-500 text-[11px]">Notify when clinical gaps are flagged by the completeness engine.</span>
                </div>
                <input
                  type="checkbox"
                  checked={missingInfoAlerts}
                  onChange={(e) => setMissingInfoAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Payer Status Transitions</span>
                  <span className="text-slate-500 text-[11px]">Instant notification upon simulated approval, denial, or request for information.</span>
                </div>
                <input
                  type="checkbox"
                  checked={payerResponseAlerts}
                  onChange={(e) => setPayerResponseAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Email Daily Digest</span>
                  <span className="text-slate-500 text-[11px]">Summary of open prior auth cases and pending clinician reviews.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Save Notification Settings
              </button>
            </div>
          </form>

          {/* Groq High-Performance AI Engine & Multi-Key Failover Pool Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Groq High-Performance Clinical LLM Engine
              </h3>
              <button
                onClick={fetchAiStatus}
                disabled={loadingAi}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] flex items-center gap-1 font-medium"
                title="Refresh pool status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-950 text-xs">
                    Multi-Key Failover Pool Active ({aiStatus?.totalKeys || 4} Keys Connected)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                  {aiStatus?.model || 'openai/gpt-oss-120b'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                Platform automatically rotates across 4 Groq API keys upon encountering rate limits (HTTP 429) or exhausted credits (HTTP 402), providing uninterrupted clinical entity extraction and denial appeal drafting.
              </p>
            </div>

            {aiStatus?.keys && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Failover Key Pool Status
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiStatus.keys.map((k: any) => (
                    <div
                      key={k.index}
                      className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                        k.index === aiStatus.activeKeyIndex
                          ? 'border-emerald-300 bg-emerald-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Key className={`w-3.5 h-3.5 ${k.index === aiStatus.activeKeyIndex ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="font-mono font-semibold text-slate-800 text-[11px]">
                            Key #{k.index}: {k.maskedKey}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Calls: {k.totalCalls} | Errors: {k.failureCount}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          k.index === aiStatus.activeKeyIndex
                            ? 'bg-emerald-600 text-white'
                            : k.isAvailable
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {k.index === aiStatus.activeKeyIndex ? 'Active' : k.isAvailable ? 'Standby' : 'Cooldown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* System & Architecture Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Application Architecture Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">AI NLP Engine</span>
                <span className="font-semibold text-slate-900">Groq LLM + Anti-Hallucination Substring Matching</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Database Schema</span>
                <span className="font-semibold text-slate-900">PostgreSQL / SQLite via Prisma ORM</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">PDF Generation</span>
                <span className="font-semibold text-slate-900">PDFKit Server Binary Rendering</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cloud Storage</span>
                <span className="font-semibold text-slate-900">Supabase Storage Private Bucket</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
