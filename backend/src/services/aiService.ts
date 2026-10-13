export interface ExtractedClinicalFact {
  fieldName: string;
  fieldValue: string;
  confidence: number;
  sourceSnippet: string;
}

export interface AIExtractionResult {
  isSimulated: boolean;
  engineName: string;
  patientName?: ExtractedClinicalFact;
  dob?: ExtractedClinicalFact;
  mrn?: ExtractedClinicalFact;
  diagnosis?: ExtractedClinicalFact;
  diagnosisCodes: ExtractedClinicalFact[];
  requestedService?: ExtractedClinicalFact;
  cptCodes: ExtractedClinicalFact[];
  symptoms: ExtractedClinicalFact[];
  clinicalFindings?: ExtractedClinicalFact;
  previousTreatments: ExtractedClinicalFact[];
  contraindications: ExtractedClinicalFact[];
  orderingPhysicianName?: ExtractedClinicalFact;
  orderingPhysicianNpi?: ExtractedClinicalFact;
  documentDate?: ExtractedClinicalFact;
  allFacts: ExtractedClinicalFact[];
  aiSuggestions: string[];
}

/**
 * Deterministic Clinical NLP Extraction Engine for Demo / Fallback Mode.
 * Accurately analyzes medical document text without hallucinating facts.
 */
export function extractClinicalInformationDeterministic(documentText: string): AIExtractionResult {
  const text = documentText || '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const allFacts: ExtractedClinicalFact[] = [];
  const diagnosisCodes: ExtractedClinicalFact[] = [];
  const cptCodes: ExtractedClinicalFact[] = [];
  const symptoms: ExtractedClinicalFact[] = [];
  const previousTreatments: ExtractedClinicalFact[] = [];
  const contraindications: ExtractedClinicalFact[] = [];
  const aiSuggestions: string[] = [];

  let patientNameFact: ExtractedClinicalFact | undefined;
  let dobFact: ExtractedClinicalFact | undefined;
  let mrnFact: ExtractedClinicalFact | undefined;
  let diagnosisFact: ExtractedClinicalFact | undefined;
  let requestedServiceFact: ExtractedClinicalFact | undefined;
  let clinicalFindingsFact: ExtractedClinicalFact | undefined;
  let orderingPhysicianFact: ExtractedClinicalFact | undefined;
  let npiFact: ExtractedClinicalFact | undefined;
  let docDateFact: ExtractedClinicalFact | undefined;

  // 1. Patient Name & Demographics
  for (const line of lines) {
    // Patient Name
    const nameMatch = line.match(/(?:patient\s*(?:name)?|pt\s*name)[:\s]+([A-Za-z]+(?:\s+[A-Za-z]+){1,3})/i);
    if (nameMatch && !patientNameFact) {
      patientNameFact = {
        fieldName: 'Patient Name',
        fieldValue: nameMatch[1].trim(),
        confidence: 0.98,
        sourceSnippet: line,
      };
      allFacts.push(patientNameFact);
    }

    // DOB
    const dobMatch = line.match(/(?:dob|date\s*of\s*birth|birth\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dobMatch && !dobFact) {
      dobFact = {
        fieldName: 'Date of Birth',
        fieldValue: dobMatch[1].trim(),
        confidence: 0.99,
        sourceSnippet: line,
      };
      allFacts.push(dobFact);
    }

    // MRN
    const mrnMatch = line.match(/(?:mrn|medical\s*record\s*(?:number|#)?|chart\s*#)[:\s]+([A-Za-z0-9\-]+)/i);
    if (mrnMatch && !mrnFact) {
      mrnFact = {
        fieldName: 'Patient MRN',
        fieldValue: mrnMatch[1].trim(),
        confidence: 0.98,
        sourceSnippet: line,
      };
      allFacts.push(mrnFact);
    }

    // Document / Visit Date
    const dateMatch = line.match(/(?:visit\s*date|dos|service\s*date|date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (dateMatch && !docDateFact) {
      docDateFact = {
        fieldName: 'Document Date',
        fieldValue: dateMatch[1].trim(),
        confidence: 0.95,
        sourceSnippet: line,
      };
      allFacts.push(docDateFact);
    }

    // Ordering Physician
    const docMatch = line.match(/(?:ordering\s*(?:provider|physician|clinician)|provider|physician)[:\s]+(Dr\.\s+[A-Za-z]+(?:\s+[A-Za-z]+){1,2}(?:,\s*[A-Z]{2,4})?)/i);
    if (docMatch && !orderingPhysicianFact) {
      orderingPhysicianFact = {
        fieldName: 'Ordering Physician',
        fieldValue: docMatch[1].trim(),
        confidence: 0.97,
        sourceSnippet: line,
      };
      allFacts.push(orderingPhysicianFact);
    }

    // NPI (10-digit number)
    const npiMatch = line.match(/(?:npi|national\s*provider\s*identifier)[:\s#]*(\d{10})/i);
    if (npiMatch && !npiFact) {
      npiFact = {
        fieldName: 'Physician NPI',
        fieldValue: npiMatch[1].trim(),
        confidence: 0.99,
        sourceSnippet: line,
      };
      allFacts.push(npiFact);
    }
  }

  // 2. ICD-10 Codes
  const icdRegex = /\b([A-TV-Z][0-9]{2}(?:\.[0-9A-Z]{1,4})?)\b/g;
  let icdMatch;
  const foundIcd = new Set<string>();
  while ((icdMatch = icdRegex.exec(text)) !== null) {
    const code = icdMatch[1];
    // filter common non-icd matches like CPT or times
    if (code.length >= 3 && !foundIcd.has(code) && /[A-Z]/.test(code[0])) {
      foundIcd.add(code);
      const fact: ExtractedClinicalFact = {
        fieldName: `Diagnosis Code (ICD-10)`,
        fieldValue: code,
        confidence: 0.95,
        sourceSnippet: text.substring(Math.max(0, icdMatch.index - 25), Math.min(text.length, icdMatch.index + 45)).trim(),
      };
      diagnosisCodes.push(fact);
      allFacts.push(fact);
    }
  }

  // 3. CPT Codes (5 digit numeric)
  const cptRegex = /(?:CPT|procedure\s*code|code)?[:\s#]*\b(7\d{4}|2\d{4}|9\d{4}|J\d{4})\b/gi;
  let cptMatch;
  const foundCpt = new Set<string>();
  while ((cptMatch = cptRegex.exec(text)) !== null) {
    const code = cptMatch[1];
    if (!foundCpt.has(code)) {
      foundCpt.add(code);
      const fact: ExtractedClinicalFact = {
        fieldName: `CPT / Procedure Code`,
        fieldValue: code,
        confidence: 0.96,
        sourceSnippet: text.substring(Math.max(0, cptMatch.index - 20), Math.min(text.length, cptMatch.index + 40)).trim(),
      };
      cptCodes.push(fact);
      allFacts.push(fact);
    }
  }

  // 4. Diagnosis and Clinical Assessment
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/(?:assessment\s*(?:&|and)\s*plan|diagnosis|impression|primary\s*diagnosis)[:\s]/i.test(line)) {
      // Gather lines following this
      const assessmentLines: string[] = [];
      for (let j = i; j < Math.min(lines.length, i + 5); j++) {
        if (lines[j].length > 3) assessmentLines.push(lines[j]);
      }
      if (!diagnosisFact && assessmentLines.length > 0) {
        diagnosisFact = {
          fieldName: 'Primary Diagnosis / Clinical Impression',
          fieldValue: assessmentLines.slice(0, 3).join('; ').replace(/^(?:assessment\s*(?:&|and)\s*plan|diagnosis)[:\s]*/i, '').trim(),
          confidence: 0.92,
          sourceSnippet: assessmentLines.slice(0, 2).join(' '),
        };
        allFacts.push(diagnosisFact);
      }
    }

    // Requested Service / Order
    if (/(?:order(?:ed)?|plan|procedure\s*requested|requested\s*service)[:\s]/i.test(line)) {
      if (!requestedServiceFact) {
        requestedServiceFact = {
          fieldName: 'Requested Service / Procedure',
          fieldValue: line.replace(/^(?:order(?:ed)?|plan|procedure\s*requested|requested\s*service)[:\s]*/i, '').trim(),
          confidence: 0.94,
          sourceSnippet: line,
        };
        allFacts.push(requestedServiceFact);
      }
    }

    // Physical Examination / Clinical Findings
    if (/(?:physical\s*examination|objective\s*findings|clinical\s*findings|exam)[:\s]/i.test(line)) {
      const examLines = lines.slice(i, i + 4).join(' ');
      if (!clinicalFindingsFact) {
        clinicalFindingsFact = {
          fieldName: 'Objective Clinical Findings',
          fieldValue: examLines.substring(0, 300).trim(),
          confidence: 0.90,
          sourceSnippet: line,
        };
        allFacts.push(clinicalFindingsFact);
      }
    }

    // Previous Treatments (PT, Medications, Injections)
    if (/(?:conservative\s*treatment|physical\s*therapy|failed|prior\s*medications|treatment\s*history|trial\s*of)[:\s]/i.test(line)) {
      previousTreatments.push({
        fieldName: 'Prior Conservative Treatment',
        fieldValue: line.trim(),
        confidence: 0.91,
        sourceSnippet: line,
      });
      allFacts.push(previousTreatments[previousTreatments.length - 1]);
    }

    // Symptoms / Chief Complaint
    if (/(?:chief\s*complaint|symptoms|patient\s*reports|pain\s*scale|radicular)[:\s]/i.test(line)) {
      symptoms.push({
        fieldName: 'Documented Symptoms',
        fieldValue: line.trim(),
        confidence: 0.89,
        sourceSnippet: line,
      });
      allFacts.push(symptoms[symptoms.length - 1]);
    }

    // Contraindications / Red Flags
    if (/(?:contraindication|red\s*flags|allergies|cauda\s*equina|infection)[:\s]/i.test(line)) {
      contraindications.push({
        fieldName: 'Safety Screening / Contraindications',
        fieldValue: line.trim(),
        confidence: 0.88,
        sourceSnippet: line,
      });
      allFacts.push(contraindications[contraindications.length - 1]);
    }
  }

  // Suggestions for missing or incomplete areas
  if (!previousTreatments.length) {
    aiSuggestions.push('No documented conservative therapy duration (e.g., 6 weeks PT) detected. Payers routinely require documented physical therapy or NSAID trial dates.');
  }
  if (!cptCodes.length) {
    aiSuggestions.push('Specific 5-digit CPT code was not explicitly noted. Confirm exact procedure code with ordering physician before submission.');
  }
  if (!npiFact) {
    aiSuggestions.push('Ordering physician NPI not located in document body. Ensure NPI is verified before submission.');
  }

  return {
    isSimulated: true,
    engineName: 'Deterministic Clinical NLP Engine (PriorAuth Assistant v2026)',
    patientName: patientNameFact,
    dob: dobFact,
    mrn: mrnFact,
    diagnosis: diagnosisFact,
    diagnosisCodes,
    requestedService: requestedServiceFact,
    cptCodes,
    symptoms,
    clinicalFindings: clinicalFindingsFact,
    previousTreatments,
    contraindications,
    orderingPhysicianName: orderingPhysicianFact,
    orderingPhysicianNpi: npiFact,
    documentDate: docDateFact,
    allFacts,
    aiSuggestions,
  };
}

import { groqManager } from './groqService.js';

/**
 * Main AI extraction service dispatcher powered by Groq Multi-Key Failover Pool
 */
export async function runClinicalExtraction(documentText: string): Promise<AIExtractionResult> {
  const text = (documentText || '').trim();
  if (text.length < 15) {
    return extractClinicalInformationDeterministic(documentText);
  }

  try {
    const prompt = `You are an expert HIPAA-compliant clinical documentation analyst extracting information from medical records for Prior Authorization review.
Analyze the following clinical chart note and extract all relevant clinical facts.

CRITICAL ANTI-HALLUCINATION RULES:
1. Every piece of extracted information MUST be grounded directly in the text.
2. For EVERY field, provide an exact, verbatim quote in "sourceSnippet" copied directly from the text where this fact appears. Do not modify, abbreviate, or correct punctuation in sourceSnippet.
3. If a field is not present in the document, omit it or set it to null. DO NOT guess or infer unstated facts.

Return a JSON object matching this exact schema:
{
  "patientName": { "value": "John Doe", "sourceSnippet": "exact quote" },
  "dob": { "value": "01/01/1980", "sourceSnippet": "exact quote" },
  "mrn": { "value": "MRN-12345", "sourceSnippet": "exact quote" },
  "documentDate": { "value": "03/15/2026", "sourceSnippet": "exact quote" },
  "orderingPhysicianName": { "value": "Dr. Sarah Smith", "sourceSnippet": "exact quote" },
  "orderingPhysicianNpi": { "value": "1234567890", "sourceSnippet": "exact quote" },
  "diagnosis": { "value": "Lumbar radiculopathy", "sourceSnippet": "exact quote" },
  "diagnosisCodes": [
    { "code": "M54.16", "description": "Radiculopathy, lumbar region", "sourceSnippet": "exact quote" }
  ],
  "requestedService": { "value": "Lumbar Spine MRI Without Contrast", "sourceSnippet": "exact quote" },
  "cptCodes": [
    { "code": "72148", "description": "MRI lumbar spine without dye", "sourceSnippet": "exact quote" }
  ],
  "clinicalFindings": { "value": "Positive straight leg raise on right at 45 degrees", "sourceSnippet": "exact quote" },
  "symptoms": [
    { "symptom": "Radiating right leg pain for 8 weeks", "sourceSnippet": "exact quote" }
  ],
  "previousTreatments": [
    { "treatment": "Physical therapy 6 weeks and oral NSAIDs", "sourceSnippet": "exact quote" }
  ],
  "contraindications": [
    { "contraindication": "No red flag signs", "sourceSnippet": "exact quote" }
  ],
  "aiSuggestions": [
    "string advice regarding prior authorization approval or documentation completeness"
  ]
}

Document Text:
"""
${text.substring(0, 12000)}
"""`;

    const rawResult = await groqManager.chatCompletionJSON<any>([
      {
        role: 'system',
        content: 'You are an expert clinical NLP extraction engine for health plan prior authorization. Always respond with strict, valid JSON matching the requested schema. Provide verbatim source snippets from the text for every extracted fact.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Anti-hallucination verification helper
    const verifyFact = (
      fieldName: string,
      obj?: { value?: string; sourceSnippet?: string } | null
    ): ExtractedClinicalFact | undefined => {
      if (!obj || !obj.value) return undefined;
      const val = String(obj.value).trim();
      if (!val) return undefined;

      let snippet = String(obj.sourceSnippet || '').trim();
      let confidence = 0.96;

      // Anti-hallucination check: is snippet an exact substring?
      if (snippet && text.includes(snippet)) {
        confidence = 0.98;
      } else if (snippet) {
        // Try case-insensitive lookup
        const lowerSnippet = snippet.toLowerCase();
        const lowerText = text.toLowerCase();
        const foundIdx = lowerText.indexOf(lowerSnippet);
        if (foundIdx >= 0) {
          snippet = text.substring(foundIdx, foundIdx + snippet.length);
          confidence = 0.95;
        } else {
          // Snippet was slightly modified by LLM; attempt to find value in text
          const valIdx = lowerText.indexOf(val.toLowerCase());
          if (valIdx >= 0) {
            snippet = text.substring(
              Math.max(0, valIdx - 20),
              Math.min(text.length, valIdx + val.length + 30)
            ).trim();
            confidence = 0.88;
          } else {
            // Potential hallucination or paraphrased fact
            confidence = 0.55;
          }
        }
      } else {
        confidence = 0.60;
      }

      return {
        fieldName,
        fieldValue: val,
        confidence,
        sourceSnippet: snippet || val,
      };
    };

    const allFacts: ExtractedClinicalFact[] = [];

    const patientName = verifyFact('Patient Name', rawResult.patientName);
    if (patientName) allFacts.push(patientName);

    const dob = verifyFact('Date of Birth', rawResult.dob);
    if (dob) allFacts.push(dob);

    const mrn = verifyFact('Patient MRN', rawResult.mrn);
    if (mrn) allFacts.push(mrn);

    const docDate = verifyFact('Document Date', rawResult.documentDate);
    if (docDate) allFacts.push(docDate);

    const orderingPhysicianName = verifyFact('Ordering Physician', rawResult.orderingPhysicianName);
    if (orderingPhysicianName) allFacts.push(orderingPhysicianName);

    const orderingPhysicianNpi = verifyFact('Physician NPI', rawResult.orderingPhysicianNpi);
    if (orderingPhysicianNpi) allFacts.push(orderingPhysicianNpi);

    const diagnosis = verifyFact('Primary Diagnosis / Clinical Impression', rawResult.diagnosis);
    if (diagnosis) allFacts.push(diagnosis);

    const requestedService = verifyFact('Requested Service / Procedure', rawResult.requestedService);
    if (requestedService) allFacts.push(requestedService);

    const clinicalFindings = verifyFact('Objective Clinical Findings', rawResult.clinicalFindings);
    if (clinicalFindings) allFacts.push(clinicalFindings);

    const diagnosisCodes: ExtractedClinicalFact[] = [];
    if (Array.isArray(rawResult.diagnosisCodes)) {
      for (const dc of rawResult.diagnosisCodes) {
        const fact = verifyFact(
          `Diagnosis Code (${dc.code || 'ICD-10'})`,
          { value: dc.code ? `${dc.code}${dc.description ? ' - ' + dc.description : ''}` : dc.description, sourceSnippet: dc.sourceSnippet }
        );
        if (fact) {
          diagnosisCodes.push(fact);
          allFacts.push(fact);
        }
      }
    }

    const cptCodes: ExtractedClinicalFact[] = [];
    if (Array.isArray(rawResult.cptCodes)) {
      for (const cpt of rawResult.cptCodes) {
        const fact = verifyFact(
          `CPT / Procedure Code`,
          { value: cpt.code || cpt.value, sourceSnippet: cpt.sourceSnippet }
        );
        if (fact) {
          cptCodes.push(fact);
          allFacts.push(fact);
        }
      }
    }

    const symptoms: ExtractedClinicalFact[] = [];
    if (Array.isArray(rawResult.symptoms)) {
      for (const s of rawResult.symptoms) {
        const itemVal = typeof s === 'string' ? s : s.symptom || s.value;
        const itemSnippet = typeof s === 'string' ? s : s.sourceSnippet;
        const fact = verifyFact('Documented Symptoms', { value: itemVal, sourceSnippet: itemSnippet });
        if (fact) {
          symptoms.push(fact);
          allFacts.push(fact);
        }
      }
    }

    const previousTreatments: ExtractedClinicalFact[] = [];
    if (Array.isArray(rawResult.previousTreatments)) {
      for (const pt of rawResult.previousTreatments) {
        const itemVal = typeof pt === 'string' ? pt : pt.treatment || pt.value;
        const itemSnippet = typeof pt === 'string' ? pt : pt.sourceSnippet;
        const fact = verifyFact('Prior Conservative Treatment', { value: itemVal, sourceSnippet: itemSnippet });
        if (fact) {
          previousTreatments.push(fact);
          allFacts.push(fact);
        }
      }
    }

    const contraindications: ExtractedClinicalFact[] = [];
    if (Array.isArray(rawResult.contraindications)) {
      for (const c of rawResult.contraindications) {
        const itemVal = typeof c === 'string' ? c : c.contraindication || c.value;
        const itemSnippet = typeof c === 'string' ? c : c.sourceSnippet;
        const fact = verifyFact('Safety Screening / Contraindications', { value: itemVal, sourceSnippet: itemSnippet });
        if (fact) {
          contraindications.push(fact);
          allFacts.push(fact);
        }
      }
    }

    const aiSuggestions: string[] = Array.isArray(rawResult.aiSuggestions)
      ? rawResult.aiSuggestions.filter((s: any) => typeof s === 'string' && s.length > 5)
      : [];

    // If any critical demographic or code fact is missing, supplement with deterministic regex pass
    const deterministic = extractClinicalInformationDeterministic(documentText);
    if (!cptCodes.length && deterministic.cptCodes.length) {
      cptCodes.push(...deterministic.cptCodes);
      allFacts.push(...deterministic.cptCodes);
    }
    if (!diagnosisCodes.length && deterministic.diagnosisCodes.length) {
      diagnosisCodes.push(...deterministic.diagnosisCodes);
      allFacts.push(...deterministic.diagnosisCodes);
    }
    if (!orderingPhysicianNpi && deterministic.orderingPhysicianNpi) {
      allFacts.push(deterministic.orderingPhysicianNpi);
    }

    const poolStatus = groqManager.getPoolStatus();

    return {
      isSimulated: false,
      engineName: `Groq High-Performance Clinical LLM (${poolStatus.model} - Key #${poolStatus.activeKeyIndex} of ${poolStatus.totalKeys})`,
      patientName: patientName || deterministic.patientName,
      dob: dob || deterministic.dob,
      mrn: mrn || deterministic.mrn,
      diagnosis: diagnosis || deterministic.diagnosis,
      diagnosisCodes,
      requestedService: requestedService || deterministic.requestedService,
      cptCodes,
      symptoms,
      clinicalFindings: clinicalFindings || deterministic.clinicalFindings,
      previousTreatments,
      contraindications,
      orderingPhysicianName: orderingPhysicianName || deterministic.orderingPhysicianName,
      orderingPhysicianNpi: orderingPhysicianNpi || deterministic.orderingPhysicianNpi,
      documentDate: docDate || deterministic.documentDate,
      allFacts,
      aiSuggestions: aiSuggestions.length ? aiSuggestions : deterministic.aiSuggestions,
    };
  } catch (error) {
    console.warn('⚠️ [Groq AI] Live extraction failed across failover pool. Falling back to deterministic NLP engine:', error);
    return extractClinicalInformationDeterministic(documentText);
  }
}

