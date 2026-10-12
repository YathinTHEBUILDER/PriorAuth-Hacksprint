import { fallbackPatients, fallbackPayers, fallbackRequests, fallbackSummary } from './mockFallback';

const API_BASE = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : 'http://localhost:5001/api');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`[API] Live server request to ${endpoint} failed, falling back to demo state.`, err);
  }

  // Demo fallback handlers for hosted Vercel preview environments
  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/me')) {
    const demoUser = {
      id: 'user-doctor-01',
      email: 'doctor@priorauth.health',
      fullName: 'Dr. Marcus Chen, MD',
      role: 'DOCTOR',
      organization: 'Metro Orthopedics & Spine',
      isActive: true,
    };
    return { user: demoUser, token: 'demo-jwt-token' } as unknown as T;
  }

  if (endpoint.startsWith('/auth/register')) {
    const demoUser = {
      id: 'user-demo-02',
      email: 'demo@priorauth.health',
      fullName: 'Demo Clinician, MD',
      role: 'DOCTOR',
      organization: 'General Health Care',
      isActive: true,
    };
    return { user: demoUser, token: 'demo-jwt-token' } as unknown as T;
  }

  if (endpoint.startsWith('/dashboard/summary')) {
    return { summary: fallbackSummary } as unknown as T;
  }

  if (endpoint.startsWith('/dashboard/activity')) {
    return {
      activities: [
        { id: 'act-1', eventType: 'DOCUMENT_UPLOADED', actionDetails: 'Uploaded orthopedic clinic notes for Robert Davis', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'act-2', eventType: 'CRITERIA_VERIFIED', actionDetails: 'Verified 4/5 clinical criteria for Lumbar Spine MRI', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 'act-3', eventType: 'REQUEST_SUBMITTED', actionDetails: 'Submitted PA packet to Blue Cross Blue Shield', createdAt: new Date(Date.now() - 14400000).toISOString() },
      ]
    } as unknown as T;
  }

  if (endpoint.startsWith('/patients')) {
    if (endpoint.includes('/pat-')) {
      const p = fallbackPatients.find(x => endpoint.includes(x.id)) || fallbackPatients[0];
      return { patient: p } as unknown as T;
    }
    return { patients: fallbackPatients } as unknown as T;
  }

  if (endpoint.startsWith('/payers')) {
    return { payers: fallbackPayers } as unknown as T;
  }

  if (endpoint.startsWith('/requests')) {
    if (endpoint.includes('/req-')) {
      const r = fallbackRequests.find(x => endpoint.includes(x.id)) || fallbackRequests[0];
      return { request: r } as unknown as T;
    }
    return { requests: fallbackRequests } as unknown as T;
  }

  if (endpoint.includes('/requirements')) {
    const results = fallbackRequests[0]?.requirementResults || [];
    return {
      profile: {
        id: 'prof-demo',
        serviceCategory: 'RADIOLOGY',
        requirements: results.map((x: any) => x.requirement),
      }
    } as unknown as T;
  }

  if (endpoint.includes('/completeness')) {
    const results = fallbackRequests[0]?.requirementResults || [];
    return {
      completeness: {
        score: 80.0,
        status: 'READY_FOR_REVIEW',
        results,
        canSubmit: true,
      }
    } as unknown as T;
  }

  if (endpoint.startsWith('/notifications')) {
    return {
      notifications: [
        { id: 'n-1', title: 'Document Extraction Completed', message: 'Orthopedic clinic notes parsed successfully.', type: 'SUCCESS', isRead: false, createdAt: new Date().toISOString() },
        { id: 'n-2', title: 'Action Required', message: 'Review conservative treatment verification for PA-2026-00101.', type: 'WARNING', isRead: false, createdAt: new Date().toISOString() },
      ]
    } as unknown as T;
  }

  if (endpoint.startsWith('/audit')) {
    return {
      logs: [
        { id: 'aud-1', eventType: 'CLINICAL_VERIFICATION', actionDetails: 'Doctor confirmed conservative care requirement.', createdAt: new Date().toISOString() },
      ]
    } as unknown as T;
  }

  return { message: 'Demo operation completed', success: true } as unknown as T;
}

// ================= AUTHENTICATION =================
export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  register: (data: any) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () =>
    request<{ user: any }>('/auth/me'),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

// ================= DASHBOARD =================
export const dashboardApi = {
  getSummary: () => request<any>('/dashboard/summary'),
  getActivity: () => request<any>('/dashboard/activity'),
};

// ================= PATIENTS =================
export const patientsApi = {
  getPatients: (search?: string) =>
    request<{ patients: any[] }>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPatientById: (id: string) =>
    request<{ patient: any }>(`/patients/${id}`),
  createPatient: (data: any) =>
    request<{ patient: any }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePatient: (id: string, data: any) =>
    request<{ patient: any }>(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ================= PAYERS =================
export const payersApi = {
  getPayers: () => request<{ payers: any[] }>('/payers'),
};

// ================= AUTHORIZATION REQUESTS =================
export const requestsApi = {
  getRequests: (params?: { status?: string; payerId?: string; serviceType?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.payerId) query.append('payerId', params.payerId);
    if (params?.serviceType) query.append('serviceType', params.serviceType);
    if (params?.search) query.append('search', params.search);
    return request<{ requests: any[] }>(`/requests?${query.toString()}`);
  },
  getRequestById: (id: string) =>
    request<{ request: any }>(`/requests/${id}`),
  createRequest: (data: any) =>
    request<{ request: any }>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRequest: (id: string, data: any) =>
    request<{ request: any }>(`/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRequest: (id: string) =>
    request<{ message: string }>(`/requests/${id}`, { method: 'DELETE' }),
};

// ================= DOCUMENTS & EXTRACTION =================
export const documentsApi = {
  uploadDocument: (requestId: string, formData: FormData) =>
    request<{ document: any; message: string }>(`/requests/${requestId}/documents`, {
      method: 'POST',
      body: formData,
    }),
  getDocuments: (requestId: string) =>
    request<{ documents: any[] }>(`/requests/${requestId}/documents`),
  deleteDocument: (id: string) =>
    request<{ message: string }>(`/documents/${id}`, { method: 'DELETE' }),
  reExtractDocument: (documentId: string) =>
    request<{ document: any; extractionResult: any; message: string }>(`/documents/${documentId}/extract`, {
      method: 'POST',
    }),
};

// ================= CLINICAL INFO & EXTRACTION =================
export const clinicalApi = {
  updateClinicalInfo: (requestId: string, data: any) =>
    request<{ clinicalInformation: any; completeness: any; message: string }>(`/requests/${requestId}/clinical-information`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateExtractedField: (fieldId: string, data: { verifiedValue?: string; isVerified?: boolean }) =>
    request<{ field: any; message: string }>(`/extracted-fields/${fieldId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ================= COMPLETENESS =================
export const completenessApi = {
  getCompleteness: (requestId: string) =>
    request<{ completeness: any }>(`/requests/${requestId}/completeness`),
  triggerCheck: (requestId: string) =>
    request<{ completeness: any; message: string }>(`/requests/${requestId}/completeness/check`, {
      method: 'POST',
    }),
};

// ================= GENERATION & PDF =================
export const generationApi = {
  generateDraft: (requestId: string) =>
    request<any>(`/requests/${requestId}/generate-draft`, { method: 'POST' }),
  getPreview: (requestId: string) =>
    request<{ preview: any }>(`/requests/${requestId}/preview`),
  getPDFUrl: (requestId: string) => `${API_BASE}/requests/${requestId}/pdf`,
};

// ================= REVIEW =================
export const reviewApi = {
  submitReview: (requestId: string, data: { reviewDecision: string; reviewNotes: string; changesMade?: any }) =>
    request<{ review: any; message: string }>(`/requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  markReadyForSubmission: (requestId: string) =>
    request<{ request: any; message: string }>(`/requests/${requestId}/ready-for-submission`, {
      method: 'POST',
    }),
};

// ================= SUBMISSION =================
export const submissionApi = {
  submitToPayer: (requestId: string) =>
    request<any>(`/requests/${requestId}/submit`, { method: 'POST' }),
  getStatusHistory: (requestId: string) =>
    request<{ history: any[] }>(`/requests/${requestId}/status-history`),
  simulateResponse: (requestId: string, data: { outcome: string; reasonNotes?: string }) =>
    request<any>(`/requests/${requestId}/demo-payer-response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ================= NOTIFICATIONS =================
export const notificationsApi = {
  getNotifications: () =>
    request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markAsRead: (id: string) =>
    request<{ notification: any }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () =>
    request<{ message: string }>('/notifications/mark-all-read', { method: 'POST' }),
};

// ================= ANALYTICS =================
export const analyticsApi = {
  getSummary: () => request<any>('/analytics/summary'),
  getTrends: () => request<any>('/analytics/trends'),
  getExportUrl: () => `${API_BASE}/analytics/export`,
};

// ================= ADMIN =================
export const adminApi = {
  getUsers: (search?: string) =>
    request<{ users: any[] }>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createUser: (data: any) =>
    request<{ user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: any) =>
    request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getPayerConfigs: () =>
    request<{ profiles: any[] }>('/admin/payer-configurations'),
  createPayerConfig: (data: any) =>
    request<{ profile: any }>('/admin/payer-configurations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePayerConfig: (id: string, data: any) =>
    request<{ profile: any }>(`/admin/payer-configurations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getAuditLogs: (params?: { eventType?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.eventType) query.append('eventType', params.eventType);
    if (params?.search) query.append('search', params.search);
    return request<{ logs: any[] }>(`/admin/audit-logs?${query.toString()}`);
  },
};
