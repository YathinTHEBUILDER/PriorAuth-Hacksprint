import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const AnalyticsPage: React.FC = () => {
  const { error } = useToast();

  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, trendRes] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getTrends(),
        ]);
        setSummary(sumRes);
        setTrends(trendRes.trends);
      } catch {
        error('Failed to load analytics metrics.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const metrics = summary?.metrics || {
    avgPreparationHours: 4.2,
    avgReviewHours: 1.8,
    approvalRateSimulated: '88%',
    avgDocumentsPerRequest: '2.1',
  };

  const payerData = summary?.payerDistribution || [
    { name: 'BCBS', count: 12 },
    { name: 'AETNA', count: 8 },
    { name: 'UHC', count: 10 },
    { name: 'CIGNA', count: 5 },
  ];

  const missingFrequency = summary?.missingFrequency || [
    { name: 'Conservative PT (6+ wks)', count: 8 },
    { name: 'Prior Weight-bearing X-ray', count: 6 },
    { name: 'Recent TB Gold Lab', count: 4 },
    { name: 'Exam Neurologic Deficit', count: 3 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header and CSV Export CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Clinical Analytics & Operational Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prior authorization preparation throughput, common clinical documentation gaps, and adjudication analytics.
          </p>
        </div>

        <a
          href={analyticsApi.getExportUrl()}
          download="prior-authorization-report.csv"
          className="px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Avg Prep Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{metrics.avgPreparationHours} hrs</span>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Reduced from 14.5 manual hours
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Physician Review</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{metrics.avgReviewHours} hrs</span>
          <p className="text-[11px] text-slate-500 mt-1">Turnaround from draft to sign-off</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Extraction Success</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{summary?.extractionSuccessRate || 98}%</span>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">NLP OCR parsing accuracy</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500">Simulated Approvals</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900">{metrics.approvalRateSimulated}</span>
          <p className="text-[11px] text-slate-400 mt-1">Fictional payer gateway outcomes</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume Over Time */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Prior Authorization Volume Trends</h3>
              <p className="text-xs text-slate-500">Monthly case preparations and approvals</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
              Monthly Aggregation
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" name="Total Cases" />
                <Area type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" name="Approved Requests" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payer Case Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Case Volume by Insurer</h3>
              <p className="text-xs text-slate-500">Distribution across major commercial & Medicare payers</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Most Frequently Missing Information */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Most Frequently Missing Clinical Requirements
            </h3>
            <p className="text-xs text-slate-500">
              Gaps detected by the completeness engine that would otherwise cause payer rejection
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {missingFrequency.map((item: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400">Rank #{idx + 1}</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {item.count} gaps
                </span>
              </div>
              <h5 className="font-bold text-slate-800 text-xs mt-2">{item.name}</h5>
              <p className="text-[10px] text-slate-500 mt-1">Identified and flagged prior to submission.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
