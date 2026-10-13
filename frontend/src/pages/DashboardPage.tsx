import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FilePlus,
  ArrowRight,
  TrendingUp,
  Activity,
  Upload,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { dashboardApi, requestsApi } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CompletenessMeter } from '../components/ui/CompletenessMeter';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [triageRequests, setTriageRequests] = useState<any[]>([]);
  const [triageStatus, setTriageStatus] = useState('ALL');
  const [oldestFirst, setOldestFirst] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, actRes, requestRes] = await Promise.all([
          dashboardApi.getSummary(),
          dashboardApi.getActivity(),
          requestsApi.getRequests(),
        ]);
        setSummary(sumRes);
        setActivities(actRes.activities);
        setTriageRequests(requestRes.requests);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const metrics = summary?.metrics || {
    totalRequests: 0,
    draftRequests: 0,
    missingInfoRequests: 0,
    readyForReviewRequests: 0,
    approvedRequests: 0,
    deniedRequests: 0,
  };

  const statusCards = [
    { title: 'Total Requests', count: metrics.totalRequests, icon: Layers, color: 'text-blue-600 bg-blue-50 border-blue-200', filter: 'ALL' },
    { title: 'Draft Requests', count: metrics.draftRequests, icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200', filter: 'DRAFT' },
    { title: 'Missing Information', count: metrics.missingInfoRequests, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200', filter: 'MISSING_INFORMATION' },
    { title: 'Ready for Review', count: metrics.readyForReviewRequests, icon: Clock, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', filter: 'READY_FOR_REVIEW' },
    { title: 'Payer Approved', count: metrics.approvedRequests, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', filter: 'APPROVED' },
    { title: 'Payer Denied', count: metrics.deniedRequests, icon: XCircle, color: 'text-rose-600 bg-rose-50 border-rose-200', filter: 'DENIED' },
  ];

  // Chart Data
  const pieData = [
    { name: 'Approved', value: metrics.approvedRequests || 1, color: '#10b981' },
    { name: 'Review Needed', value: metrics.readyForReviewRequests || 1, color: '#0ea5e9' },
    { name: 'Missing Info', value: metrics.missingInfoRequests || 1, color: '#f59e0b' },
    { name: 'Drafts', value: metrics.draftRequests || 1, color: '#94a3b8' },
    { name: 'Denied', value: metrics.deniedRequests || 0, color: '#f43f5e' },
  ];

  const pipeline = summary?.pipeline || [];

  const filteredRequests = [...triageRequests].filter((r: any) => {
    if (triageStatus !== 'ALL' && r.status !== triageStatus) return false;
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      r.requestNumber.toLowerCase().includes(q) ||
      `${r.patient?.firstName || r.patientName || ''} ${r.patient?.lastName || ''}`.toLowerCase().includes(q) ||
      (r.payer?.name || r.payerName || '').toLowerCase().includes(q) ||
      r.requestedService.toLowerCase().includes(q)
    );
  }).sort((a, b) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * (oldestFirst ? 1 : -1));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Prior Authorization Automation Engine Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.fullName || 'Clinician'}
          </h1>
          <p className="mt-1 text-slate-300 text-sm max-w-2xl leading-relaxed">
            Monitor prior authorization packet readiness, resolve payer clinical gaps, and track automated status
            transitions across all patient charts.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/requests/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <FilePlus className="w-4 h-4" />
              <span>New Authorization</span>
            </Link>
            <Link
              to="/requests?status=MISSING_INFORMATION"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs border border-white/20 flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>View Missing Information ({metrics.missingInfoRequests})</span>
            </Link>
            <Link
              to="/requests?status=READY_FOR_REVIEW"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs border border-white/20 flex items-center gap-1.5 transition"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Review Pending Requests ({metrics.readyForReviewRequests})</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statusCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(card.filter === 'ALL' ? '/requests' : `/requests?status=${card.filter}`)}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition text-left group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 truncate">{card.title}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                  {loading ? '...' : card.count}
                </span>
                <span className="text-[10px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                  Filter <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workflow Pipeline Progression Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Prior Authorization Pipeline</h3>
            <p className="text-xs text-slate-500">Real-time volume distributed across clinical processing stages</p>
          </div>
          <Link to="/requests" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
            View all pipeline details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {pipeline.map((stage: any, i: number) => (
            <div
              key={i}
              onClick={() => navigate(`/requests?status=${stage.key}`)}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 hover:bg-blue-50/60 hover:border-blue-300 cursor-pointer transition text-center"
            >
              <span className="text-xl font-extrabold text-slate-800">{stage.count}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-1 truncate">{stage.stage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Requests & Analytics Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Authorization Requests Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Triage Queue</h3>
              <p className="text-xs text-slate-500">All cases, sorted by time open and filterable by status</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient or service..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <select aria-label="Filter cases by status" value={triageStatus} onChange={(event) => setTriageStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
              <option value="ALL">All statuses</option>
              {['DRAFT','PROCESSING_DOCUMENTS','MISSING_INFORMATION','READY_FOR_REVIEW','READY_FOR_SUBMISSION','SUBMITTED','PENDING','APPROVED','DENIED','APPEALING'].map((status) => <option value={status} key={status}>{status.replace(/_/g, ' ')}</option>)}
            </select>
            <button type="button" onClick={() => setOldestFirst(!oldestFirst)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">{oldestFirst ? 'Oldest first' : 'Newest first'}</button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Patient Reference</th>
                  <th className="py-3 px-4">Payer</th>
                  <th className="py-3 px-4">Service / CPT</th>
                  <th className="py-3 px-4">Completeness</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Days Open</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No cases match these filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req: any) => (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{req.requestNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {req.patient ? `${req.patient.firstName} ${req.patient.lastName}` : req.patientName}
                        <span className="block text-[10px] text-slate-400 font-mono">{req.patient?.mrn || req.patientMrn}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{req.payer?.code || req.payerCode}</span>
                        <span className="block text-[10px] text-slate-400 truncate max-w-[110px]">{req.payer?.name || req.payerName}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[160px] truncate" title={req.requestedService}>
                        <span className="font-medium text-slate-800">{req.requestedService}</span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[120px]">
                        <CompletenessMeter score={req.completenessScore} size="sm" showLabel={true} />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold whitespace-nowrap">
                        {Math.max(0, Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 86_400_000))} days
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/requests/${req.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition inline-flex items-center gap-1"
                        >
                          Open <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {filteredRequests.length} of {triageRequests.length} cases
            </span>
            <Link
              to="/requests"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Open Full Request Registry <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Col: Analytics Charts & Recent Activity */}
        <div className="space-y-6">
          {/* Status Breakdown Donut Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Status Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Proportion of active cases by authorization state</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 truncate">{d.name}</span>
                  <span className="font-bold text-slate-900 ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Audit & Activity Log
              </h3>
              <Link to="/admin/audit-logs" className="text-xs text-blue-600 hover:underline font-medium">
                All Logs
              </Link>
            </div>

            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity logged.</p>
              ) : (
                activities.slice(0, 5).map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{act.title}</p>
                      <p className="text-slate-500 line-clamp-2 mt-0.5 text-[11px]">{act.detail}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>{act.user}</span>
                        <span>•</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
