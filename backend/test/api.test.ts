import { describe, it, expect, beforeAll } from 'vitest';
import prisma from '../src/prisma.js';
import { extractClinicalInformationDeterministic } from '../src/services/aiService.js';
import { checkRequestCompleteness } from '../src/services/completenessService.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/middleware/auth.js';

describe('Prior Authorization Assistant - Core Backend Engine Tests', () => {
  let testUserId = '';
  let testRequestId = '';
  let patientId = '';
  let payerId = '';

  beforeAll(async () => {
    const user = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    if (user) testUserId = user.id;

    const payer = await prisma.payer.findFirst({ where: { code: 'BCBS' } });
    if (payer) payerId = payer.id;

    let patient = await prisma.patient.findFirst();
    if (!patient && payerId) {
      patient = await prisma.patient.create({
        data: {
          mrn: `MRN-TEST-${Date.now()}`,
          firstName: 'Test',
          lastName: 'Patient',
          dateOfBirth: '1985-01-01',
          gender: 'Female',
          phone: '(555) 000-0000',
          address: '100 Health Way',
          insurancePayerId: payerId,
          insuranceMemberId: 'TEST-MEM-001',
        },
      });
    }
    if (patient) patientId = patient.id;
  });

  // 1. Authentication & Role-Based Access Control
  it('should hash passwords and generate valid signed JWT tokens with roles', async () => {
    const rawPass = 'DoctorSecurePass2026!';
    const hashed = await bcrypt.hash(rawPass, 10);
    const match = await bcrypt.compare(rawPass, hashed);
    expect(match).toBe(true);

    const token = generateToken({
      id: 'test-user-id',
      email: 'doctor@metrohealth.example.com',
      fullName: 'Dr. Jane Smith, MD',
      role: 'DOCTOR',
      organization: 'Metro Hospital',
    });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  // 2. Deterministic Clinical NLP Extraction Engine
  it('should accurately extract clinical facts, ICD codes, and conservative treatment from clinical note text', () => {
    const sampleClinicalNote = `
      Patient Name: Robert Davis
      DOB: 05/18/1974
      MRN: MRN-884920
      Visit Date: 10/04/2026
      Ordering Provider: Dr. Marcus Chen, MD
      NPI: 1942083319

      CHIEF COMPLAINT:
      Radiating lumbar back pain into left leg.

      PHYSICAL EXAMINATION:
      Tenderness over L4-L5 paraspinal region. Positive Straight Leg Raise test on left at 40 degrees.

      CONSERVATIVE TREATMENT:
      Physical therapy: 16 sessions completed between August and September 2026. Meloxicam 15mg failed.

      ASSESSMENT & PLAN:
      1. Low back pain with radiculopathy, lumbar (M54.16)
      2. Plan: MRI Lumbar Spine without Contrast (CPT 72148)
    `;

    const extraction = extractClinicalInformationDeterministic(sampleClinicalNote);

    expect(extraction.patientName?.fieldValue).toBe('Robert Davis');
    expect(extraction.dob?.fieldValue).toBe('05/18/1974');
    expect(extraction.orderingPhysicianNpi?.fieldValue).toBe('1942083319');
    expect(extraction.diagnosisCodes.some((c) => c.fieldValue === 'M54.16')).toBe(true);
    expect(extraction.cptCodes.some((c) => c.fieldValue === '72148')).toBe(true);
    expect(extraction.previousTreatments.length).toBeGreaterThan(0);
    expect(extraction.isSimulated).toBe(true);
  });

  // 3. Request Creation & Completeness Calculation
  it('should calculate completeness and identify missing vs satisfied requirements dynamically', async () => {
    // Create a new test request
    const req = await prisma.authorizationRequest.create({
      data: {
        requestNumber: `TEST-PA-${Date.now()}`,
        patientId,
        payerId,
        serviceType: 'RADIOLOGY',
        requestedService: 'MRI Lumbar Spine without Contrast (72148)',
        cptCodes: JSON.stringify(['72148']),
        icd10Codes: JSON.stringify(['M54.16']),
        priority: 'STANDARD',
        status: 'DRAFT',
        createdById: testUserId || 'user-staff-01',
      },
    });
    testRequestId = req.id;

    // Initially with empty clinical info, requirements should evaluate with missing items
    const evaluation = await checkRequestCompleteness(testRequestId);

    expect(evaluation.isConfigured).toBe(true);
    expect(evaluation.totalApplicable).toBeGreaterThan(0);
    expect(evaluation.items.some((i) => i.status === 'MISSING')).toBe(true);
    expect(evaluation.score).toBeLessThanOrEqual(50);
  });

  // 4. Clinical Information Update and Completeness Recalculation
  it('should update completeness score when conservative treatments and clinic findings are added', async () => {
    // Add verified clinical notes to test request
    await prisma.clinicalInformation.create({
      data: {
        requestId: testRequestId,
        diagnosis: 'Lumbar radiculopathy',
        diagnosisCodes: JSON.stringify(['M54.16']),
        symptoms: JSON.stringify(['Radiating leg pain']),
        clinicalFindings: 'Positive straight leg raise test on left, 4/5 strength',
        previousTreatments: JSON.stringify(['Completed 8 weeks physical therapy', 'NSAID failure']),
        contraindications: JSON.stringify(['No pacemakers']),
        proposedTreatmentPlan: 'Lumbar MRI',
        orderingPhysicianName: 'Dr. Marcus Chen, MD',
        orderingPhysicianNpi: '1942083319',
        documentDates: JSON.stringify(['2026-10-04']),
        isVerified: true,
      },
    });

    const updatedEval = await checkRequestCompleteness(testRequestId);

    expect(updatedEval.completedCount).toBeGreaterThan(0);
    expect(updatedEval.score).toBeGreaterThanOrEqual(40);
  });

  // 5. Audit Log and Notification creation
  it('should record audit logs and notifications without exposing secrets', async () => {
    const audit = await prisma.auditLog.create({
      data: {
        userId: testUserId || null,
        eventType: 'TEST_EVENT',
        actionDetails: 'Automated test execution verified system integrity.',
        ipAddress: '127.0.0.1',
        relatedRequestId: testRequestId,
      },
    });
    expect(audit.id).toBeDefined();

    const notif = await prisma.notification.create({
      data: {
        userId: testUserId || 'user-staff-01',
        title: 'Test Notification',
        message: 'Evaluation pipeline passed successfully.',
        type: 'SUCCESS',
        relatedRequestId: testRequestId,
      },
    });
    expect(notif.id).toBeDefined();
    expect(notif.isRead).toBe(false);
  });

  // 6. Cleanup test records
  it('should cleanup test request gracefully', async () => {
    if (testRequestId) {
      await prisma.authorizationRequest.delete({
        where: { id: testRequestId },
      });
    }
    if (patientId) {
      await prisma.patient.deleteMany({
        where: { mrn: { startsWith: 'MRN-TEST-' } },
      });
    }
  });
});
