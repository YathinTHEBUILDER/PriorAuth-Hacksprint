import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as authCtrl from '../controllers/authController.js';
import * as dashCtrl from '../controllers/dashboardController.js';
import * as patCtrl from '../controllers/patientController.js';
import * as reqCtrl from '../controllers/requestController.js';
import * as docCtrl from '../controllers/documentController.js';
import * as compCtrl from '../controllers/completenessController.js';
import * as genCtrl from '../controllers/generatorController.js';
import * as revCtrl from '../controllers/reviewController.js';
import * as subCtrl from '../controllers/submissionController.js';
import * as notifCtrl from '../controllers/notificationController.js';
import * as analCtrl from '../controllers/analyticsController.js';
import * as adminCtrl from '../controllers/adminController.js';

const router = Router();

// ================= AUTHENTICATION =================
router.post('/auth/login', authCtrl.login);
router.post('/auth/register', authCtrl.register);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.post('/auth/forgot-password', authCtrl.forgotPassword);

// ================= DASHBOARD =================
router.get('/dashboard/summary', authenticate, dashCtrl.getDashboardSummary);
router.get('/dashboard/activity', authenticate, dashCtrl.getDashboardActivity);

// ================= PATIENTS =================
router.get('/patients', authenticate, patCtrl.getPatients);
router.post('/patients', authenticate, patCtrl.createPatient);
router.get('/patients/:id', authenticate, patCtrl.getPatientById);
router.patch('/patients/:id', authenticate, patCtrl.updatePatient);

// ================= PAYERS =================
router.get('/payers', authenticate, reqCtrl.getPayers);

// ================= AUTHORIZATION REQUESTS =================
router.get('/requests', authenticate, reqCtrl.getRequests);
router.post('/requests', authenticate, reqCtrl.createRequest);
router.get('/requests/:id', authenticate, reqCtrl.getRequestById);
router.patch('/requests/:id', authenticate, reqCtrl.updateRequest);
router.delete('/requests/:id', authenticate, requireRole('ADMINISTRATOR'), reqCtrl.deleteRequest);

// ================= DOCUMENTS & EXTRACTION =================
router.post(
  '/requests/:id/documents',
  authenticate,
  docCtrl.uploadMiddleware.single('file'),
  docCtrl.uploadRequestDocument
);
router.get('/requests/:id/documents', authenticate, docCtrl.getRequestDocuments);
router.delete('/documents/:id', authenticate, docCtrl.deleteDocument);
router.post('/documents/:id/extract', authenticate, docCtrl.extractDocumentText);

// Extracted Fields & Clinical Information
router.patch('/requests/:id/clinical-information', authenticate, compCtrl.updateClinicalInformation);
router.patch('/extracted-fields/:id', authenticate, compCtrl.updateExtractedField);

// ================= COMPLETENESS =================
router.get('/requests/:id/completeness', authenticate, compCtrl.getCompleteness);
router.post('/requests/:id/completeness/check', authenticate, compCtrl.triggerCompletenessCheck);

// ================= GENERATION & PDF =================
router.post('/requests/:id/generate-draft', authenticate, genCtrl.generateDraft);
router.get('/requests/:id/preview', authenticate, genCtrl.getPreview);
router.get('/requests/:id/pdf', authenticate, genCtrl.downloadPDF);

// ================= REVIEW =================
router.post('/requests/:id/review', authenticate, revCtrl.submitReview);
router.post('/requests/:id/ready-for-submission', authenticate, revCtrl.markReadyForSubmission);

// ================= SUBMISSION & STATUS =================
router.post('/requests/:id/submit', authenticate, subCtrl.submitRequestToPayer);
router.get('/requests/:id/status-history', authenticate, subCtrl.getStatusHistory);
router.post('/requests/:id/demo-payer-response', authenticate, subCtrl.simulatePayerResponse);

// ================= NOTIFICATIONS =================
router.get('/notifications', authenticate, notifCtrl.getNotifications);
router.patch('/notifications/:id/read', authenticate, notifCtrl.markNotificationAsRead);
router.post('/notifications/mark-all-read', authenticate, notifCtrl.markAllNotificationsAsRead);

// ================= ANALYTICS =================
router.get('/analytics/summary', authenticate, analCtrl.getAnalyticsSummary);
router.get('/analytics/trends', authenticate, analCtrl.getAnalyticsTrends);
router.get('/analytics/export', authenticate, analCtrl.exportAnalyticsCSV);

// ================= ADMINISTRATION (ADMINISTRATOR ROLE) =================
router.get('/admin/users', authenticate, requireRole('ADMINISTRATOR'), adminCtrl.getUsers);
router.post('/admin/users', authenticate, requireRole('ADMINISTRATOR'), adminCtrl.createUser);
router.patch('/admin/users/:id', authenticate, requireRole('ADMINISTRATOR'), adminCtrl.updateUser);

router.get('/admin/payer-configurations', authenticate, adminCtrl.getPayerConfigurations);
router.post('/admin/payer-configurations', authenticate, requireRole('ADMINISTRATOR'), adminCtrl.createPayerConfiguration);
router.patch('/admin/payer-configurations/:id', authenticate, requireRole('ADMINISTRATOR'), adminCtrl.updatePayerConfiguration);

router.get('/admin/audit-logs', authenticate, requireRole('ADMINISTRATOR'), adminCtrl.getAuditLogs);

export default router;
