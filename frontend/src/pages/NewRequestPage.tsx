import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus,
  User,
  ShieldCheck,
  Search,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { patientsApi, payersApi, requestsApi } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const NewRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { user } = useAuth();

  const [patients, setPatients] = useState<any[]>([]);
  const [payers, setPayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPayerId, setSelectedPayerId] = useState('');
  const [serviceType, setServiceType] = useState('RADIOLOGY');
  const [requestedService, setRequestedService] = useState('MRI Lumbar Spine without Contrast (CPT 72148)');
  const [cptCode, setCptCode] = useState('72148');
  const [icd10Code, setIcd10Code] = useState('M54.16');
  const [priority, setPriority] = useState<'STANDARD' | 'URGENT' | 'EXPEDITED'>('STANDARD');
  const [notes, setNotes] = useState('Intractable radicular pain radiating to lower extremity. Completed physical therapy trial.');

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, payRes] = await Promise.all([
          patientsApi.getPatients(),
          payersApi.getPayers(),
        ]);
        setPatients(patRes.patients);
        setPayers(payRes.payers);

        if (patRes.patients.length > 0) {
          setSelectedPatientId(patRes.patients[0].id);
          setSelectedPayerId(patRes.patients[0].insurancePayerId);
        }
      } catch (err) {
        error('Failed to load patient and payer directories.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // When patient changes, automatically select their insurance payer
  const handlePatientSelect = (patId: string) => {
    setSelectedPatientId(patId);
    const pat = patients.find((p) => p.id === patId);
    if (pat && pat.insurancePayerId) {
      setSelectedPayerId(pat.insurancePayerId);
    }
  };

  const handleTemplateSelect = (template: {
    serviceType: string;
    service: string;
    cpt: string;
    icd: string;
    notes: string;
  }) => {
    setServiceType(template.serviceType);
    setRequestedService(template.service);
    setCptCode(template.cpt);
    setIcd10Code(template.icd);
    setNotes(template.notes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatientId || !selectedPayerId || !requestedService) {
      error('Please complete all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestsApi.createRequest({
        patientId: selectedPatientId,
        payerId: selectedPayerId,
        serviceType,
        requestedService,
        cptCodes: cptCode ? [cptCode] : [],
        icd10Codes: icd10Code ? [icd10Code] : [],
        priority,
        notes,
      });

      success(`Prior authorization ${res.request.requestNumber} created in Draft status.`, 'Request Initiated');
      navigate(`/requests/${res.request.id}`);
    } catch (err: any) {
      error(err.message || 'Failed to create prior authorization request.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FilePlus className="w-6 h-6 text-blue-600" />
          Create Prior Authorization Request
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Initiate a new prior authorization record from patient EHR charts. Upload documents and evaluate guidelines in the next steps.
        </p>
      </div>

      {/* Preset Clinical Templates */}
      <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-cyan-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-900">
            Common Clinical Service Templates
          </h4>
        </div>
        <p className="text-xs text-cyan-800 mb-3">
          Select a common high-burden prior authorization scenario to auto-populate service details:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              handleTemplateSelect({
                serviceType: 'RADIOLOGY',
                service: 'MRI Lumbar Spine without Contrast (CPT 72148)',
                cpt: '72148',
                icd: 'M54.16',
                notes: 'Persistent low back pain with radiculopathy into left L5 dermatome. Completed 8 weeks of PT.',
              })
            }
            className="p-3 bg-white hover:bg-blue-50 border border-cyan-200 rounded-xl text-left text-xs transition"
          >
            <span className="font-bold text-blue-900 block">Lumbar Spine MRI</span>
            <span className="text-[11px] text-slate-500">CPT 72148 • Radiculopathy</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTemplateSelect({
                serviceType: 'SURGERY',
                service: 'Right Knee Arthroscopy with Partial Meniscectomy (CPT 29881)',
                cpt: '29881',
                icd: 'M23.22',
                notes: 'Complex posterior horn medial meniscal tear with persistent mechanical locking after sports injury.',
              })
            }
            className="p-3 bg-white hover:bg-cyan-50 border border-cyan-200 rounded-xl text-left text-xs transition"
          >
            <span className="font-bold text-cyan-900 block">Knee Arthroscopy</span>
            <span className="text-[11px] text-slate-500">CPT 29881 • Meniscal Tear</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleTemplateSelect({
                serviceType: 'SPECIALTY_DRUG',
                service: 'Adalimumab (Humira) 40mg/0.4mL SQ Bi-weekly (HCPCS J0135)',
                cpt: 'J0135',
                icd: 'M06.9',
                notes: 'Moderate-to-severe Rheumatoid Arthritis failing Methotrexate 20mg weekly with elevated disease activity.',
              })
            }
            className="p-3 bg-white hover:bg-purple-50 border border-cyan-200 rounded-xl text-left text-xs transition"
          >
            <span className="font-bold text-purple-900 block">Biologic Therapy</span>
            <span className="text-[11px] text-slate-500">J0135 • Rheumatoid Arthritis</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Section 1: Patient Selection */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            1. Patient Demographics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} (MRN: {p.mrn})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col justify-center">
                <span className="font-semibold text-slate-800">
                  {selectedPatient.firstName} {selectedPatient.lastName} • DOB: {selectedPatient.dateOfBirth}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Member ID: {selectedPatient.insuranceMemberId} • Plan: {selectedPatient.payer?.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Payer Selection */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            2. Health Plan & Payer Gateway
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Insurance Payer</label>
              <select
                value={selectedPayerId}
                onChange={(e) => setSelectedPayerId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                required
              >
                {payers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="RADIOLOGY">Advanced Diagnostic Radiology</option>
                <option value="SURGERY">Outpatient Orthopedic Surgery</option>
                <option value="SPECIALTY_DRUG">Specialty Biologic Medication</option>
                <option value="PHYSICAL_THERAPY">Physical & Occupational Therapy</option>
                <option value="CARDIOLOGY">Cardiology Diagnostics</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Clinical Service Details */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            3. Clinical Procedure & Indication
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Service / Procedure Name
              </label>
              <input
                type="text"
                value={requestedService}
                onChange={(e) => setRequestedService(e.target.value)}
                placeholder="e.g. MRI Lumbar Spine without Contrast (CPT 72148)"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPT / HCPCS Code</label>
                <input
                  type="text"
                  value={cptCode}
                  onChange={(e) => setCptCode(e.target.value)}
                  placeholder="72148"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary ICD-10 Code</label>
                <input
                  type="text"
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  placeholder="M54.16"
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="STANDARD">Standard Review (7-14 Days)</option>
                  <option value="URGENT">Urgent (48-72 Hours)</option>
                  <option value="EXPEDITED">Expedited (24 Hours)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Rationale & Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Document clinical indication, onset of symptoms, and conservative care trials..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/requests')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? (
              <span>Initializing Request...</span>
            ) : (
              <>
                <span>Create & Proceed to Documents</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
