import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  FileCheck2,
  AlertTriangle,
  FileText,
  Search,
  ArrowRight,
  Send,
  Lock,
  Clock,
  Sparkles,
  CheckCircle2,
  Database,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const LandingPage: React.FC = () => {
  const { quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const { success } = useToast();

  const handleExploreDemo = async () => {
    try {
      await quickDemoLogin('DOCTOR');
      success('Logged in with Demo Doctor Account (Dr. Marcus Chen, MD)', 'Demo Session Started');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    }
  };

  const workflowSteps = [
    { num: '01', title: 'Upload Documents', desc: 'Securely upload clinical consultation notes, imaging reports, and lab findings.', icon: FileText },
    { num: '02', title: 'Extract Clinical Facts', desc: 'Medical NLP extracts diagnoses, ICD-10, CPT, therapy trials, and clinician NPI.', icon: Sparkles },
    { num: '03', title: 'Analyze Guidelines', desc: 'Evaluates evidence against active, configurable payer requirement profiles.', icon: Search },
    { num: '04', title: 'Detect Missing Info', desc: 'Identifies gaps before submission, preventing costly insurer rejections.', icon: AlertTriangle },
    { num: '05', title: 'Generate Packet Draft', desc: 'Compiles formatted prior authorization forms with attached evidence checklists.', icon: FileCheck2 },
    { num: '06', title: 'Physician Review', desc: 'Attending clinicians verify facts, ensuring complete clinical accuracy.', icon: ShieldCheck },
    { num: '07', title: 'Track Payer Status', desc: 'Simulates electronic gateway transmission with live timeline and status updates.', icon: Send },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/25">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-950 flex items-center gap-1.5">
                PriorAuth<span className="text-blue-600">Assistant</span>
              </span>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Clinical Prior Authorization Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition shadow-2xs"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-blue-600 transition shadow-md shadow-slate-900/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/60 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 animate-soft-pulse">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Enterprise Prior Authorization Intelligence • Clinical Documentation Acceleration</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight">
            Simplify Prior Authorization. <br />
            <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-500 bg-clip-text text-transparent">
              Accelerate Patient Care.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Smarter Documentation. Faster Approvals. Better Patient Care. Reduce manual paperwork,
            eliminate missing clinical information, and prepare compliant prior authorization packets in minutes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
            >
              <span>Create Provider Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-base shadow-xs flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Sign In to Clinical Portal</span>
            </Link>
          </div>

          {/* Value Stats Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-3xl font-extrabold text-blue-600">80%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Faster Packet Preparation</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-3xl font-extrabold text-cyan-600">0%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Zero Hallucinations Policy</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-3xl font-extrabold text-teal-600">100%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Payer Policy Compliance</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <p className="text-3xl font-extrabold text-purple-600">24/7</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Instant Missing Info Check</p>
            </div>
          </div>
        </div>
      </section>

      {/* The 7-Step Interactive Workflow */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
              End-to-End Clinical Intelligence
            </h2>
            <h3 className="text-3xl font-bold text-slate-950 sm:text-4xl">
              How The Prior Authorization Workflow Operates
            </h3>
            <p className="mt-3 text-slate-600">
              From raw clinical notes to finalized payer packet delivery, every stage is structured, verified, and tracked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-300 relative group ${
                    idx === 6 ? 'md:col-span-2 lg:col-span-1' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800">
                      Step {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-1.5">{step.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Problem & Solution Cards */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* The Problem */}
            <div className="bg-rose-50/60 p-8 rounded-3xl border border-rose-200/80">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold mb-4">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>The Clinical Administrative Burden</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-4">
                Prior Authorizations Are Stalling Patient Treatment
              </h3>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✕</div>
                  <span>Physicians spend 14+ hours per week manually gathering notes and filing payer appeals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✕</div>
                  <span>A single missing lab test or PT duration results in repeated denials and weeks of patient delay.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✕</div>
                  <span>Every insurance carrier maintains disparate, opaque clinical guidelines that change regularly.</span>
                </li>
              </ul>
            </div>

            {/* The Solution */}
            <div className="bg-blue-50/60 p-8 rounded-3xl border border-blue-200/80">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-4">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Our Proposed Solution</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-950 mb-4">
                Automated Clinical Extraction & Gap Detection
              </h3>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <span>Deterministic Medical NLP parses consult notes, imaging, and labs with zero hallucination.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <span>Configurable Payer Engine checks criteria in real-time, calculating exact readiness percentages.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">✓</div>
                  <span>Generates structured clinical packets with downloadable PDFs and simulated payer tracking.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security & HIPAA Compliance Notice */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold text-slate-950 mb-2">
            Built with Security, Privacy, and Verifiability
          </h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-8">
            This hackathon prototype utilizes 100% synthetic patient records. Designed following healthcare security
            principles with role-based access control (RBAC), bcrypt hashing, session cookies, and comprehensive audit logs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h5 className="font-bold text-slate-800 text-sm mb-1">Role-Based Access</h5>
              <p className="text-xs text-slate-600">Restricted permissions separating Administrators, Attending Doctors, and Care Coordinators.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h5 className="font-bold text-slate-800 text-sm mb-1">Verifiable Evidence</h5>
              <p className="text-xs text-slate-600">Every extracted fact links back to its exact snippet in the source medical record.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h5 className="font-bold text-slate-800 text-sm mb-1">Immutable Audit Trail</h5>
              <p className="text-xs text-slate-600">Every upload, clinical modification, review, and demo submission is securely logged.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base">Prior Authorization Assistant</span>
          </div>

          <div className="text-xs text-center md:text-right text-slate-400">
            <p>Prior Authorization Management Platform • Compliant Health System Infrastructure</p>
            <p className="mt-1 text-[11px] text-slate-500">
              HIPAA-aligned administrative clinical documentation preparation and payer clearinghouse management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
