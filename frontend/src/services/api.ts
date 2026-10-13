const API_BASE = import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:5001/api');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err: any) {
    throw new Error('Unable to connect to Prior Authorization API server. Ensure backend is running.');
  }

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return await response.json();
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
  downloadOriginal: async (documentId: string, fileName: string) => {
    const response = await fetch(`${API_BASE}/documents/${documentId}/file`, { credentials: 'include' });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Could not download the original document.');
    const blobUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  },
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
  requestMissingInfo: (requestId: string, fieldName: string, reason: string) =>
    request<{ message: string }>(`/requests/${requestId}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ fieldName, reason }),
    }),
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

// ================= DENIAL APPEALS =================
export const appealsApi = {
  draft: (requestId: string, denialReasonText?: string) =>
    request<{ appeal: any; evidenceCount: number }>(`/requests/${requestId}/appeal/draft`, {
      method: 'POST',
      body: JSON.stringify({ denialReasonText }),
    }),
  submit: (requestId: string, appealId: string, draftText: string) =>
    request<{ appeal: any; isSimulated: boolean; message: string }>(`/requests/${requestId}/appeal/send`, {
      method: 'POST',
      body: JSON.stringify({ appealId, draftText }),
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
  getAIEngineStatus: () =>
    request<{ aiEngine: any }>('/admin/ai-engine-status'),
};
