import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Send,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  Edit3,
  Trash2,
  FileCode,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  requestsApi,
  documentsApi,
  clinicalApi,
  completenessApi,
  generationApi,
  reviewApi,
  submissionApi,
  appealsApi,
} from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CompletenessMeter } from '../components/ui/CompletenessMeter';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { AuthorizationRequestDetail, DocumentCategory } from '../types';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isDoctor, isAdmin } = useAuth();
  const { success, error, warning, info } = useToast();

  const activeTab = searchParams.get('tab') || 'overview';

  const [request, setRequest] = useState<AuthorizationRequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Upload Tab State
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('CLINICAL_NOTES');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);

  // Edit Clinical Info State
  const [editingClinical, setEditingClinical] = useState<boolean>(false);
  const [clinicalForm, setClinicalForm] = useState<any>({});

  // Review State
  const [showReviewConfirm, setShowReviewConfirm] = useState<boolean>(false);
  const [reviewNotes, setReviewNotes] = useState<string>('Clinical documentation and conservative trial dates verified by attending physician.');
  const [reviewDecision, setReviewDecision] = useState<string>('APPROVED_FOR_SUBMISSION');

  // Simulation State
  const [simulatedOutcome, setSimulatedOutcome] = useState<string>('APPROVED');
  const [simulatedNotes, setSimulatedNotes] = useState<string>('');
  const [denialReasonText, setDenialReasonText] = useState('');
  const [appealDraft, setAppealDraft] = useState<any>(null);
  const [appealBusy, setAppealBusy] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [requestingInfo, setRequestingInfo] = useState(false);

  const loadRequest = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await requestsApi.getRequestById(id);
      setRequest(res.request);
      setClinicalForm(res.request.clinicalInformation || {});
    } catch (err: any) {
      error(err.message || 'Failed to load authorization request.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const setTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
  };

  // 1. Upload Document Handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!uploadFile && !manualText) {
      warning('Please choose a file or enter clinical text.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (uploadFile) formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      if (manualText) formData.append('manualText', manualText);

      await documentsApi.uploadDocument(id, formData);
      success('Document uploaded and clinical text extracted!', 'Document Processed');
      setUploadFile(null);
      setManualText('');
      setShowManualEntry(false);
      await loadRequest(true);
      // Auto recommend moving to extraction review
      setTab('extraction');
    } catch (err: any) {
      error(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // 2. Delete Document Handler
  const handleDeleteDocument = async (docId: string) => {
    try {
      await documentsApi.deleteDocument(docId);
      success('Document removed from request.', 'Document Deleted');
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Failed to remove document.');
    }
  };

  const handleDownloadDocument = async (docId: string, fileName: string) => {
    try {
      await documentsApi.downloadOriginal(docId, fileName);
    } catch (err: any) {
      error(err.message || 'Could not download the original document.');
    }
  };

  // 3. Recheck Completeness Handler
  const handleRecheckCompleteness = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const res = await completenessApi.triggerCheck(id);
      success(`Completeness evaluated: ${res.completeness.score}% (${res.completeness.completedCount}/${res.completeness.totalApplicable} requirements met).`, 'Completeness Rechecked');
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Failed to evaluate completeness.');
    } finally {
      setRefreshing(false);
    }
  };

  // 4. Save Clinical Information Form
  const handleSaveClinicalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setRefreshing(true);
    try {
      await clinicalApi.updateClinicalInfo(id, {
        ...clinicalForm,
        isVerified: true,
      });
      success('Clinical information updated and marked verified.', 'Clinical Data Saved');
      setEditingClinical(false);
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Failed to update clinical information.');
    } finally {
      setRefreshing(false);
    }
  };

  // 5. Submit Physician Review
  const handleSubmitReview = async () => {
    if (!id) return;
    try {
      await reviewApi.submitReview(id, {
        reviewDecision,
        reviewNotes,
        changesMade: 'Physician confirmed clinical indication and physical examination findings.',
      });
      success('Physician review submitted and recorded.', 'Review Completed');
      setShowReviewConfirm(false);
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Failed to submit review.');
    }
  };

  // 6. Mark Ready For Submission
  const handleMarkReady = async () => {
    if (!id) return;
    try {
      await reviewApi.markReadyForSubmission(id);
      success('Request is verified and marked Ready for Submission!', 'Validation Passed');
      await loadRequest(true);
      setTab('tracking');
    } catch (err: any) {
      error(err.message || 'Cannot mark as ready for submission.');
    }
  };

  // 7. Submit to Simulated Payer Gateway
  const handleSubmitToPayer = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const res = await submissionApi.submitToPayer(id);
      success(`Request dispatched to simulated payer gateway! Ref: ${res.submissionRef}`, 'Simulated Submission Recorded');
      await loadRequest(true);
      setTab('tracking');
    } catch (err: any) {
      error(err.message || 'Failed to submit request.');
    } finally {
      setRefreshing(false);
    }
  };

  // 8. Trigger Payer Simulator Response
  const handleSimulateResponse = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const res = await submissionApi.simulateResponse(id, {
        outcome: simulatedOutcome,
        reasonNotes: simulatedNotes || undefined,
      });
      success(`Simulated payer response outcome: ${simulatedOutcome}`, 'Payer Simulator Response');
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Failed to simulate response.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDraftAppeal = async () => {
    if (!id) return;
    setAppealBusy(true);
    try {
      const result = await appealsApi.draft(id, denialReasonText);
      setAppealDraft(result.appeal);
      success(`Draft prepared with ${result.evidenceCount} chart evidence item(s).`);
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Could not draft the appeal.');
    } finally {
      setAppealBusy(false);
    }
  };

  const handleRequestMissingInfo = async (fieldName: string, reason: string) => {
    if (!id) return;
    setRequestingInfo(true);
    try {
      const result = await clinicalApi.requestMissingInfo(id, fieldName, reason);
      success(result.message);
    } catch (err: any) {
      error(err.message || 'Could not log the follow-up request.');
    } finally {
      setRequestingInfo(false);
    }
  };

  const handleSubmitAppeal = async () => {
    if (!id || !appealDraft?.id) return;
    setAppealBusy(true);
    try {
      const result = await appealsApi.submit(id, appealDraft.id, appealDraft.draftText);
      success(result.message);
      await loadRequest(true);
    } catch (err: any) {
      error(err.message || 'Could not record appeal submission.');
    } finally {
      setAppealBusy(false);
    }
  };

  if (loading || !request) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Loading prior authorization packet...</p>
      </div>
    );
  }

  const patient = request.patient;
  const payer = request.payer;
  const clinical = request.clinicalInformation;
  const documents = request.documents || [];
  const sourceDocument = documents.find((document: any) => document.id === selectedSource?.documentId) || documents[0];
  const sourceText = sourceDocument?.extractedText || '';
  const reqResults = request.requirementResults || [];
  const completeness = request.completeness || {
    score: request.completenessScore,
    totalApplicable: reqResults.length,
    completedCount: reqResults.filter((r) => r.status === 'COMPLETE').length,
    missingCount: reqResults.filter((r) => r.status === 'MISSING').length,
    needsReviewCount: reqResults.filter((r) => r.status === 'NEEDS_REVIEW').length,
    isConfigured: true,
  };

  const tabs = [
    { id: 'overview', label: '1. Overview', icon: FileText },
    { id: 'documents', label: '2. Documents & Upload', icon: Upload, count: documents.length },
    { id: 'extraction', label: '3. Clinical Extraction', icon: Sparkles },
    { id: 'completeness', label: '4. Missing Info Checker', icon: AlertTriangle, badge: `${Math.round(completeness.score)}%` },
    { id: 'generate', label: '5. Packet Generator & PDF', icon: FileCheck2 },
    { id: 'review', label: '6. Physician Review', icon: Stethoscope },
    { id: 'tracking', label: '7. Payer Gateway & Tracking', icon: Send },
    { id: 'appeal', label: '8. Denial Appeal', icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Request Summary Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                {request.requestNumber}
              </span>
              <StatusBadge status={request.status} size="lg" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
              {patient.firstName} {patient.lastName}{' '}
              <span className="text-sm font-normal text-slate-500 font-mono">
                (MRN: {patient.mrn} • DOB: {patient.dateOfBirth})
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-1.5">
              <span>
                <strong>Payer:</strong> {payer.name} ({payer.code})
              </span>
              <span>•</span>
              <span>
                <strong>Service:</strong> {request.requestedService}
              </span>
              <span>•</span>
              <span>
                <strong>Member ID:</strong> {patient.insuranceMemberId}
              </span>
            </div>
          </div>

          {/* Quick Completeness Meter & Action */}
          <div className="w-full lg:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
            <CompletenessMeter score={completeness.score} isConfigured={completeness.isConfigured} size="md" />
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span>
                {completeness.completedCount} of {completeness.totalApplicable} rules satisfied
              </span>
              <button
                onClick={handleRecheckCompleteness}
                disabled={refreshing}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Recheck
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-6 mt-4 border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* Request Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base mb-4">Request Information</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Request Number</span>
                  <span className="font-mono font-bold text-slate-900">{request.requestNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Service Category</span>
                  <span className="font-semibold text-slate-900">{request.serviceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Priority</span>
                  <span className="font-semibold text-slate-900">{request.priority}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Created Date</span>
                  <span className="font-semibold text-slate-900">{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Target Payer</span>
                  <span className="font-semibold text-slate-900">{payer.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Electronic Payer ID</span>
                  <span className="font-mono font-semibold text-slate-900">{payer.electronicId || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-slate-400 block text-xs font-medium mb-1">Clinical Indication & Notes</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {request.notes || 'No preliminary notes recorded.'}
                </p>
              </div>
            </div>

            {/* Clinical Information Preview */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">Extracted Clinical Summary</h3>
                <button
                  onClick={() => setTab('extraction')}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  Review Details <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Primary Diagnosis:</span>
                  <p className="font-semibold text-slate-800">
                    {clinical?.diagnosis || 'Pending document extraction...'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Objective Findings:</span>
                  <p className="text-slate-700 line-clamp-2">
                    {clinical?.clinicalFindings || 'Pending objective examination upload...'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Ordering Physician:</span>
                  <p className="font-semibold text-slate-800">
                    {clinical?.orderingPhysicianName || 'Dr. Marcus Chen, MD'} (NPI: {clinical?.orderingPhysicianNpi || '1942083319'})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Next Actions & Flow Prompts */}
          <div className="space-y-6">
            <div className="bg-gradient-to-tr from-blue-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <h4 className="font-bold text-base">Recommended Next Action</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {documents.length === 0
                  ? 'Upload clinical progress notes or imaging reports to allow automated clinical extraction.'
                  : completeness.missingCount > 0
                  ? `Address ${completeness.missingCount} missing requirement(s) in the Missing Information tab before review.`
                  : request.status === 'READY_FOR_REVIEW'
                  ? 'Physician review required to confirm clinical accuracy before payer dispatch.'
                  : 'Proceed to Payer Gateway to dispatch simulated submission.'}
              </p>

              <div className="mt-5">
                {documents.length === 0 ? (
                  <button
                    onClick={() => setTab('documents')}
                    className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <span>Upload Supporting Documents</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : completeness.missingCount > 0 ? (
                  <button
                    onClick={() => setTab('completeness')}
                    className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <span>Inspect Missing Requirements</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setTab('review')}
                    className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <span>Review & Finalize Packet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Attached Documents List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-900 text-sm">Attached Documents ({documents.length})</h4>
                <button onClick={() => setTab('documents')} className="text-xs text-blue-600 hover:underline">
                  Manage
                </button>
              </div>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No documents attached yet.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div className="truncate mr-2">
                        <p className="font-semibold text-slate-800 truncate">{d.originalName}</p>
                        <span className="text-[10px] text-slate-400">{d.category.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Extracted
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DOCUMENTS UPLOAD & EXTRACTION (PAGE 4) ================= */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Quick Demo File Helpers */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-700 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-cyan-900">Need sample clinical documents for this hackathon test?</h4>
                <p className="text-[11px] text-cyan-800">
                  Pre-generated clinical progress notes and imaging reports are available in the local uploads directory.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setManualText(
                  `CLINICAL PROGRESS NOTE\nPatient Name: ${patient.firstName} ${patient.lastName}\nDOB: ${patient.dateOfBirth} | MRN: ${patient.mrn}\nOrdering Provider: Dr. Marcus Chen, MD (NPI: 1942083319)\n\nCHIEF COMPLAINT: Lumbar radiating low back pain into lower extremity.\n\nHISTORY OF PRESENT ILLNESS:\nPatient completed 8 weeks of physical therapy (16 sessions) between August and September without resolution. Failed Meloxicam 15mg daily.\n\nPHYSICAL EXAMINATION:\nPositive Straight Leg Raise at 40 degrees producing radicular symptoms. Left extensor hallucis longus 4/5 strength. Red flags negative. No cauda equina signs.\n\nASSESSMENT & PLAN:\n1. Lumbar radiculopathy (M54.16)\n2. Order: MRI Lumbar Spine without Contrast (CPT 72148)`
                );
                setShowManualEntry(true);
                success('Loaded realistic clinical consult note into manual entry area!', 'Sample Loaded');
              }}
              className="px-3 py-1.5 bg-white hover:bg-cyan-100 border border-cyan-300 text-cyan-900 font-bold text-xs rounded-xl shadow-2xs whitespace-nowrap"
            >
              Load Sample Clinical Note
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Zone */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Upload Clinical Document</h3>
              <p className="text-xs text-slate-500 mb-4">
                Supported formats: PDF, PNG, JPG, JPEG (Max 15MB)
              </p>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="CLINICAL_NOTES">Clinical Notes & Progress Consults</option>
                    <option value="DENIAL_LETTER">Payer Denial Letter</option>
                    <option value="DIAGNOSIS_RECORDS">Diagnosis Records</option>
                    <option value="LABORATORY_REPORTS">Laboratory Reports (e.g. TB Gold, CBC)</option>
                    <option value="IMAGING_REPORTS">Imaging Reports (MRI, CT, Plain X-Ray)</option>
                    <option value="MEDICATION_RECORDS">Medication & Pharmacy Records</option>
                    <option value="TREATMENT_PLANS">Physical Therapy / Treatment Plans</option>
                    <option value="INSURANCE_INFORMATION">Insurance & Coverage Card</option>
                    <option value="OTHER_SUPPORTING">Other Supporting Clinical Documentation</option>
                  </select>
                </div>

                {!showManualEntry ? (
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    {uploadFile ? (
                      <div>
                        <p className="font-semibold text-xs text-blue-700">{uploadFile.name}</p>
                        <p className="text-[10px] text-slate-400">{Math.round(uploadFile.size / 1024)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Drag and drop clinical file here</p>
                        <p className="text-[11px] text-slate-400 mt-1">or click to browse from your device</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Manual Text Entry (OCR / Clinical Notes Fallback)
                    </label>
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      rows={6}
                      placeholder="Paste raw clinic progress notes, physical exam findings, or lab result text..."
                      className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    {showManualEntry ? '← Switch to File Upload' : 'Enter / Paste Clinical Notes Manually'}
                  </button>

                  <button
                    type="submit"
                    disabled={uploading || (!uploadFile && !manualText)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting NLP...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Process & Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Document List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col">
              <h3 className="font-bold text-slate-900 text-base mb-1">Attached Supporting Records ({documents.length})</h3>
              <p className="text-xs text-slate-500 mb-4">
                Clinical records attached to this prior authorization packet
              </p>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-1">
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No documents attached yet. Upload clinic notes above to initiate extraction.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-200 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate">
                          <p className="font-bold text-xs text-slate-900 truncate">{doc.originalName}</p>
                          <span className="text-[10px] text-blue-700 font-semibold uppercase">
                            {doc.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.filePath !== 'manual_entry' && <button type="button" onClick={() => handleDownloadDocument(doc.id, doc.originalName)} className="rounded p-1 text-slate-500 hover:text-blue-600" title="Download original document"><Download className="h-3.5 w-3.5" /></button>}
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>{Math.round(doc.fileSize / 1024)} KB</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                            {doc.extractionStatus}
                          </span>
                        </div>
                      </div>

                      {doc.extractedFields && doc.extractedFields.length > 0 && (
                        <div className="mt-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                          <strong>{doc.extractedFields.length} Clinical Facts Extracted:</strong>{' '}
                          {doc.extractedFields.map((f) => f.fieldName).slice(0, 3).join(', ')}
                          {doc.extractedFields.length > 3 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AI CLINICAL INFORMATION EXTRACTION (PAGE 5) ================= */}
      {activeTab === 'extraction' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Structured Clinical Facts & Evidence Review
              </h3>
              <p className="text-xs text-slate-500">
                Verified clinical data extracted from patient records. Edit and verify values before completeness check.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingClinical(!editingClinical)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{editingClinical ? 'Cancel Editing' : 'Edit Clinical Data'}</span>
              </button>
              <button
                onClick={() => setTab('completeness')}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <span>Continue to Missing Info Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Structured Facts Columns */}
            <div className="lg:col-span-2 space-y-4">
              {editingClinical ? (
                /* Editable Form */
                <form onSubmit={handleSaveClinicalInfo} className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Edit Clinical Information</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Diagnosis</label>
                    <input
                      type="text"
                      value={clinicalForm.diagnosis || ''}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Findings & Physical Exam</label>
                    <textarea
                      value={clinicalForm.clinicalFindings || ''}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, clinicalFindings: e.target.value })}
                      rows={3}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prior Conservative Treatments (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(clinicalForm.previousTreatments) ? clinicalForm.previousTreatments.join(', ') : clinicalForm.previousTreatments || ''}
                      onChange={(e) => setClinicalForm({ ...clinicalForm, previousTreatments: e.target.value.split(',').map((s: string) => s.trim()) })}
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ordering Physician</label>
                      <input
                        type="text"
                        value={clinicalForm.orderingPhysicianName || ''}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, orderingPhysicianName: e.target.value })}
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Physician NPI</label>
                      <input
                        type="text"
                        value={clinicalForm.orderingPhysicianNpi || ''}
                        onChange={(e) => setClinicalForm({ ...clinicalForm, orderingPhysicianNpi: e.target.value })}
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingClinical(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                    >
                      Save & Mark Verified
                    </button>
                  </div>
                </form>
              ) : (
                /* Structured Cards Display */
                <div className="space-y-4">
                  {/* Diagnosis */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-slate-400">Diagnosis Information</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {clinical?.isVerified ? 'Clinician Verified' : 'Extracted NLP Fact'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{clinical?.diagnosis || 'Not found in documents.'}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      ICD-10: {Array.isArray(clinical?.diagnosisCodes) ? clinical.diagnosisCodes.join(', ') : 'M54.16'}
                    </p>
                  </div>

                  {/* Objective Findings */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Objective Clinical Findings</span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {clinical?.clinicalFindings || 'Not found in documents.'}
                    </p>
                  </div>

                  {/* Previous Treatments */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Documented Conservative Care</span>
                    {clinical?.previousTreatments && clinical.previousTreatments.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {(Array.isArray(clinical.previousTreatments) ? clinical.previousTreatments : [clinical.previousTreatments]).map((t: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        No previous conservative treatment trials found in current document set.
                      </p>
                    )}
                  </div>

                  {/* Provider Info */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Ordering Clinician</span>
                      <p className="text-xs font-bold text-slate-900">{clinical?.orderingPhysicianName || 'Dr. Marcus Chen, MD'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400 block mb-1">Physician NPI</span>
                      <p className="text-xs font-mono font-bold text-blue-700">{clinical?.orderingPhysicianNpi || '1942083319'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Original Document Preview Side Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col max-h-[600px]">
              <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" />
                Source Document Text Viewer
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                Original extracted document text for fact corroboration
              </p>

              <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs leading-relaxed">
                {sourceText ? (
                  <pre className="whitespace-pre-wrap">{selectedSource && sourceDocument?.id === selectedSource.documentId ? <>{sourceText.slice(0, selectedSource.start)}<mark className="rounded bg-amber-300 px-0.5 text-slate-950">{sourceText.slice(selectedSource.start, selectedSource.end)}</mark>{sourceText.slice(selectedSource.end)}</> : sourceText}</pre>
                ) : (
                  <span className="text-slate-500">No raw text extracted yet. Upload a PDF in Step 2.</span>
                )}
              </div>
              <div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
                {(request.extractedFields || []).map((field: any) => (
                  <div key={field.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">{field.fieldName}: {field.fieldValue}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${field.sourceOffsetStart != null ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {field.sourceOffsetStart != null ? 'Source verified' : 'Review citation'}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-600">{field.sourceSnippet || 'No source text recorded.'}</p>
                    {field.sourceOffsetStart != null && <p className="mt-1 text-[10px] text-slate-400">{field.documentId} · characters {field.sourceOffsetStart}–{field.sourceOffsetEnd}</p>}
                    {field.sourceOffsetStart != null && <button type="button" onClick={() => setSelectedSource({ documentId: field.documentId, start: field.sourceOffsetStart, end: field.sourceOffsetEnd })} className="mt-2 font-semibold text-blue-700 hover:underline">View Source</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: MISSING INFORMATION CHECKER (PAGE 6 - CRUCIAL) ================= */}
      {activeTab === 'completeness' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Active Guidelines Profile Header */}
          <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-semibold mb-2">
                <span>Active Payer Policy: {payer.name}</span>
              </div>
              <h3 className="text-xl font-bold">Payer Authorization Completeness Engine</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Evaluating clinical documentation against active requirements for {request.requestedService}.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
              <span className="text-3xl font-extrabold text-cyan-300">{Math.round(completeness.score)}%</span>
              <span className="block text-[11px] text-slate-300 uppercase font-semibold">Overall Readiness</span>
            </div>
          </div>

          {/* Safeguard Alert when completeness < 100% or missing items exist */}
          {completeness.missingCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Action Required Before Submission</h4>
                <p className="mt-0.5 leading-relaxed">
                  {completeness.missingCount} mandatory requirement(s) are missing. Insurance payer rules require all
                  criteria to be satisfied before this request can be marked Ready for Submission.
                </p>
              </div>
            </div>
          )}

          {/* Requirements Checklist Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base">
                Payer Requirement Criteria ({reqResults.length})
              </h4>
              <button
                onClick={handleRecheckCompleteness}
                disabled={refreshing}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Re-Evaluate Rules</span>
              </button>
            </div>

            <div className="space-y-3">
              {reqResults.map((result: any) => {
                const req = result.requirement || {};
                const isComplete = result.status === 'COMPLETE';
                const isMissing = result.status === 'MISSING';
                const isReview = result.status === 'NEEDS_REVIEW';

                return (
                  <div
                    key={result.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isComplete
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isMissing
                        ? 'bg-rose-50/40 border-rose-200'
                        : isReview
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isComplete
                              ? 'bg-emerald-200 text-emerald-800'
                              : isMissing
                              ? 'bg-rose-200 text-rose-800'
                              : 'bg-amber-200 text-amber-800'
                          }`}
                        >
                          {isComplete ? '✓' : isMissing ? '✕' : '!'}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{req.name || 'Requirement Rule'}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">{req.code}</span>
                        </div>
                      </div>
                      <StatusBadge status={result.status} size="sm" />
                    </div>

                    <div className="mt-3 text-xs pl-8 space-y-1.5">
                      <p className="text-slate-600">{req.description}</p>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-slate-700">
                        <strong>Evaluation Note:</strong> {result.explanation}
                      </div>
                      <p className="text-[11px] font-semibold text-blue-700">
                        Recommended Next Action: {result.recommendedAction}
                      </p>
                      {isMissing && <button type="button" disabled={requestingInfo} onClick={() => handleRequestMissingInfo(req.name || 'Missing payer requirement', result.recommendedAction || result.explanation || '')} className="mt-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 disabled:opacity-50">Request from ordering clinician</button>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Rule engine evaluated against active policy criteria
              </span>
              <button
                onClick={() => setTab('generate')}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5"
              >
                <span>Proceed to Packet Generator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: PACKET GENERATOR & PDF (PAGE 7) ================= */}
      {activeTab === 'generate' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                Compiled Prior Authorization Packet Draft
              </h3>
              <p className="text-xs text-slate-500">
                Formatted packet ready for physician sign-off and electronic submission
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={generationApi.getPDFUrl(request.id)}
                download={`${request.requestNumber}-Prior-Auth-Packet.pdf`}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Real PDF</span>
              </a>
              <button
                onClick={() => setTab('review')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Printable Structured Packet Preview */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-lg max-w-4xl mx-auto space-y-6 text-slate-800">
            {/* Packet Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                  Healthcare Prior Authorization Packet
                </span>
                <h2 className="text-xl font-extrabold text-slate-950">Prior Authorization Request Summary</h2>
                <p className="text-xs text-slate-500">Metro Health System & Specialty Care Network</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-slate-900">{request.requestNumber}</span>
                <span className="block text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                  DRAFT PREPARATION
                </span>
              </div>
            </div>

            {/* Section A: Request & Coverage */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <strong className="text-slate-400 block uppercase text-[10px]">Patient Demographics</strong>
                <p className="font-bold text-slate-900 mt-0.5">{patient.firstName} {patient.lastName}</p>
                <p className="text-slate-600">MRN: {patient.mrn} • DOB: {patient.dateOfBirth}</p>
              </div>
              <div>
                <strong className="text-slate-400 block uppercase text-[10px]">Insurance Coverage</strong>
                <p className="font-bold text-slate-900 mt-0.5">{payer.name}</p>
                <p className="text-slate-600">Member ID: {patient.insuranceMemberId} • Group: {patient.insuranceGroupNumber || 'N/A'}</p>
              </div>
            </div>

            {/* Section B: Clinical Justification */}
            <div className="space-y-3 text-xs border border-slate-200 p-4 rounded-xl">
              <strong className="text-slate-400 block uppercase text-[10px]">Clinical Justification & Necessity</strong>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-medium">Requested Service:</span>
                  <p className="font-bold text-slate-900">{request.requestedService}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Primary Diagnosis (ICD-10):</span>
                  <p className="font-bold text-slate-900">{clinical?.diagnosis || 'Low Back Pain with Radiculopathy'}</p>
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Objective Findings:</span>
                <p className="text-slate-700 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {clinical?.clinicalFindings || 'Physical examination documents severe dermatomal pain and weakness.'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Documented Conservative Care:</span>
                <p className="text-slate-700 mt-0.5">
                  {clinical?.previousTreatments ? (Array.isArray(clinical.previousTreatments) ? clinical.previousTreatments.join('; ') : clinical.previousTreatments) : 'Documented physical therapy completed.'}
                </p>
              </div>
            </div>

            {/* Section C: Ordering Physician & Sign-off */}
            <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block uppercase text-[10px]">Ordering Provider</span>
                <p className="font-bold text-slate-900">{clinical?.orderingPhysicianName || 'Dr. Marcus Chen, MD'}</p>
                <p className="text-slate-500 font-mono">NPI: {clinical?.orderingPhysicianNpi || '1942083319'}</p>
              </div>
              <div className="border-b border-slate-400 pb-1 flex flex-col justify-end">
                <span className="text-[10px] text-slate-400">Attending Clinician Signature & Date:</span>
                <span className="font-serif italic text-slate-800 text-sm mt-1">
                  {clinical?.isVerified ? 'Dr. Marcus Chen, MD (Electronically Verified)' : 'Pending Physician Review'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: PHYSICIAN REVIEW (PAGE 8) ================= */}
      {activeTab === 'review' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              Physician Final Review & Accuracy Confirmation
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Certified medical review required to confirm clinical accuracy before marking Ready for Submission.
            </p>

            {/* Completeness Pre-check */}
            {completeness.missingCount > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs mb-6">
                <h4 className="font-bold text-sm">Cannot Confirm Readiness</h4>
                <p className="mt-1">
                  {completeness.missingCount} requirement(s) are still missing. A request cannot be marked Ready for
                  Submission until applicable criteria are met.
                </p>
                <button
                  onClick={() => setTab('completeness')}
                  className="mt-3 px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition"
                >
                  View Missing Items
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs mb-6 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">All Applicable Criteria Satisfied!</h4>
                  <p className="mt-0.5">
                    100% of payer rules are satisfied by the attached clinical evidence. Ready for physician sign-off.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Review Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full sm:w-80 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="APPROVED_FOR_SUBMISSION">Approved for Payer Submission</option>
                  <option value="CHANGES_REQUESTED">Request Clarifications / Add Documents</option>
                  <option value="REJECTED">Clinically Inappropriate / Cancel Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Clinical Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewConfirm(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                >
                  Sign & Submit Physician Review
                </button>

                {completeness.missingCount === 0 && (
                  <button
                    type="button"
                    onClick={handleMarkReady}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Ready for Submission</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: PAYER GATEWAY & TRACKING (PAGE 9) ================= */}
      {activeTab === 'tracking' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Gateway Status Header */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs">
            <h4 className="font-bold text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Electronic Payer Gateway & Clearinghouse Transmission
            </h4>
            <p className="mt-1 leading-relaxed text-slate-600">
              Direct electronic transaction gateway for prior authorization requests. Track clearinghouse EDI submission status and process adjudication responses.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submission Dispatch & Gateway Response */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-1">Transmit to Payer Gateway</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Current Status: <strong>{request.status.replace(/_/g, ' ')}</strong>
                </p>

                {request.submissionRef ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-800 block">Electronic Submission Reference:</span>
                    <span className="text-lg font-mono font-bold text-emerald-950 block mt-0.5">
                      {request.submissionRef}
                    </span>
                    <span className="text-[11px] text-emerald-700 block mt-1">
                      Target Gateway: {payer.name} ({payer.electronicId || 'EDI-87726'})
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmitToPayer}
                    disabled={refreshing}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit to Payer Gateway (EDI 278)</span>
                  </button>
                )}
              </div>

              {/* Clearinghouse Adjudication Response Processing */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Clearinghouse Adjudication Response
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Process incoming electronic adjudication response (278 EDI transaction):
                </p>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSimulatedOutcome('APPROVED')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        simulatedOutcome === 'APPROVED'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Approve Request
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedOutcome('DENIED')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        simulatedOutcome === 'DENIED'
                          ? 'bg-rose-50 border-rose-500 text-rose-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Deny Request
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedOutcome('ADDITIONAL_INFO_REQUESTED')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        simulatedOutcome === 'ADDITIONAL_INFO_REQUESTED'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Request Info
                    </button>

                    <button
                      type="button"
                      onClick={() => setSimulatedOutcome('PENDING')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        simulatedOutcome === 'PENDING'
                          ? 'bg-purple-50 border-purple-500 text-purple-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      Mark Pending
                    </button>
                  </div>

                  <input
                    type="text"
                    value={simulatedNotes}
                    onChange={(e) => setSimulatedNotes(e.target.value)}
                    placeholder="Custom simulation decision rationale note..."
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />

                  <button
                    type="button"
                    onClick={handleSimulateResponse}
                    disabled={refreshing}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                  >
                    Execute Simulated Payer Decision
                  </button>
                </div>
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base mb-1">Status Timeline</h3>
              <p className="text-xs text-slate-500 mb-4">Complete audit trail of lifecycle transitions</p>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {(request.statusHistory || []).map((h, idx) => (
                  <div key={h.id || idx} className="flex items-start gap-3 text-xs relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                    <div className="flex-1 pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={h.toStatus} size="sm" />
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 mt-1">{h.changeReason}</p>
                      {h.notes && <p className="text-[11px] text-slate-500 mt-0.5">{h.notes}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">Responsible: {h.changedBy?.fullName || 'Clinician'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appeal' && (
        <div className="space-y-5 animate-in fade-in">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
            Upload a payer denial letter in Documents, or enter its reason below. The draft reuses chart extractions and includes source citations; a clinician must review it before use.
          </section>
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="denial-reason">Denial reason</label>
            <textarea id="denial-reason" value={denialReasonText} onChange={(event) => setDenialReasonText(event.target.value)} rows={4} placeholder="Paste the payer's denial rationale, or leave blank to use the uploaded denial letter." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs" />
            <button type="button" onClick={handleDraftAppeal} disabled={appealBusy} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{appealBusy ? 'Preparing…' : 'Draft appeal with cited evidence'}</button>
          </section>
          {(appealDraft || request.appeals?.[0]) && (() => {
            const appeal = appealDraft || request.appeals?.[0];
            return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
              <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Appeal draft</h3><span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800">{appeal.status}</span></div>
              <textarea aria-label="Appeal draft text" value={appeal.draftText} onChange={(event) => setAppealDraft({ ...appeal, draftText: event.target.value })} rows={16} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-relaxed" />
              {appeal.status !== 'SENT' && <button type="button" onClick={handleSubmitAppeal} disabled={appealBusy} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Mark appeal submitted</button>}
              {appeal.status !== 'SENT' && <p className="text-[11px] text-slate-500">This records the workflow status only; no payer transmission is connected.</p>}
            </section>;
          })()}
        </div>
      )}

      {/* Accuracy Review Confirmation Dialog */}
      {showReviewConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Clinical Verification Confirmation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prior to authorization submission, all clinical diagnoses, conservative care timelines, and procedure codes
              must be checked for accuracy against source medical records.
            </p>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
              <strong>Attending Reviewer:</strong> {user?.fullName || 'Dr. Marcus Chen, MD'}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                Confirm Verification & Sign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
