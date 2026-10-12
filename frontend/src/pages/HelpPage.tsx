import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, FileText, Sparkles, Send } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const guideSteps = [
    {
      title: 'Step 1: Initiate an Authorization Request',
      desc: 'Navigate to "New Request", select the patient from your EHR directory or create a record, pick the target payer, service category, and enter the CPT and ICD-10 diagnosis codes.',
    },
    {
      title: 'Step 2: Upload Clinical Documentation',
      desc: 'In the request packet, upload consultation notes, physical exam reports, diagnostic MRI/CT reports, or laboratory results (PDF, PNG, JPG). If you have physical paper, use the Manual Text Entry fallback tab.',
    },
    {
      title: 'Step 3: Automated Clinical Fact Extraction',
      desc: 'Our Deterministic Clinical NLP Engine immediately processes document text to extract patient facts, diagnosis descriptions, ICD-10 codes, conservative therapy trials (e.g. 6+ weeks of PT), physical exam findings, and provider NPI.',
    },
    {
      title: 'Step 4: Real-time Missing Information Detection',
      desc: 'The Completeness Engine dynamically cross-references extracted facts against the active payer requirement profile for that procedure. It flags gaps (e.g. missing recent TB test or lack of conservative therapy duration) before submission.',
    },
    {
      title: 'Step 5: Generate Prior Authorization Draft & PDF',
      desc: 'Compile a structured Prior Authorization summary. You can preview the complete clinical justification packet on screen or download a high-resolution PDF document.',
    },
    {
      title: 'Step 6: Attending Physician Review & Sign-Off',
      desc: 'Attending clinicians inspect facts, confirm medical necessity, and execute a formal electronic review sign-off. Safeguards block confirmation if mandatory clinical criteria are unmet.',
    },
    {
      title: 'Step 7: Dispatch Simulated Submission & Track Status',
      desc: 'Submit the packet to the simulated electronic payer gateway. A unique submission reference (e.g. DEMO-SUB-88391) is assigned, and you can test approval, denial, or additional-information-requested transitions using the response simulator.',
    },
  ];

  const faqs = [
    {
      q: 'Does this platform communicate directly with real insurance companies?',
      a: 'No. In this hackathon demonstration environment, all payer gateways, approval confirmations, and electronic references are strictly simulated. Real patient requests must not be submitted without verified real-world payer EDI integrations.',
    },
    {
      q: 'Does the AI engine fabricate or hallucinate medical information?',
      a: 'Never. Our extraction service follows a strict Zero-Hallucination policy. If a clinical fact (such as a previous drug trial or physical exam finding) is not explicitly present in the uploaded documentation, the system marks it as "Not found in documents" and flags it for human clinician attention.',
    },
    {
      q: 'Can a staff member mark a request Ready for Submission if items are missing?',
      a: 'No. The system enforces strict administrative and clinical guardrails. If any applicable required criteria remain flagged as MISSING, the system prevents marking the request as ready for submission until the documentation gap is resolved.',
    },
    {
      q: 'What document file types are supported?',
      a: 'PDF, PNG, JPG, and JPEG files up to 15MB. Additionally, a manual text-entry area allows pasting clinical notes when scanning hardware is unavailable.',
    },
    {
      q: 'How are payer requirements configured?',
      a: 'Administrators can configure active payer requirement profiles under "Payer Guidelines" with custom rule codes, applicability criteria (e.g. patients age 50+), and accepted document categories stored directly in the database.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Clinical Workflow Protocol & Documentation Guide
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Operational guide explaining clinical document parsing, missing-information detection, and mock payer submission.
        </p>
      </div>

      {/* Mandatory Medical Disclaimer Notice */}
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm">Clinical & Administrative Notice</h4>
          <p className="leading-relaxed">
            The Prior Authorization Assistant is designed solely for administrative document processing and preparation
            assistance. The software does not provide medical diagnoses, treatment recommendations, or clinical judgment.
            All medical justifications must be verified and signed off by a licensed healthcare professional.
          </p>
        </div>
      </div>

      {/* Step-by-Step Walkthrough */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
        <h3 className="font-bold text-slate-900 text-base">Step-by-Step Prior Authorization Workflow</h3>

        <div className="space-y-4">
          {guideSteps.map((step, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
              <h4 className="font-bold text-slate-900 text-sm mb-1">{step.title}</h4>
              <p className="text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Frequently Asked Questions</h3>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, idx) => (
            <div key={idx} className="py-3.5">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:text-blue-600 transition"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFaq === idx && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed animate-in fade-in">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
