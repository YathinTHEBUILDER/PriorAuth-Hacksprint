import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import prisma from '../prisma.js';

export async function generatePriorAuthPDF(requestId: string): Promise<Buffer> {
  const request = await prisma.authorizationRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: true,
      payer: true,
      clinicalInformation: true,
      documents: true,
      creator: true,
      assignedDoctor: true,
      requirementResults: {
        include: { requirement: true },
      },
    },
  });

  if (!request) {
    throw new Error('Authorization request not found');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Color Palette
    const primaryColor = '#1e3a8a'; // Deep Navy
    const accentColor = '#0284c7';  // Cyan
    const darkGray = '#334155';
    const lightGray = '#64748b';
    const borderColor = '#cbd5e1';

    // Header Bar
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
      .text('PRIOR AUTHORIZATION PACKET', 55, 52);
    doc.fontSize(9).font('Helvetica')
      .fillColor('#94a3b8')
      .text('METRO HEALTH SYSTEM & SPECIALTY CARE • CLINICAL PREPARATION DRAFT', 55, 72);

    const isDraft = request.status !== 'APPROVED' && request.status !== 'SUBMITTED';
    const watermarkText = isDraft
      ? 'DRAFT PREPARATION — PENDING FINAL CLINICAL VERIFICATION'
      : 'OFFICIAL RECORD — SIMULATED DEMO SUBMISSION';

    doc.rect(40, 105, 515, 20).fill(isDraft ? '#fef3c7' : '#ecfdf5');
    doc.fillColor(isDraft ? '#92400e' : '#065f46').fontSize(8).font('Helvetica-Bold')
      .text(watermarkText, 50, 110, { align: 'center', width: 495 });

    let y = 135;

    // SECTION 1: Request & Payer Demographics
    doc.rect(40, y, 515, 75).stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('1. REQUEST & PAYER INFORMATION', 50, y + 8);

    doc.fillColor(darkGray).fontSize(9).font('Helvetica');
    doc.text(`Request ID: ${request.requestNumber}`, 50, y + 26);
    doc.text(`Created Date: ${request.createdAt.toISOString().split('T')[0]}`, 220, y + 26);
    doc.text(`Priority: ${request.priority}`, 390, y + 26);

    doc.text(`Target Payer: ${request.payer.name}`, 50, y + 42);
    doc.text(`Electronic Payer ID: ${request.payer.electronicId || 'N/A'}`, 220, y + 42);
    doc.text(`Status: ${request.status.replace(/_/g, ' ')}`, 390, y + 42);

    doc.text(`Completeness Score: ${Math.round(request.completenessScore)}%`, 50, y + 58);
    doc.text(`Submission Ref: ${request.submissionRef || 'Not yet submitted (Demo Mode)'}`, 220, y + 58);

    y += 85;

    // SECTION 2: Patient Information
    doc.rect(40, y, 515, 65).stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('2. PATIENT DEMOGRAPHICS & COVERAGE', 50, y + 8);

    const pat = request.patient;
    doc.fillColor(darkGray).fontSize(9).font('Helvetica');
    doc.text(`Patient Name: ${pat.firstName} ${pat.lastName}`, 50, y + 26);
    doc.text(`MRN: ${pat.mrn}`, 220, y + 26);
    doc.text(`Date of Birth: ${pat.dateOfBirth}`, 390, y + 26);

    doc.text(`Member ID: ${pat.insuranceMemberId}`, 50, y + 44);
    doc.text(`Group Number: ${pat.insuranceGroupNumber || 'N/A'}`, 220, y + 44);
    doc.text(`Gender: ${pat.gender}`, 390, y + 44);

    y += 75;

    // SECTION 3: Requested Service & Provider
    doc.rect(40, y, 515, 75).stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('3. REQUESTED PROCEDURE & ORDERING PROVIDER', 50, y + 8);

    const cptList = (() => {
      try { return JSON.parse(request.cptCodes).join(', '); } catch { return request.cptCodes; }
    })();

    doc.fillColor(darkGray).fontSize(9).font('Helvetica');
    doc.text(`Service Category: ${request.serviceType}`, 50, y + 26);
    doc.text(`Procedure / CPT Codes: ${cptList}`, 220, y + 26);
    doc.text(`Ordering Provider: ${request.clinicalInformation?.orderingPhysicianName || 'Dr. Marcus Chen, MD'}`, 50, y + 44);
    doc.text(`Provider NPI: ${request.clinicalInformation?.orderingPhysicianNpi || '1942083319'}`, 390, y + 44);
    doc.text(`Requested Service: ${request.requestedService}`, 50, y + 60, { width: 495, ellipsis: true });

    y += 85;

    // SECTION 4: Clinical Rationale & Medical Necessity
    doc.rect(40, y, 515, 125).stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('4. CLINICAL JUSTIFICATION & MEDICAL NECESSITY', 50, y + 8);

    const clin = request.clinicalInformation;
    const icdList = (() => {
      try { return clin ? JSON.parse(clin.diagnosisCodes).join(', ') : 'M54.16'; } catch { return 'M54.16'; }
    })();

    doc.fillColor(darkGray).fontSize(9).font('Helvetica');
    doc.text(`Diagnosis: ${clin?.diagnosis || 'Documented Low Back Pain with Radiculopathy'} (${icdList})`, 50, y + 26);

    doc.font('Helvetica-Bold').text('Clinical Findings & Exam:', 50, y + 42);
    doc.font('Helvetica').text(
      (clin?.clinicalFindings || 'Physical examination demonstrates severe dermatomal pain with motor weakness.').substring(0, 220),
      50, y + 54, { width: 495 }
    );

    let prevTreatmentsText = 'Physical therapy completed x 8 weeks. NSAIDs trial failed.';
    if (clin?.previousTreatments) {
      try {
        const arr = JSON.parse(clin.previousTreatments);
        if (Array.isArray(arr)) prevTreatmentsText = arr.join('; ');
      } catch {
        prevTreatmentsText = clin.previousTreatments;
      }
    }

    doc.font('Helvetica-Bold').text('Prior Conservative Treatments:', 50, y + 88);
    doc.font('Helvetica').text(prevTreatmentsText.substring(0, 180), 50, y + 100, { width: 495 });

    y += 135;

    // SECTION 5: Attached Documents & Verification Checklist
    doc.rect(40, y, 515, 80).stroke(borderColor);
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('5. ATTACHED CLINICAL EVIDENCE & PAYER CHECKLIST', 50, y + 8);

    doc.fillColor(darkGray).fontSize(8).font('Helvetica');
    if (request.documents.length === 0) {
      doc.text('No documents attached.', 50, y + 26);
    } else {
      let docY = y + 24;
      request.documents.slice(0, 3).forEach((d) => {
        doc.text(`• [${d.category}] ${d.originalName} (${Math.round(d.fileSize / 1024)} KB) - Extraction: ${d.extractionStatus}`, 50, docY);
        docY += 14;
      });
    }

    const completedReqs = request.requirementResults.filter((r) => r.status === 'COMPLETE').length;
    const totalReqs = request.requirementResults.length;
    doc.text(`Payer Requirements Criteria Met: ${completedReqs} of ${totalReqs} applicable rules satisfied.`, 50, y + 66);

    y += 90;

    // SECTION 6: Sign-off & Notice
    doc.rect(40, y, 515, 55).fill('#f8fafc');
    doc.fillColor(lightGray).fontSize(7).font('Helvetica')
      .text(
        'NOTICE: This document was prepared with the Prior Authorization Assistant for administrative acceleration. This prototype complies with simulated hackathon standards. Final clinical verification by a licensed clinician is required prior to actual payer submission.',
        50, y + 8, { width: 495 }
      );

    doc.fillColor(darkGray).fontSize(8).font('Helvetica')
      .text(`Verified By: ${request.clinicalInformation?.isVerified ? 'Dr. Marcus Chen, MD (Verified)' : 'Draft Under Staff Review'}`, 50, y + 36)
      .text(`Generated: ${new Date().toLocaleString()}`, 350, y + 36);

    doc.end();
  });
}
