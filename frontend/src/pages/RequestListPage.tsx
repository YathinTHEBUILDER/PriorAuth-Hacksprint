import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Download,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { requestsApi, payersApi, generationApi } from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CompletenessMeter } from '../components/ui/CompletenessMeter';
import { useToast } from '../components/ui/Toast';

export const RequestListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error } = useToast();

  const statusParam = searchParams.get('status') || 'ALL';

  const [requests, setRequests] = useState<any[]>([]);
  const [payers, setPayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [selectedPayer, setSelectedPayer] = useState('ALL');
  const [selectedService, setSelectedService] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'completeness' | 'id' | 'days-open'>('date');

  useEffect(() => {
    setSelectedStatus(statusParam);
  }, [statusParam]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [reqRes, payRes] = await Promise.all([
          requestsApi.getRequests({
            status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
            payerId: selectedPayer !== 'ALL' ? selectedPayer : undefined,
            serviceType: selectedService !== 'ALL' ? selectedService : undefined,
            search: search || undefined,
          }),
          payersApi.getPayers(),
        ]);
        setRequests(reqRes.requests);
        setPayers(payRes.payers);
      } catch (err: any) {
        error('Failed to load requests.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedStatus, selectedPayer, selectedService, search]);

  const sortedRequests = [...requests].sort((a, b) => {
    if (sortBy === 'completeness') return b.completenessScore - a.completenessScore;
    if (sortBy === 'id') return b.requestNumber.localeCompare(a.requestNumber);
    if (sortBy === 'days-open') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Prior Authorization Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, inspect clinical completeness, and download generated prior authorization drafts.
          </p>
        </div>

        <Link
          to="/requests/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Authorization</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Request ID, Patient name, or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setSearchParams({ status: e.target.value });
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PROCESSING_DOCUMENTS">Processing Documents</option>
            <option value="MISSING_INFORMATION">Missing Information</option>
            <option value="READY_FOR_REVIEW">Ready for Review</option>
            <option value="READY_FOR_SUBMISSION">Ready for Submission</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="DENIED">Denied</option>
            <option value="APPEALING">Appealing</option>
          </select>
        </div>

        {/* Payer Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Payer:</span>
          <select
            value={selectedPayer}
            onChange={(e) => setSelectedPayer(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="ALL">All Payers</option>
            {payers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="date">Most Recent</option>
            <option value="completeness">Completeness %</option>
            <option value="id">Request ID</option>
            <option value="days-open">Days Open (oldest first)</option>
          </select>
        </div>
      </div>

      {/* Main Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Patient Reference</th>
                <th className="py-3.5 px-4">Payer</th>
                <th className="py-3.5 px-4">Requested Service</th>
                <th className="py-3.5 px-4">Completeness</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Days Open</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading requests registry...
                  </td>
                </tr>
              ) : sortedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No authorization requests matching the active filters.
                  </td>
                </tr>
              ) : (
                sortedRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {req.requestNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {req.patient?.firstName} {req.patient?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        MRN: {req.patient?.mrn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{req.payer?.name}</span>
                      <span className="block text-[10px] text-slate-400">Code: {req.payer?.code}</span>
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate" title={req.requestedService}>
                      <span className="font-medium text-slate-800">{req.requestedService}</span>
                      <span className="block text-[10px] text-slate-400">{req.serviceType}</span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[130px]">
                      <CompletenessMeter score={req.completenessScore} size="sm" showLabel={true} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold whitespace-nowrap">
                      {Math.max(0, Math.floor((Date.now() - new Date(req.createdAt).getTime()) / 86_400_000))} days
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={generationApi.getPDFUrl(req.id)}
                          download={`${req.requestNumber}-Prior-Auth-Packet.pdf`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Download Draft PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/requests/${req.id}`}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          Open →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {sortedRequests.length} recorded prior authorization requests</span>
          <span className="font-semibold text-slate-600">Database Synchronized</span>
        </div>
      </div>
    </div>
  );
};
