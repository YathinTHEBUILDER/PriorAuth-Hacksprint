import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Lock, Clock, User, Eye, Terminal } from 'lucide-react';
import { adminApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const AuditLogPage: React.FC = () => {
  const { error } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [eventType, setEventType] = useState<string>('ALL');

  const loadLogs = async () => {
    try {
      const res = await adminApi.getAuditLogs({
        eventType: eventType !== 'ALL' ? eventType : undefined,
        search: search || undefined,
      });
      setLogs(res.logs);
    } catch {
      error('Failed to load security audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [eventType, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-600" />
          Security, Access & Clinical Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log tracking user authentications, medical document extractions, clinical modifications, reviews, and payer gateway events.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search action details, user, or IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Event Type:</span>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
          >
            <option value="ALL">All Recorded Events</option>
            <option value="USER_LOGIN">User Logins</option>
            <option value="DOCUMENT_UPLOAD">Document Uploads</option>
            <option value="CLINICAL_INFO_UPDATE">Clinical Info Updates</option>
            <option value="COMPLETENESS_CHECK">Completeness Checks</option>
            <option value="REQUEST_REVIEW">Physician Reviews</option>
            <option value="DEMO_SUBMISSION">Simulated Submissions</option>
            <option value="PAYER_RESPONSE_SIMULATION">Payer Simulator Responses</option>
            <option value="PDF_DOWNLOAD">PDF Downloads</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Actor & Role</th>
                <th className="py-3.5 px-4">Action Details</th>
                <th className="py-3.5 px-4">Related Request</th>
                <th className="py-3.5 px-4">Network IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <span className="font-semibold text-slate-900 block text-xs">
                        {log.user?.fullName || 'System Event'}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {log.user?.role?.toLowerCase() || 'service'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-slate-700 max-w-md">
                      {log.actionDetails}
                    </td>
                    <td className="py-3 px-4 font-sans text-xs">
                      {log.request ? (
                        <span className="text-blue-700 font-bold font-mono">
                          {log.request.requestNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
