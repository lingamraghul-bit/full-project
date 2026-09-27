# 🏥 SmartQMS — How to Run Guide

This document contains step-by-step instructions to set up, run, and interact with the **SmartQMS** (Smart Hospital Queue Management System).

---

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher) running locally
3. **Database:** Ensure a database named `smartqms` exists in PostgreSQL.

---

## ⚙️ Environment Configuration

Check [`backend/.env`](backend/.env) to ensure your database connection string and secret keys are configured correctly:

```env
DATABASE_URL="postgresql://postgres:Raghul%4078@localhost:5432/smartqms?schema=public"
JWT_SECRET="smartqms-super-secret-jwt-key-change-in-production-2024"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

> **Note:** If your PostgreSQL password contains special characters like `@`, URL-encode them (e.g., `@` becomes `%40`).

---

## 🗄️ Database Setup (One-time or Schema Updates)

From the root directory, run:

```powershell
# 1. Navigate to backend
cd backend

# 2. Push Prisma schema to PostgreSQL
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Seed default users, services, counters, and test data
npx tsx prisma/seed.ts
```

---

## 🚀 Running the Application

You need two separate terminal windows (one for Backend, one for Frontend).

### Terminal 1: Backend Server (Port 5000)

```powershell
cd backend
npm run dev
```
- **API URL:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### Terminal 2: Frontend Web App (Port 5173)

```powershell
cd frontend
npm run dev
```
- **Web App URL:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Login Credentials

Navigate to [http://localhost:5173/login](http://localhost:5173/login) and log in with any role:

| Role | Email | Password | Features / Dashboard |
|---|---|---|---|
| 👑 **Admin** | `admin@smartqms.com` | `admin123` | Full system analytics, department management, users, audit logs |
| 📋 **Receptionist** | `reception@smartqms.com` | `reception123` | Patient check-in, token generation, queue overview |
| 🩺 **Doctor** | `doctor@smartqms.com` | `doctor123` | Call next patient, consultation notes, triage, transfers |
| 💊 **Pharmacist** | `pharmacy@smartqms.com` | `pharmacy123` | Medication dispense queue, prescription management |
| 🔬 **Lab Technician** | `lab@smartqms.com` | `lab123` | Sample collection, test results, lab queue |

---

## 📺 Public Displays & Kiosks

- **Kiosk Token Generator:** [http://localhost:5173/kiosk](http://localhost:5173/kiosk)
- **Waiting Hall Queue Display:** [http://localhost:5173/display](http://localhost:5173/display)

---

## 🛠️ Handy Utility Commands

```powershell
# Inspect database records via Prisma visual GUI
cd backend
npx prisma studio

# Build backend for production
cd backend
npm run build

# Build frontend for production
cd frontend
npm run build
```
