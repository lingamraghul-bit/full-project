import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SmartQMS database...\n');

  // ─── Clear existing data (in reverse dependency order) ──────
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.queueEvent.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.patientWorkflow.deleteMany();
  await prisma.qRToken.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.room.deleteMany();
  await prisma.service.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.department.deleteMany();
  await prisma.hospitalSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data\n');

  // ─── Create Admin User ──────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@smartqms.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'System',
      lastName: 'Admin',
      phone: '+91-9000000000',
    },
  });
  console.log(`✓ Admin user: admin@smartqms.com / admin123`);

  // ─── Create Departments ─────────────────────────────────────
  const departmentsData = [
    { name: 'General Medicine', code: 'GEN', description: 'General outpatient consultations and primary care', prefix: 'G' },
    { name: 'Cardiology', code: 'CARD', description: 'Heart and cardiovascular system', prefix: 'C' },
    { name: 'Laboratory', code: 'LAB', description: 'Blood tests, urine analysis, and diagnostics', prefix: 'L' },
    { name: 'Radiology (X-Ray)', code: 'XRAY', description: 'X-Ray, CT scan, and imaging services', prefix: 'X' },
    { name: 'ENT', code: 'ENT', description: 'Ear, Nose, and Throat specialists', prefix: 'E' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Bone, joint, and musculoskeletal care', prefix: 'O' },
    { name: 'Pediatrics', code: 'PED', description: 'Child and adolescent healthcare', prefix: 'P' },
    { name: 'Dermatology', code: 'DERM', description: 'Skin, hair, and nail conditions', prefix: 'D' },
  ];

  const departments: Record<string, any> = {};
  for (const dept of departmentsData) {
    const department = await prisma.department.create({
      data: { name: dept.name, code: dept.code, description: dept.description },
    });
    // Auto-create queue for each department
    await prisma.queue.create({
      data: { departmentId: department.id, prefix: dept.prefix },
    });
    departments[dept.code] = department;
    console.log(`✓ Department: ${dept.name} (${dept.code}) → Queue prefix: ${dept.prefix}`);
  }

  // ─── Create Rooms ───────────────────────────────────────────
  const roomsData = [
    { roomNumber: 'G-101', deptCode: 'GEN' },
    { roomNumber: 'G-102', deptCode: 'GEN' },
    { roomNumber: 'C-201', deptCode: 'CARD' },
    { roomNumber: 'C-202', deptCode: 'CARD' },
    { roomNumber: 'L-301', deptCode: 'LAB' },
    { roomNumber: 'L-302', deptCode: 'LAB' },
    { roomNumber: 'X-401', deptCode: 'XRAY' },
    { roomNumber: 'E-501', deptCode: 'ENT' },
    { roomNumber: 'O-601', deptCode: 'ORTH' },
    { roomNumber: 'P-701', deptCode: 'PED' },
    { roomNumber: 'D-801', deptCode: 'DERM' },
  ];

  for (const room of roomsData) {
    await prisma.room.create({
      data: { roomNumber: room.roomNumber, departmentId: departments[room.deptCode].id },
    });
  }
  console.log(`✓ Created ${roomsData.length} rooms\n`);

  // ─── Create Doctors ─────────────────────────────────────────
  const doctorsData = [
    { firstName: 'Arun', lastName: 'Sharma', email: 'dr.arun@smartqms.com', deptCode: 'GEN', specialization: 'General Physician', qualification: 'MBBS, MD', roomNum: 'G-101' },
    { firstName: 'Priya', lastName: 'Patel', email: 'dr.priya@smartqms.com', deptCode: 'CARD', specialization: 'Cardiologist', qualification: 'MBBS, DM Cardiology', roomNum: 'C-201' },
    { firstName: 'Vikram', lastName: 'Reddy', email: 'dr.vikram@smartqms.com', deptCode: 'ENT', specialization: 'ENT Surgeon', qualification: 'MBBS, MS ENT', roomNum: 'E-501' },
    { firstName: 'Sneha', lastName: 'Gupta', email: 'dr.sneha@smartqms.com', deptCode: 'PED', specialization: 'Pediatrician', qualification: 'MBBS, MD Pediatrics', roomNum: 'P-701' },
    { firstName: 'Rajesh', lastName: 'Kumar', email: 'dr.rajesh@smartqms.com', deptCode: 'ORTH', specialization: 'Orthopedic Surgeon', qualification: 'MBBS, MS Ortho', roomNum: 'O-601' },
    { firstName: 'Meena', lastName: 'Iyer', email: 'dr.meena@smartqms.com', deptCode: 'DERM', specialization: 'Dermatologist', qualification: 'MBBS, MD Dermatology', roomNum: 'D-801' },
  ];

  const doctorPassword = await bcrypt.hash('doctor123', 12);

  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        username: `dr.${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}`,
        passwordHash: doctorPassword,
        role: 'DOCTOR',
        firstName: doc.firstName,
        lastName: doc.lastName,
      },
    });

    const room = await prisma.room.findFirst({
      where: { roomNumber: doc.roomNum, departmentId: departments[doc.deptCode].id },
    });

    await prisma.doctor.create({
      data: {
        userId: user.id,
        employeeId: `DR-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
        departmentId: departments[doc.deptCode].id,
        specialization: doc.specialization,
        qualification: doc.qualification,
        consultationDuration: 15,
      },
    });

    // Assign room to doctor
    if (room) {
      await prisma.room.update({
        where: { id: room.id },
        data: { doctorId: (await prisma.doctor.findFirst({ where: { userId: user.id } }))!.id },
      });
    }

    console.log(`✓ Doctor: Dr. ${doc.firstName} ${doc.lastName} (${doc.deptCode}) → ${doc.email} / doctor123`);
  }

  // ─── Create Receptionist ────────────────────────────────────
  const receptionPassword = await bcrypt.hash('reception123', 12);
  const receptionUser = await prisma.user.create({
    data: {
      email: 'reception@smartqms.com',
      username: 'receptionist',
      passwordHash: receptionPassword,
      role: 'RECEPTIONIST',
      firstName: 'Kavitha',
      lastName: 'Nair',
      phone: '+91-9000000001',
    },
  });
  await prisma.staff.create({
    data: {
      userId: receptionUser.id,
      employeeId: 'STF-REC001',
      position: 'Front Desk Receptionist',
    },
  });
  console.log(`✓ Receptionist: reception@smartqms.com / reception123`);

  // ─── Create Lab Staff ───────────────────────────────────────
  const labPassword = await bcrypt.hash('lab123', 12);
  const labUser = await prisma.user.create({
    data: {
      email: 'lab@smartqms.com',
      username: 'labstaff',
      passwordHash: labPassword,
      role: 'LAB_STAFF',
      firstName: 'Suresh',
      lastName: 'Menon',
    },
  });
  await prisma.staff.create({
    data: {
      userId: labUser.id,
      employeeId: 'STF-LAB001',
      departmentId: departments['LAB'].id,
      position: 'Lab Technician',
    },
  });
  console.log(`✓ Lab Staff: lab@smartqms.com / lab123`);

  // ─── Create Services ───────────────────────────────────────
  const servicesData = [
    { name: 'General Consultation', deptCode: 'GEN', durationMins: 15 },
    { name: 'Follow-up Visit', deptCode: 'GEN', durationMins: 10 },
    { name: 'ECG', deptCode: 'CARD', durationMins: 20 },
    { name: 'Cardiac Consultation', deptCode: 'CARD', durationMins: 20 },
    { name: 'Blood Test (CBC)', deptCode: 'LAB', durationMins: 10 },
    { name: 'Urine Analysis', deptCode: 'LAB', durationMins: 10 },
    { name: 'Lipid Profile', deptCode: 'LAB', durationMins: 15 },
    { name: 'Chest X-Ray', deptCode: 'XRAY', durationMins: 15 },
    { name: 'Dental X-Ray', deptCode: 'XRAY', durationMins: 10 },
    { name: 'Hearing Test', deptCode: 'ENT', durationMins: 20 },
    { name: 'ENT Consultation', deptCode: 'ENT', durationMins: 15 },
    { name: 'Fracture Assessment', deptCode: 'ORTH', durationMins: 20 },
    { name: 'Child Vaccination', deptCode: 'PED', durationMins: 10 },
    { name: 'Pediatric Consultation', deptCode: 'PED', durationMins: 15 },
    { name: 'Skin Consultation', deptCode: 'DERM', durationMins: 15 },
  ];

  for (const svc of servicesData) {
    await prisma.service.create({
      data: { name: svc.name, departmentId: departments[svc.deptCode].id, durationMins: svc.durationMins },
    });
  }
  console.log(`✓ Created ${servicesData.length} services\n`);

  // ─── Hospital Settings ──────────────────────────────────────
  const settingsData = [
    { key: 'hospital_name', value: 'SmartQMS City Hospital', label: 'Hospital Name', group: 'general' },
    { key: 'hospital_address', value: '123 Medical Lane, Health City, HC 560001', label: 'Address', group: 'general' },
    { key: 'hospital_phone', value: '+91-80-12345678', label: 'Phone', group: 'general' },
    { key: 'working_hours_start', value: '08:00', label: 'Working Hours Start', group: 'operations' },
    { key: 'working_hours_end', value: '20:00', label: 'Working Hours End', group: 'operations' },
    { key: 'avg_consultation_mins', value: '15', label: 'Avg Consultation (mins)', group: 'queue' },
    { key: 'max_queue_size', value: '50', label: 'Max Queue Size', group: 'queue' },
    { key: 'qr_expiry_hours', value: '24', label: 'QR Code Expiry (hours)', group: 'queue' },
    { key: 'enable_ai_assistant', value: 'true', label: 'Enable AI Assistant', group: 'ai' },
    { key: 'enable_sms_notifications', value: 'false', label: 'Enable SMS Notifications', group: 'notifications' },
  ];

  for (const setting of settingsData) {
    await prisma.hospitalSetting.create({ data: setting });
  }
  console.log(`✓ Created ${settingsData.length} hospital settings`);

  // ─── Summary ────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('🏥 SmartQMS Database Seeded Successfully!');
  console.log('═'.repeat(50));
  console.log('\n📋 Login Credentials:');
  console.log('  Admin:        admin@smartqms.com / admin123');
  console.log('  Receptionist: reception@smartqms.com / reception123');
  console.log('  Doctor:       dr.arun@smartqms.com / doctor123');
  console.log('                (all doctors use password: doctor123)');
  console.log('  Lab Staff:    lab@smartqms.com / lab123');
  console.log('\n📊 Data Created:');
  console.log(`  ${Object.keys(departments).length} Departments with queues`);
  console.log(`  ${roomsData.length} Rooms`);
  console.log(`  ${doctorsData.length} Doctors`);
  console.log(`  ${servicesData.length} Services`);
  console.log(`  ${settingsData.length} Settings`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
