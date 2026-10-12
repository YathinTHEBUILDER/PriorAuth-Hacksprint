"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Organization
    const org = await prisma.organization.upsert({
        where: { id: 'org-metro-health' },
        update: {},
        create: {
            id: 'org-metro-health',
            name: 'Metro Health System & Orthopedic Institute',
            type: 'HOSPITAL',
            contactEmail: 'priorauth-ops@metrohealth.example.com',
            contactPhone: '(555) 234-5678',
            address: '742 Healthcare Parkway, Suite 400, Chicago, IL 60611',
        },
    });
    // 2. Users
    const passwordHash = await bcryptjs_1.default.hash('Password123!', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@priorauth.health' },
        update: {},
        create: {
            id: 'user-admin-01',
            email: 'admin@priorauth.health',
            passwordHash,
            fullName: 'Dr. Eleanor Vance, MD',
            role: 'ADMINISTRATOR',
            organization: 'Metro Health System',
            isActive: true,
        },
    });
    const doctorUser = await prisma.user.upsert({
        where: { email: 'doctor@priorauth.health' },
        update: {},
        create: {
            id: 'user-doctor-01',
            email: 'doctor@priorauth.health',
            passwordHash,
            fullName: 'Dr. Marcus Chen, MD',
            role: 'DOCTOR',
            organization: 'Metro Orthopedics & Spine',
            isActive: true,
        },
    });
    const staffUser = await prisma.user.upsert({
        where: { email: 'staff@priorauth.health' },
        update: {},
        create: {
            id: 'user-staff-01',
            email: 'staff@priorauth.health',
            passwordHash,
            fullName: 'Sarah Jenkins, RN',
            role: 'STAFF',
            organization: 'Prior Auth Care Coordination',
            isActive: true,
        },
    });
    console.log('✓ Users created');
    // 3. Payers
    const payersData = [
        {
            id: 'payer-bcbs',
            name: 'Blue Cross Blue Shield (Fictional Plan)',
            code: 'BCBS',
            payerType: 'COMMERCIAL',
            contactPhone: '1-800-555-2227',
            electronicId: '00020',
            portalUrl: 'https://demo-payer-portal.example.com/bcbs',
            isActive: true,
        },
        {
            id: 'payer-aetna',
            name: 'Aetna Health (Fictional Plan)',
            code: 'AETNA',
            payerType: 'COMMERCIAL',
            contactPhone: '1-800-555-4488',
            electronicId: '60054',
            portalUrl: 'https://demo-payer-portal.example.com/aetna',
            isActive: true,
        },
        {
            id: 'payer-uhc',
            name: 'UnitedHealthcare (Fictional Plan)',
            code: 'UHC',
            payerType: 'COMMERCIAL',
            contactPhone: '1-800-555-8772',
            electronicId: '87726',
            portalUrl: 'https://demo-payer-portal.example.com/uhc',
            isActive: true,
        },
        {
            id: 'payer-cigna',
            name: 'Cigna Healthcare (Fictional Plan)',
            code: 'CIGNA',
            payerType: 'COMMERCIAL',
            contactPhone: '1-800-555-6230',
            electronicId: '62308',
            portalUrl: 'https://demo-payer-portal.example.com/cigna',
            isActive: true,
        },
        {
            id: 'payer-humana',
            name: 'Humana Medicare Advantage (Fictional Plan)',
            code: 'HUMANA',
            payerType: 'MEDICARE',
            contactPhone: '1-800-555-6110',
            electronicId: '61101',
            portalUrl: 'https://demo-payer-portal.example.com/humana',
            isActive: true,
        },
    ];
    for (const p of payersData) {
        await prisma.payer.upsert({
            where: { code: p.code },
            update: {},
            create: p,
        });
    }
    console.log('✓ Payers created');
    // 4. Payer Requirement Profiles & Requirements
    const mriProfile = await prisma.payerRequirementProfile.upsert({
        where: { id: 'prof-bcbs-mri' },
        update: {},
        create: {
            id: 'prof-bcbs-mri',
            payerId: 'payer-bcbs',
            serviceCategory: 'RADIOLOGY',
            version: '2026.1',
            isActive: true,
            description: 'Requirements for Lumbar Spine MRI (CPT 72148 / 72149)',
        },
    });
    const mriRequirements = [
        {
            id: 'req-mri-01',
            profileId: mriProfile.id,
            code: 'REQ-MRI-CONSERVATIVE-TX',
            name: '6+ Weeks Conservative Therapy',
            description: 'Documented minimum 6 weeks of conservative treatment including physical therapy, NSAIDs, or chiropractic care without resolution.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES,TREATMENT_PLANS',
            validationInstruction: 'Verify date range of physical therapy and medications tried with failure notes.',
            sortOrder: 1,
        },
        {
            id: 'req-mri-02',
            profileId: mriProfile.id,
            code: 'REQ-MRI-RADICULOPATHY',
            name: 'Documented Radiculopathy or Neurologic Deficit',
            description: 'Physical exam notes confirming dermatomal pain, weakness, hyporeflexia, or positive straight leg raise test.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES,DIAGNOSIS_RECORDS',
            validationInstruction: 'Check for physical exam with motor/sensory deficits or positive straight-leg raise.',
            sortOrder: 2,
        },
        {
            id: 'req-mri-03',
            profileId: mriProfile.id,
            code: 'REQ-MRI-CLINICIAN-NOTE',
            name: 'Ordering Clinician Note (<60 days)',
            description: 'Comprehensive face-to-face physician evaluation within the past 60 days.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES',
            validationInstruction: 'Confirm clinician signature, NPI, and consultation date within 60 days.',
            sortOrder: 3,
        },
        {
            id: 'req-mri-04',
            profileId: mriProfile.id,
            code: 'REQ-MRI-PRIOR-XRAY',
            name: 'Lumbar Spine X-Ray Imaging',
            description: 'Weight-bearing plain radiography performed prior to advanced imaging to rule out gross structural fracture or spondylolisthesis.',
            isRequired: false,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'IMAGING_REPORTS',
            validationInstruction: 'Locate report showing radiograph interpretation within past 12 months.',
            sortOrder: 4,
        },
        {
            id: 'req-mri-05',
            profileId: mriProfile.id,
            code: 'REQ-MRI-RED-FLAGS',
            name: 'Red Flag Screening Assessment',
            description: 'Clinical documentation ruling out cauda equina, fever/infection, history of malignancy, or acute major trauma.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES',
            validationInstruction: 'Ensure clinician noted presence or absence of cauda equina and red flags.',
            sortOrder: 5,
        },
    ];
    for (const req of mriRequirements) {
        await prisma.payerRequirement.upsert({
            where: { id: req.id },
            update: {},
            create: req,
        });
    }
    // Profile for Knee Arthroscopy
    const kneeProfile = await prisma.payerRequirementProfile.upsert({
        where: { id: 'prof-aetna-knee' },
        update: {},
        create: {
            id: 'prof-aetna-knee',
            payerId: 'payer-aetna',
            serviceCategory: 'SURGERY',
            version: '2026.2',
            isActive: true,
            description: 'Requirements for Knee Arthroscopy & Meniscectomy (CPT 29881)',
        },
    });
    const kneeRequirements = [
        {
            id: 'req-knee-01',
            profileId: kneeProfile.id,
            code: 'REQ-KNEE-MRI',
            name: 'Diagnostic Knee MRI Report',
            description: 'MRI demonstrating definitive meniscal tear with joint line localization.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'IMAGING_REPORTS',
            validationInstruction: 'Verify radiologist report confirming tear grade and compartment.',
            sortOrder: 1,
        },
        {
            id: 'req-knee-02',
            profileId: kneeProfile.id,
            code: 'REQ-KNEE-PHYSICAL-EXAM',
            name: 'Orthopedic Exam with Joint Signs',
            description: 'Positive McMurray test, joint line tenderness, or mechanical locking/catching documented.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES',
            validationInstruction: 'Ensure physical exam details mechanical symptoms.',
            sortOrder: 2,
        },
        {
            id: 'req-knee-03',
            profileId: kneeProfile.id,
            code: 'REQ-KNEE-CONSERVATIVE',
            name: 'Trial of Conservative Care (4+ Weeks)',
            description: 'Failure of NSAIDs, activity modification, or physical therapy/corticosteroid injection.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES,TREATMENT_PLANS',
            validationInstruction: 'Review conservative treatment history in notes.',
            sortOrder: 3,
        },
    ];
    for (const req of kneeRequirements) {
        await prisma.payerRequirement.upsert({
            where: { id: req.id },
            update: {},
            create: req,
        });
    }
    // Profile for Biologic Medication
    const biologicProfile = await prisma.payerRequirementProfile.upsert({
        where: { id: 'prof-uhc-biologic' },
        update: {},
        create: {
            id: 'prof-uhc-biologic',
            payerId: 'payer-uhc',
            serviceCategory: 'SPECIALTY_DRUG',
            version: '2026.1',
            isActive: true,
            description: 'Requirements for Biologic Immunotherapy (Adalimumab / Humira)',
        },
    });
    const biologicRequirements = [
        {
            id: 'req-bio-01',
            profileId: biologicProfile.id,
            code: 'REQ-BIO-DIAGNOSIS',
            name: 'Confirmed Moderate-to-Severe Autoimmune Diagnosis',
            description: 'Documented diagnosis of Rheumatoid Arthritis, Psoriatic Arthritis, or Crohns Disease with severity score.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES,DIAGNOSIS_RECORDS',
            validationInstruction: 'Validate diagnosis codes and disease activity indices.',
            sortOrder: 1,
        },
        {
            id: 'req-bio-02',
            profileId: biologicProfile.id,
            code: 'REQ-BIO-TB-SCREEN',
            name: 'Tuberculosis (TB) Screening Test (<12 Months)',
            description: 'Negative QuantiFERON-TB Gold or PPD skin test documented within the last 12 months.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'LABORATORY_REPORTS',
            validationInstruction: 'Confirm negative TB test date within 365 days of submission.',
            sortOrder: 2,
        },
        {
            id: 'req-bio-03',
            profileId: biologicProfile.id,
            code: 'REQ-BIO-DMARD-FAILURE',
            name: 'Trial & Failure of Conventional DMARD',
            description: 'Documented inadequate response or intolerance to Methotrexate or Sulfasalazine for 3+ months.',
            isRequired: true,
            applicabilityRule: 'ALL',
            acceptedDocTypes: 'CLINICAL_NOTES,MEDICATION_RECORDS',
            validationInstruction: 'Check prior DMARD dosing, duration, and reason for discontinuation.',
            sortOrder: 3,
        },
    ];
    for (const req of biologicRequirements) {
        await prisma.payerRequirement.upsert({
            where: { id: req.id },
            update: {},
            create: req,
        });
    }
    console.log('✓ Requirement Profiles and Rules created');
    // 5. Patients
    const patientsData = [
        {
            id: 'pat-01',
            mrn: 'MRN-884920',
            firstName: 'Robert',
            lastName: 'Davis',
            dateOfBirth: '1974-05-18',
            gender: 'Male',
            phone: '(555) 349-2201',
            email: 'robert.davis@example.com',
            address: '124 Elm Wood Lane, Chicago, IL 60614',
            insurancePayerId: 'payer-bcbs',
            insuranceMemberId: 'BCBS-99238419',
            insuranceGroupNumber: 'GRP-4029',
        },
        {
            id: 'pat-02',
            mrn: 'MRN-773105',
            firstName: 'Elena',
            lastName: 'Rodriguez',
            dateOfBirth: '1982-11-03',
            gender: 'Female',
            phone: '(555) 892-4115',
            email: 'elena.rodriguez@example.com',
            address: '880 Michigan Ave, Apt 14B, Chicago, IL 60611',
            insurancePayerId: 'payer-aetna',
            insuranceMemberId: 'AET-55410928',
            insuranceGroupNumber: 'GRP-8114',
        },
        {
            id: 'pat-03',
            mrn: 'MRN-640192',
            firstName: 'James',
            lastName: 'Wilson',
            dateOfBirth: '1968-02-27',
            gender: 'Male',
            phone: '(555) 471-9033',
            email: 'james.wilson@example.com',
            address: '315 North LaSalle St, Chicago, IL 60654',
            insurancePayerId: 'payer-uhc',
            insuranceMemberId: 'UHC-33920194',
            insuranceGroupNumber: 'GRP-2291',
        },
        {
            id: 'pat-04',
            mrn: 'MRN-502189',
            firstName: 'Patricia',
            lastName: 'Walker',
            dateOfBirth: '1959-08-14',
            gender: 'Female',
            phone: '(555) 602-7719',
            email: 'patricia.walker@example.com',
            address: '2240 Oak Ridge Road, Evanston, IL 60201',
            insurancePayerId: 'payer-cigna',
            insuranceMemberId: 'CIG-11849203',
            insuranceGroupNumber: 'GRP-9011',
        },
    ];
    for (const pat of patientsData) {
        await prisma.patient.upsert({
            where: { mrn: pat.mrn },
            update: {},
            create: pat,
        });
    }
    console.log('✓ Patients created');
    // 6. Pre-seeded Authorization Requests
    // Request 1: Ready for Review (Robert Davis - Lumbar Spine MRI)
    const req1 = await prisma.authorizationRequest.upsert({
        where: { requestNumber: 'PA-2026-00101' },
        update: {},
        create: {
            id: 'req-00101',
            requestNumber: 'PA-2026-00101',
            patientId: 'pat-01',
            payerId: 'payer-bcbs',
            organizationId: org.id,
            createdById: staffUser.id,
            assignedDoctorId: doctorUser.id,
            serviceType: 'RADIOLOGY',
            requestedService: 'MRI Lumbar Spine without Contrast (CPT 72148)',
            cptCodes: JSON.stringify(['72148']),
            icd10Codes: JSON.stringify(['M54.51', 'M54.16']),
            priority: 'STANDARD',
            status: 'READY_FOR_REVIEW',
            completenessScore: 80.0,
            submissionRef: null,
            notes: 'Patient suffering progressive lumbar radiculopathy into left L5 dermatome. Completed 8 weeks of PT without relief.',
            requestedStartDate: '2026-10-20',
            requestedEndDate: '2026-11-20',
        },
    });
    // Clinical info for req1
    await prisma.clinicalInformation.upsert({
        where: { requestId: req1.id },
        update: {},
        create: {
            requestId: req1.id,
            diagnosis: 'Vertebrogenic low back pain with radiculopathy, lumbar region',
            diagnosisCodes: JSON.stringify(['M54.51', 'M54.16']),
            symptoms: JSON.stringify(['Left L5 dermatomal radiating pain', 'Numbness of dorsum of left foot', 'Positive straight leg raise at 45 degrees']),
            clinicalFindings: 'Patient presents with severe shooting pain from lumbar spine radiating down left lower extremity to the great toe. Tenderness at L4-L5 interspace. Motor strength left extensor hallucis longus 4/5. Diminished sensation left L5 distribution. No bowel/bladder incontinence.',
            previousTreatments: JSON.stringify(['Physical Therapy (8 weeks, 16 sessions completed at Metro Rehab)', 'Meloxicam 15mg daily x 6 weeks', 'Cyclobenzaprine 10mg PRN', 'Home lumbar extension exercises']),
            contraindications: JSON.stringify(['No cardiac pacemaker', 'No metallic implants']),
            proposedTreatmentPlan: 'Diagnostic MRI Lumbar Spine without IV contrast (72148) to assess disc herniation vs foraminal stenosis prior to targeted transforaminal epidural injection.',
            orderingPhysicianName: 'Dr. Marcus Chen, MD',
            orderingPhysicianNpi: '1942083319',
            documentDates: JSON.stringify(['2026-09-12', '2026-10-04']),
            isVerified: true,
            verifiedByUserId: doctorUser.id,
            verifiedAt: new Date(),
            notes: 'Verified by Dr. Chen on 10/05/2026.',
        },
    });
    // Document for req1
    const doc1 = await prisma.document.upsert({
        where: { id: 'doc-001' },
        update: {},
        create: {
            id: 'doc-001',
            requestId: req1.id,
            fileName: 'robert_davis_ortho_clinic_notes.pdf',
            originalName: 'Robert_Davis_Ortho_Clinic_Notes_2026-10.pdf',
            mimeType: 'application/pdf',
            fileSize: 248102,
            filePath: 'uploads/sample_robert_davis_clinic_note.pdf',
            category: 'CLINICAL_NOTES',
            extractionStatus: 'COMPLETED',
            extractedText: `PATIENT CLINICAL SUMMARY
Patient Name: Robert Davis
DOB: 05/18/1974 | MRN: 884920
Payer: Blue Cross Blue Shield | Member ID: BCBS-99238419
Visit Date: 10/04/2026
Ordering Provider: Dr. Marcus Chen, MD (NPI: 1942083319)

CHIEF COMPLAINT:
Severe radiating low back pain into left lower extremity for 3 months.

HISTORY OF PRESENT ILLNESS:
52-year-old male with persistent lumbar pain. Conservative management:
1. Physical therapy: Attended 16 sessions between August 10 and September 30, 2026 at Metro Rehabilitation. Notes confirm persistent antalgic gait and no symptom resolution.
2. Pharmacotherapy: Meloxicam 15 mg PO daily for 8 weeks and cyclobenzaprine 10 mg at bedtime.
Failure of conservative therapy documented.

PHYSICAL EXAMINATION:
- Lumbar Spine: Tenderness to palpation over L4-L5 and L5-S1 paraspinal muscles.
- Neurological: Positive Straight Leg Raise test on left at 40 degrees producing radicular pain into left foot. Left EHL strength 4/5. Patellar reflexes 2+ bilateral; left Achilles reflex 1+.
- Red flags: Cauda equina symptoms negative. Bowel and bladder function normal. No fever or unexplained weight loss.

ASSESSMENT & PLAN:
1. Lumbar radiculopathy, left L5 dermatome (M54.16)
2. Low back pain (M54.51)
Order: MRI Lumbar Spine without Contrast (CPT 72148) to localize nerve root compression.`,
            uploadedById: staffUser.id,
        },
    });
    // Extracted fields for req1
    const extractedFieldsReq1 = [
        {
            id: 'ef-01',
            documentId: doc1.id,
            requestId: req1.id,
            fieldName: 'Patient Name',
            fieldValue: 'Robert Davis',
            confidence: 0.98,
            sourceSnippet: 'Patient Name: Robert Davis',
            isVerified: true,
            verifiedValue: 'Robert Davis',
            verifiedByUserId: doctorUser.id,
        },
        {
            id: 'ef-02',
            documentId: doc1.id,
            requestId: req1.id,
            fieldName: 'Diagnosis Code',
            fieldValue: 'M54.16 (Lumbar radiculopathy)',
            confidence: 0.95,
            sourceSnippet: 'Lumbar radiculopathy, left L5 dermatome (M54.16)',
            isVerified: true,
            verifiedValue: 'M54.16',
            verifiedByUserId: doctorUser.id,
        },
        {
            id: 'ef-03',
            documentId: doc1.id,
            requestId: req1.id,
            fieldName: 'Requested Service',
            fieldValue: 'MRI Lumbar Spine without Contrast (CPT 72148)',
            confidence: 0.96,
            sourceSnippet: 'Order: MRI Lumbar Spine without Contrast (CPT 72148)',
            isVerified: true,
            verifiedValue: 'MRI Lumbar Spine without Contrast (CPT 72148)',
            verifiedByUserId: doctorUser.id,
        },
        {
            id: 'ef-04',
            documentId: doc1.id,
            requestId: req1.id,
            fieldName: 'Conservative Treatment',
            fieldValue: 'Physical therapy 16 sessions (Aug-Sep 2026), Meloxicam 15mg x 8 weeks',
            confidence: 0.92,
            sourceSnippet: 'Physical therapy: Attended 16 sessions between August 10 and September 30, 2026',
            isVerified: true,
            verifiedValue: 'Physical therapy 16 sessions (Aug-Sep 2026), Meloxicam 15mg x 8 weeks',
            verifiedByUserId: doctorUser.id,
        },
        {
            id: 'ef-05',
            documentId: doc1.id,
            requestId: req1.id,
            fieldName: 'Neurologic Deficit Exam',
            fieldValue: 'Positive SLR left at 40 deg, left EHL strength 4/5',
            confidence: 0.94,
            sourceSnippet: 'Positive Straight Leg Raise test on left at 40 degrees producing radicular pain into left foot.',
            isVerified: true,
            verifiedValue: 'Positive SLR left at 40 deg, left EHL strength 4/5',
            verifiedByUserId: doctorUser.id,
        },
    ];
    for (const ef of extractedFieldsReq1) {
        await prisma.extractedField.upsert({
            where: { id: ef.id },
            update: {},
            create: ef,
        });
    }
    // Requirement results for req1
    const req1Results = [
        {
            id: 'res-01',
            requestId: req1.id,
            requirementId: 'req-mri-01',
            status: 'COMPLETE',
            explanation: 'Documentation confirms 16 sessions of physical therapy between August and September 2026 and 8 weeks of NSAIDs.',
            sourceDocumentId: doc1.id,
            recommendedAction: 'Requirement satisfied by clinic progress note.',
        },
        {
            id: 'res-02',
            requestId: req1.id,
            requirementId: 'req-mri-02',
            status: 'COMPLETE',
            explanation: 'Left EHL weakness (4/5) and positive straight leg raise at 40 degrees documented in physical exam.',
            sourceDocumentId: doc1.id,
            recommendedAction: 'Requirement satisfied.',
        },
        {
            id: 'res-03',
            requestId: req1.id,
            requirementId: 'req-mri-03',
            status: 'COMPLETE',
            explanation: 'Dr. Marcus Chen note dated 10/04/2026 is within 60 days.',
            sourceDocumentId: doc1.id,
            recommendedAction: 'Requirement satisfied.',
        },
        {
            id: 'res-04',
            requestId: req1.id,
            requirementId: 'req-mri-04',
            status: 'NEEDS_REVIEW',
            explanation: 'Lumbar X-ray mentioned in history but formal imaging report PDF is pending attachment.',
            sourceDocumentId: null,
            recommendedAction: 'Upload the lumbar spine X-ray report or mark as optional exception.',
        },
        {
            id: 'res-05',
            requestId: req1.id,
            requirementId: 'req-mri-05',
            status: 'COMPLETE',
            explanation: 'Screening confirms cauda equina negative, no fever, no unexplained weight loss.',
            sourceDocumentId: doc1.id,
            recommendedAction: 'Requirement satisfied.',
        },
    ];
    for (const res of req1Results) {
        await prisma.requestRequirementResult.upsert({
            where: { id: res.id },
            update: {},
            create: res,
        });
    }
    // Status history for req1
    await prisma.requestStatusHistory.createMany({
        data: [
            {
                requestId: req1.id,
                fromStatus: null,
                toStatus: 'DRAFT',
                changedById: staffUser.id,
                changeReason: 'Initial creation from patient chart',
                notes: 'Request initiated by Sarah Jenkins, RN',
                timestamp: new Date(Date.now() - 86400000 * 3),
            },
            {
                requestId: req1.id,
                fromStatus: 'DRAFT',
                toStatus: 'PROCESSING_DOCUMENTS',
                changedById: staffUser.id,
                changeReason: 'Uploaded orthopedic clinic notes',
                notes: 'Clinical document processed through NLP engine',
                timestamp: new Date(Date.now() - 86400000 * 2),
            },
            {
                requestId: req1.id,
                fromStatus: 'PROCESSING_DOCUMENTS',
                toStatus: 'READY_FOR_REVIEW',
                changedById: staffUser.id,
                changeReason: 'Extracted clinical facts and verified criteria',
                notes: 'Ready for physician review and confirmation',
                timestamp: new Date(Date.now() - 86400000 * 1),
            },
        ],
    });
    // Request 2: Missing Information (James Wilson - Biologic Drug)
    const req2 = await prisma.authorizationRequest.upsert({
        where: { requestNumber: 'PA-2026-00102' },
        update: {},
        create: {
            id: 'req-00102',
            requestNumber: 'PA-2026-00102',
            patientId: 'pat-03',
            payerId: 'payer-uhc',
            organizationId: org.id,
            createdById: staffUser.id,
            assignedDoctorId: doctorUser.id,
            serviceType: 'SPECIALTY_DRUG',
            requestedService: 'Adalimumab (Humira) 40mg/0.4mL subcutaneous bi-weekly (HCPCS J0135)',
            cptCodes: JSON.stringify(['J0135']),
            icd10Codes: JSON.stringify(['M06.9']),
            priority: 'EXPEDITED',
            status: 'MISSING_INFORMATION',
            completenessScore: 66.6,
            submissionRef: null,
            notes: 'Active Rheumatoid Arthritis failing Methotrexate 20mg weekly.',
            requestedStartDate: '2026-10-25',
            requestedEndDate: '2027-04-25',
        },
    });
    // Clinical info for req2
    await prisma.clinicalInformation.upsert({
        where: { requestId: req2.id },
        update: {},
        create: {
            requestId: req2.id,
            diagnosis: 'Rheumatoid arthritis, unspecified',
            diagnosisCodes: JSON.stringify(['M06.9']),
            symptoms: JSON.stringify(['Severe morning stiffness > 90 min', 'Symmetric polyarthritis of PIP joints and MCP joints', 'Fatigue']),
            clinicalFindings: 'Patient with CDAI score of 28 indicating high disease activity. Swollen joint count 10, tender joint count 14.',
            previousTreatments: JSON.stringify(['Methotrexate 20mg weekly x 5 months (failed due to elevated transaminases & lack of efficacy)', 'Prednisone 10mg daily taper']),
            contraindications: JSON.stringify(['No active systemic infections']),
            proposedTreatmentPlan: 'Initiate Adalimumab 40 mg SQ every 14 days.',
            orderingPhysicianName: 'Dr. Marcus Chen, MD',
            orderingPhysicianNpi: '1942083319',
            documentDates: JSON.stringify(['2026-09-28']),
            isVerified: false,
        },
    });
    // Requirement results for req2
    await prisma.requestRequirementResult.createMany({
        data: [
            {
                requestId: req2.id,
                requirementId: 'req-bio-01',
                status: 'COMPLETE',
                explanation: 'Rheumatoid arthritis diagnosis documented with CDAI score of 28.',
                sourceDocumentId: null,
                recommendedAction: 'Requirement satisfied.',
            },
            {
                requestId: req2.id,
                requirementId: 'req-bio-02',
                status: 'MISSING',
                explanation: 'Missing recent Tuberculosis (TB) screening test report within past 12 months.',
                sourceDocumentId: null,
                recommendedAction: 'Upload QuantiFERON-TB Gold lab report or enter recent screening test date.',
            },
            {
                requestId: req2.id,
                requirementId: 'req-bio-03',
                status: 'COMPLETE',
                explanation: 'Methotrexate trial for 5 months with intolerance documented in chart.',
                sourceDocumentId: null,
                recommendedAction: 'Requirement satisfied.',
            },
        ],
    });
    // Request 3: Approved Simulated Demo (Patricia Walker)
    const req3 = await prisma.authorizationRequest.upsert({
        where: { requestNumber: 'PA-2026-00103' },
        update: {},
        create: {
            id: 'req-00103',
            requestNumber: 'PA-2026-00103',
            patientId: 'pat-04',
            payerId: 'payer-cigna',
            organizationId: org.id,
            createdById: staffUser.id,
            assignedDoctorId: doctorUser.id,
            serviceType: 'RADIOLOGY',
            requestedService: 'MRI Brain with and without IV Contrast (CPT 70553)',
            cptCodes: JSON.stringify(['70553']),
            icd10Codes: JSON.stringify(['G43.909']),
            priority: 'STANDARD',
            status: 'APPROVED',
            completenessScore: 100.0,
            submissionRef: 'DEMO-SUB-88391',
            isSimulatedSubmission: true,
            notes: 'Intractable atypical migraine with aura and new sensory symptoms.',
            requestedStartDate: '2026-10-01',
            requestedEndDate: '2026-11-01',
        },
    });
    // Request 4: Draft (Elena Rodriguez)
    await prisma.authorizationRequest.upsert({
        where: { requestNumber: 'PA-2026-00104' },
        update: {},
        create: {
            id: 'req-00104',
            requestNumber: 'PA-2026-00104',
            patientId: 'pat-02',
            payerId: 'payer-aetna',
            organizationId: org.id,
            createdById: staffUser.id,
            assignedDoctorId: doctorUser.id,
            serviceType: 'SURGERY',
            requestedService: 'Right Knee Arthroscopy with Partial Medial Meniscectomy (CPT 29881)',
            cptCodes: JSON.stringify(['29881']),
            icd10Codes: JSON.stringify(['M23.22']),
            priority: 'STANDARD',
            status: 'DRAFT',
            completenessScore: 33.3,
            submissionRef: null,
            notes: 'Twisting injury while jogging. Mechanical clicking and medial joint pain.',
            requestedStartDate: '2026-11-05',
            requestedEndDate: '2026-12-05',
        },
    });
    // 7. Seed Notifications
    await prisma.notification.createMany({
        data: [
            {
                userId: staffUser.id,
                title: 'Document Extraction Completed',
                message: 'Clinical notes for Robert Davis (PA-2026-00101) parsed successfully. 5 clinical facts identified.',
                type: 'SUCCESS',
                relatedRequestId: req1.id,
                isRead: false,
            },
            {
                userId: doctorUser.id,
                title: 'Prior Auth Ready for Review',
                message: 'Request PA-2026-00101 (Robert Davis - Lumbar Spine MRI) reached 80% completeness and awaits your confirmation.',
                type: 'INFO',
                relatedRequestId: req1.id,
                isRead: false,
            },
            {
                userId: staffUser.id,
                title: 'Missing Information Alert',
                message: 'Request PA-2026-00102 (James Wilson) requires a Tuberculosis screening test before payer submission.',
                type: 'WARNING',
                relatedRequestId: req2.id,
                isRead: false,
            },
            {
                userId: staffUser.id,
                title: 'Simulated Payer Approval Received',
                message: 'DEMO MODE: Request PA-2026-00103 was approved by simulated Cigna review engine (Ref: DEMO-SUB-88391).',
                type: 'SUCCESS',
                relatedRequestId: req3.id,
                isRead: true,
            },
        ],
    });
    // 8. Seed Audit Logs
    await prisma.auditLog.createMany({
        data: [
            {
                userId: adminUser.id,
                eventType: 'USER_LOGIN',
                actionDetails: 'Admin Dr. Eleanor Vance logged into Prior Authorization Portal from internal subnet.',
                ipAddress: '192.168.1.104',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            {
                userId: staffUser.id,
                eventType: 'DOCUMENT_UPLOAD',
                actionDetails: 'Uploaded orthopedic clinic progress note for patient Robert Davis (MRN: 884920).',
                ipAddress: '192.168.1.112',
                relatedRequestId: req1.id,
            },
            {
                userId: doctorUser.id,
                eventType: 'CLINICAL_VERIFICATION',
                actionDetails: 'Verified extracted diagnosis M54.16 and 8 weeks conservative treatment for PA-2026-00101.',
                ipAddress: '192.168.1.109',
                relatedRequestId: req1.id,
            },
            {
                userId: staffUser.id,
                eventType: 'DEMO_SUBMISSION',
                actionDetails: 'Simulated submission sent for PA-2026-00103 to mock Cigna gateway with ref DEMO-SUB-88391.',
                ipAddress: '192.168.1.112',
                relatedRequestId: req3.id,
            },
        ],
    });
    console.log('✓ Notifications and Audit Logs seeded');
    console.log('🎉 Seed completed successfully!');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
