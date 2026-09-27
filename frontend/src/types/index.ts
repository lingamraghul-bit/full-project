// ─── User & Auth ────────────────────────────────────────

export type Role = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'LAB_STAFF' | 'DIAGNOSTIC_STAFF' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  lastLogin?: string;
  createdAt?: string;
  doctor?: Doctor & { department: Department };
  staff?: Staff & { department?: Department };
  patient?: Patient;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Department ─────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  _count?: { doctors: number; rooms: number; services: number };
}

// ─── Doctor ─────────────────────────────────────────────

export interface Doctor {
  id: string;
  userId: string;
  employeeId: string;
  departmentId: string;
  specialization?: string;
  qualification?: string;
  isAvailable: boolean;
  consultationDuration: number;
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string; isActive?: boolean };
  department: { id: string; name: string; code: string };
}

// ─── Staff ──────────────────────────────────────────────

export interface Staff {
  id: string;
  userId: string;
  employeeId: string;
  departmentId?: string;
  position?: string;
  user: { firstName: string; lastName: string; email: string; role: Role; isActive?: boolean };
  department?: { id: string; name: string };
}

// ─── Patient ────────────────────────────────────────────

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  isActive: boolean;
  createdAt: string;
  appointments?: Appointment[];
  qrTokens?: QRToken[];
  workflows?: PatientWorkflow[];
}

// ─── Appointment ────────────────────────────────────────

export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_QUEUE' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId?: string;
  departmentId: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  notes?: string;
  patient?: { id: string; patientId: string; firstName: string; lastName: string; phone?: string };
  doctor?: { id: string; user: { firstName: string; lastName: string } };
  department?: { id: string; name: string; code: string };
}

// ─── QR Token ───────────────────────────────────────────

export interface QRToken {
  id: string;
  token: string;
  patientId: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
}

export interface QRGenerateResponse {
  qrToken: string;
  qrImage: string;
  patient: { id: string; patientId: string; name: string };
  expiresAt: string;
}

// ─── Queue ──────────────────────────────────────────────

export type QueueEntryStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW';

export interface Queue {
  id: string;
  departmentId: string;
  prefix: string;
  currentNumber: number;
  isActive: boolean;
  department: { id: string; name: string; code: string };
  entries: QueueEntry[];
  _count?: { entries: number };
}

export interface QueueEntry {
  id: string;
  tokenNumber: string;
  queueId: string;
  appointmentId?: string;
  patientWorkflowId?: string;
  workflowStepId?: string;
  roomId?: string;
  status: QueueEntryStatus;
  priority: number;
  checkinTime: string;
  calledAt?: string;
  serviceStartAt?: string;
  serviceEndAt?: string;
  appointment?: Appointment & { patient?: { id: string; patientId: string; firstName: string; lastName: string; age?: number; gender?: string } };
  room?: Room;
  queue?: Queue;
  workflowStep?: { service?: Service };
  position?: number;
  estimatedWait?: WaitEstimate;
}

export interface Room {
  id: string;
  roomNumber: string;
  departmentId: string;
  doctorId?: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
}

export interface WaitEstimate {
  estimatedMinutes: number;
  lowerBound: number;
  upperBound: number;
  confidence: string;
}

// ─── Service ────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  departmentId: string;
  description?: string;
  durationMins: number;
  isActive: boolean;
  department?: { id: string; name: string; code: string };
}

// ─── Workflow ───────────────────────────────────────────

export interface PatientWorkflow {
  id: string;
  patientId: string;
  status: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  departmentId: string;
  serviceId?: string;
  stepOrder: number;
  status: 'PENDING' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  department: Department;
  service?: Service;
  startedAt?: string;
  completedAt?: string;
}

// ─── Notification ───────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: string;
  createdAt: string;
}

// ─── Audit ──────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string; role: Role };
}

// ─── Dashboard ──────────────────────────────────────────

export interface AdminDashboard {
  totalPatients: number;
  todayPatients: number;
  waiting: number;
  inService: number;
  completed: number;
  roomsAvailable: number;
  totalRooms: number;
  todayAppointments: number;
  avgWaitTime: number;
}

export interface ReceptionDashboard {
  todayRegistered: number;
  todayAppointments: number;
  waiting: number;
  inService: number;
  completed: number;
  noShows: number;
}

export interface DoctorDashboard {
  doctor: { id: string; name: string; department: Department; specialization?: string };
  todayAppointments: number;
  queue: {
    waiting: number;
    inService: number;
    completed: number;
    entries: QueueEntry[];
  };
}

// ─── Analytics ──────────────────────────────────────────

export interface AnalyticsOverview {
  patientsPerDay: { date: string; count: number }[];
  byDepartment: { name: string; count: number }[];
  avgWaitPerDay: { date: string; avg_wait: number }[];
  peakHours: { hour: number; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

// ─── API Response ───────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Display Queue ──────────────────────────────────────

export interface DisplayQueue {
  department: Department;
  serving: { tokenNumber: string; room?: string } | null;
  called: { tokenNumber: string; room?: string } | null;
  upcoming: { tokenNumber: string }[];
  totalWaiting: number;
}
