import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function makePDF(filePath: string, title: string, content: string) {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));
  doc.rect(40, 40, 515, 45).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(title, 55, 55);
  doc.moveDown(2);
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(content, 45, 105, { width: 505, lineGap: 4 });
  doc.end();
}

makePDF(
  path.join(uploadDir, 'sample_robert_davis_clinic_note.pdf'),
  'METRO ORTHOPEDIC & SPINE CLINIC - PROGRESS NOTE',
  `Patient: Robert Davis\nDOB: 05/18/1974\nMRN: MRN-884920\nDate of Visit: 10/04/2026\nOrdering Clinician: Dr. Marcus Chen, MD\nNPI: 1942083319\n\nCHIEF COMPLAINT: Low back pain with radiculopathy into left L5 dermatome.\n\nHISTORY OF PRESENT ILLNESS:\n52-year-old male with severe low back pain for 3 months radiating to left foot. Attended 16 sessions of physical therapy between August and September 2026 without relief. Trial of Meloxicam 15mg daily x 8 weeks failed.\n\nPHYSICAL EXAMINATION:\nPositive Straight Leg Raise on left at 40 degrees. Left extensor hallucis longus strength 4/5. Sensation decreased over left L5 distribution. No cauda equina signs. Bowel and bladder normal.\n\nASSESSMENT & PLAN:\n1. Lumbar radiculopathy, left L5 dermatome (M54.16)\n2. Low back pain (M54.51)\nPlan: MRI Lumbar Spine without Contrast (CPT 72148).`
);

makePDF(
  path.join(uploadDir, 'sample_knee_arthroscopy_mri.pdf'),
  'METRO ADVANCED IMAGING - RIGHT KNEE MRI REPORT',
  `Patient: Elena Rodriguez\nDOB: 11/03/1982\nMRN: MRN-773105\nExam Date: 10/08/2026\nOrdering Provider: Dr. Marcus Chen, MD\n\nINDICATION: Right knee pain, mechanical locking, medial joint tenderness following injury.\n\nFINDINGS:\nComplex tear of the posterior horn of the medial meniscus extending to the superior and inferior articular surfaces. Joint effusion noted. Anterior and posterior cruciate ligaments intact.\n\nIMPRESSION:\nComplex medial meniscal tear (ICD-10: M23.22).\nRecommend orthopedic evaluation for Arthroscopic Meniscectomy (CPT 29881).`
);

makePDF(
  path.join(uploadDir, 'sample_biologic_tb_gold_lab.pdf'),
  'METRO PATHOLOGY LABS - QUANTIFERON-TB GOLD PLUS REPORT',
  `Patient: James Wilson\nDOB: 02/27/1968\nMRN: MRN-640192\nCollection Date: 10/10/2026\nOrdering Provider: Dr. Marcus Chen, MD\n\nTEST: QuantiFERON-TB Gold Plus (Tuberculosis Screening)\nRESULT: NEGATIVE\nReference Range: Negative\nInterpretation: No Mycobacterium tuberculosis infection detected. Cleared for biologic DMARD immunosuppressive therapy.`
);

console.log('✓ All 3 sample clinical PDF files generated successfully in uploads/');
