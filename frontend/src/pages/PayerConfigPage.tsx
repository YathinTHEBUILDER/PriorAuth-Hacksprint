import React, { useState, useEffect } from 'react';
import { Sliders, Plus, CheckCircle2, AlertTriangle, ShieldCheck, Edit, Sparkles } from 'lucide-react';
import { adminApi, payersApi } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const PayerConfigPage: React.FC = () => {
  const { success, error } = useToast();

  const [profiles, setProfiles] = useState<any[]>([]);
  const [payers, setPayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [payerId, setPayerId] = useState('');
  const [serviceCategory, setServiceCategory] = useState('RADIOLOGY');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('2026.1');
  const [reqName, setReqName] = useState('');
  const [reqDesc, setReqDesc] = useState('');

  const loadConfigs = async () => {
    try {
      const [profRes, payRes] = await Promise.all([
        adminApi.getPayerConfigs(),
        payersApi.getPayers(),
      ]);
      setProfiles(profRes.profiles);
      setPayers(payRes.payers);
      if (payRes.payers.length > 0) setPayerId(payRes.payers[0].id);
    } catch {
      error('Failed to load payer guidelines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createPayerConfig({
        payerId,
        serviceCategory,
        version,
        description,
        requirements: [
          {
            name: reqName || 'Clinical Examination Note',
            description: reqDesc || 'Face-to-face physician consultation note within past 60 days.',
            isRequired: true,
            acceptedDocTypes: 'CLINICAL_NOTES',
            applicabilityRule: 'ALL',
            validationInstruction: 'Verify clinician note date and objective findings.',
          },
        ],
      });
      success('New payer requirement profile created successfully.');
      setShowCreateModal(false);
      setDescription('');
      setReqName('');
      loadConfigs();
    } catch (err: any) {
      error(err.message || 'Failed to create configuration.');
    }
  };

  const handleToggleProfileActive = async (profile: any) => {
    try {
      await adminApi.updatePayerConfig(profile.id, { isActive: !profile.isActive });
      success(`Profile ${profile.description} is now ${!profile.isActive ? 'Active' : 'Inactive'}.`);
      loadConfigs();
    } catch (err: any) {
      error(err.message || 'Failed to update profile status.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            Payer Guidelines & Requirement Profiles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic rules, required evidence documents, and medical necessity validation criteria.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Guideline Profile</span>
        </button>
      </div>

      {/* Prominent Demo Notice */}
      <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs flex items-center gap-2.5">
        <Sparkles className="w-5 h-5 text-cyan-700 shrink-0" />
        <p className="leading-relaxed">
          <strong>DEMO CONFIGURATION NOTICE:</strong> Fictional payer profiles and clinical rules below are designed for
          prototype evaluation. Verify actual health plan medical coverage guidelines before deploying in live environments.
        </p>
      </div>

      {/* Profiles Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading configurations...</div>
        ) : (
          profiles.map((prof) => (
            <div
              key={prof.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-slate-900">{prof.payer.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {prof.serviceCategory} • v{prof.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{prof.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      prof.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {prof.isActive ? 'Active Policy' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggleProfileActive(prof)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition"
                  >
                    {prof.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              {/* Requirements inside this profile */}
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2.5">
                  Configured Criteria Rules ({prof.requirements?.length || 0})
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(prof.requirements || []).map((req: any) => (
                    <div key={req.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{req.name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            req.isRequired ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {req.isRequired ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{req.description}</p>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Accepted: <strong>{req.acceptedDocTypes}</strong></span>
                        <span className="font-mono text-slate-400">{req.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Profile */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Create Payer Guidelines Profile</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Define insurance carrier medical necessity criteria and required clinical document types.
            </p>

            <form onSubmit={handleCreateProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Payer</label>
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {payers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="RADIOLOGY">Advanced Diagnostic Radiology</option>
                    <option value="SURGERY">Outpatient Orthopedic Surgery</option>
                    <option value="SPECIALTY_DRUG">Specialty Biologic Medication</option>
                    <option value="PHYSICAL_THERAPY">Physical Therapy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Version Tag</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="2026.1"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Prior Auth Criteria for Lumbar Spine Advanced Imaging"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Initial Requirement Rule</span>
                <input
                  type="text"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  placeholder="Rule Name (e.g. 6+ Weeks Physical Therapy Trial)"
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  placeholder="Rule Explanation (e.g. Documented PT sessions without pain relief)"
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs"
                >
                  Save Policy Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
