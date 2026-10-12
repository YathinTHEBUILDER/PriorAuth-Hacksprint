// Shared types for Prior Authorization Assistant

export type UserRole = 'ADMINISTRATOR' | 'DOCTOR' | 'STAFF';

export type RequestStatus =
  | 'DRAFT'
  | 'PROCESSING_DOCUMENTS'
  | 'MISSING_INFORMATION'
  | 'READY_FOR_REVIEW'
  | 'READY_FOR_SUBMISSION'
  | 'SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'ADDITIONAL_INFO_REQUESTED'
  | 'CANCELLED';

export type DocumentCategory =
  | 'CLINICAL_NOTES'
  | 'DIAGNOSIS_RECORDS'
  | 'LABORATORY_REPORTS'
  | 'IMAGING_REPORTS'
  | 'MEDICATION_RECORDS'
  | 'TREATMENT_PLANS'
  | 'INSURANCE_INFORMATION'
  | 'OTHER_SUPPORTING';

export type ExtractionStatus =
  | 'PENDING'
  | 'EXTRACTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'MANUAL_ENTRY';

export type RequirementStatus =
  | 'COMPLETE'
  | 'MISSING'
  | 'NEEDS_REVIEW'
  | 'NOT_APPLICABLE';

export type Priority = 'STANDARD' | 'URGENT' | 'EXPEDITED';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string;
  isActive: boolean;
  createdAt: string;
}

export interface PatientSummary {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  insurancePayerId: string;
  insuranceMemberId: string;
  insuranceGroupNumber?: string;
  payerName?: string;
}

export interface PayerSummary {
  id: string;
  name: string;
  code: string;
  payerType: string;
  contactPhone?: string;
  electronicId?: string;
  portalUrl?: string;
  isActive: boolean;
}

export interface ExtractedFieldItem {
  id: string;
  fieldName: string;
  fieldValue: string;
  confidence: number;
  sourceSnippet: string;
  isVerified: boolean;
  verifiedValue?: string;
  documentId: string;
  documentName?: string;
  category?: DocumentCategory;
}

export interface DocumentItem {
  id: string;
  requestId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  category: DocumentCategory;
  extractionStatus: ExtractionStatus;
  extractedText?: string;
  uploadedBy?: string;
  createdAt: string;
  extractedFields?: ExtractedFieldItem[];
}

export interface ClinicalInfoData {
  id?: string;
  requestId: string;
  diagnosis: string;
  diagnosisCodes: string[];
  symptoms: string[];
  clinicalFindings: string;
  previousTreatments: string[];
  contraindications: string[];
  proposedTreatmentPlan: string;
  orderingPhysicianName: string;
  orderingPhysicianNpi: string;
  documentDates: string[];
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface RequirementCheckItem {
  id: string;
  code: string;
  name: string;
  description: string;
  isRequired: boolean;
  status: RequirementStatus;
  explanation: string;
  sourceDocumentName?: string;
  sourceDocumentId?: string;
  recommendedAction: string;
  applicabilityRule?: string;
}

export interface CompletenessResult {
  score: number; // 0 to 100
  totalApplicable: number;
  completedCount: number;
  missingCount: number;
  needsReviewCount: number;
  isConfigured: boolean;
  items: RequirementCheckItem[];
}

export interface StatusHistoryItem {
  id: string;
  fromStatus?: RequestStatus;
  toStatus: RequestStatus;
  changedByName: string;
  changeReason?: string;
  notes?: string;
  timestamp: string;
}

export interface AuthorizationRequestDetail {
  id: string;
  requestNumber: string;
  patientId: string;
  patient: PatientSummary;
  payerId: string;
  payer: PayerSummary;
  serviceType: string;
  requestedService: string;
  cptCodes: string[];
  icd10Codes: string[];
  priority: Priority;
  status: RequestStatus;
  completenessScore: number;
  submissionRef?: string;
  notes?: string;
  requestedStartDate?: string;
  requestedEndDate?: string;
  createdById: string;
  createdByName: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  createdAt: string;
  updatedAt: string;
  clinicalInformation?: ClinicalInfoData;
  documents: DocumentItem[];
  completeness?: CompletenessResult;
  statusHistory: StatusHistoryItem[];
  isSimulatedSubmission?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  relatedRequestId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  eventType: string;
  actionDetails: string;
  userName: string;
  userRole: UserRole;
  ipAddress?: string;
  relatedRequestId?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalRequests: number;
  draftRequests: number;
  missingInfoRequests: number;
  readyForReviewRequests: number;
  submittedRequests: number;
  approvedRequests: number;
  deniedRequests: number;
  avgPreparationHours: number;
  avgCompletenessScore: number;
}
