import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().optional(),
  age: z.number().min(0).max(150).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  phone: z.string().min(5, 'Phone number is required').max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodGroup: z.string().optional(),
});

export const updatePatientSchema = registerPatientSchema.partial();

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  doctorId: z.string().uuid('Invalid doctor ID').optional(),
  departmentId: z.string().uuid('Invalid department ID'),
  date: z.string().min(1, 'Date is required'),
  timeSlot: z.string().min(1, 'Time slot is required'),
  notes: z.string().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  code: z.string().min(1, 'Department code is required').max(10).toUpperCase(),
  description: z.string().optional(),
});

export const createDoctorSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  departmentId: z.string().uuid('Invalid department ID'),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  consultationDuration: z.number().min(5).max(120).optional(),
});

export const createStaffSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['RECEPTIONIST', 'LAB_STAFF', 'DIAGNOSTIC_STAFF']),
  departmentId: z.string().uuid().optional(),
  position: z.string().optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  departmentId: z.string().uuid('Invalid department ID'),
  description: z.string().optional(),
  durationMins: z.number().min(1).max(480).optional(),
});

export const checkinSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required'),
  departmentId: z.string().uuid('Invalid department ID').optional(),
});

export const queueActionSchema = z.object({
  entryId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const workflowSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  steps: z.array(z.object({
    departmentId: z.string().uuid(),
    serviceId: z.string().uuid().optional(),
  })).min(1, 'At least one workflow step is required'),
});

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  conversationId: z.string().uuid().optional(),
  context: z.enum(['patient', 'admin']).optional().default('patient'),
  patientId: z.string().uuid().optional(),
});
