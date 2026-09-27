# 🏥 SmartQMS — Project Review 1 Comprehensive Analysis & Presentation Guide

**Project Title:** SmartQMS: Intelligent Workflow-Aware Hospital Queue Management and Dynamic Resource Allocation System  
**Candidate Register Number:** 24MIS0469  
**Programme:** Integrated M.Tech Software Engineering  
**Review Stage:** Project Review 1 (September 2026)  

---

## 📂 Deliverables Created

1. **PowerPoint Presentation (.pptx):**  
   [`SmartQMS_Project_Review_1_Presentation.pptx`](file:///c:/Users/RAGHUL/Desktop/24mis0469/SmartQMS_Project_Review_1_Presentation.pptx)  
   - 14 high-impact, professional 16:9 widescreen slides in modern Dark Navy / Medical Teal / Cyan styling.
   - Ready to present in Microsoft PowerPoint, Google Slides, or Apple Keynote.

2. **Interactive Web Presentation Deck (.html):**  
   [`presentation.html`](file:///c:/Users/RAGHUL/Desktop/24mis0469/presentation.html)  
   - Interactive slide viewer with keyboard shortcuts (`Arrow keys`, `Space`, `F` for Fullscreen).
   - Printable to PDF via browser Print (`Ctrl + P`).

3. **Presentation Generation Script (Python):**  
   [`generate_presentation.py`](file:///c:/Users/RAGHUL/Desktop/24mis0469/generate_presentation.py)  
   - Fully automated and customizable script using `python-pptx`.

---

## 📊 Comprehensive Project Analysis

### 1. Problem Definition & Clinical Context
Hospital Outpatient Departments (OPD), diagnostic laboratories, and pharmacy counters face recurring congestion bottlenecks:
- **First-Come-First-Served (FCFS) Blindness:** Traditional token dispensers assign priority solely on arrival time. An emergency or unstable patient (e.g. acute chest pain or pediatric distress) is forced to queue behind routine health check-up walk-ins.
- **Departmental Islands:** In most tertiary hospitals, departments operate completely isolated queue systems. When a doctor orders blood tests and X-rays, the patient must physically walk to the Lab, pull a second token, join a 30-person queue, then walk to Radiology for a third queue.
- **Cascading Congestion:** OPD delays propagate downstream, causing unpredictable surges at diagnostic booths and counter starvation when doctors sit idle waiting for delayed patients.
- **Patient Anxiety & No-Shows:** Lack of queue transparency and unpredictable wait times cause patient frustration, lobby crowding, and high no-show rates.

### 2. Literature Survey Insights (15 Papers: 2022–2026)
A systematic survey of 15 recent peer-reviewed publications revealed five critical limitations across prior research:
1. **Single-Stage Simulators:** Focus on isolated departments (ER only or OPD only), ignoring cross-department patient handoffs (Al-Refaie 2023, Zhang & Wang 2024).
2. **Static Hardware Tokens:** Digital/RFID token dispensers eliminate paper slips but still enforce rigid FIFO ordering without clinical acuity (Suresh & Sundararajan 2023).
3. **Passive Predictive Models:** ML regressors forecast waiting times without feeding back into active room dispatchers or dynamic token reordering (El-Banna 2023).
4. **Opaque AI Black-Boxes:** Deep reinforcement learning approaches lack explainability and clinical auditability needed by physicians during medical emergencies (Chen 2025).
5. **Disconnected Information Silos:** Lack of sub-second real-time sync across kiosks, doctor chambers, and waiting hall TV displays (Nair 2026).

### 3. The Central Research Question
> *"How can a unified healthcare queue management platform dynamically orchestrate multi-department patient workflows, adaptively balance clinical urgency with waiting-time fairness, provide confidence-bounded wait estimates, and maintain sub-second multi-client synchronization across physical hospital counters?"*

### 4. Mathematical Modeling & Algorithmic Core

#### A. Dynamic Fair-Priority Scoring (DFPS) Algorithm
To prioritize critical cases while guaranteeing that routine walk-in patients never suffer infinite starvation:
$$P_i(t) = w_1 \cdot \text{Acuity}(i) + w_2 \cdot \text{ApptPunctuality}(i, t) + w_3 \cdot \ln(1 + t - t_{\text{checkin}}) + w_4 \cdot \text{AgeVulnerability}(i)$$

- $\text{Acuity}(i) \in \{0, 1, 2\}$: Emergency Severity Index rating (0 = Routine, 1 = Urgent, 2 = Emergency).
- $\text{ApptPunctuality}(i, t)$: Normal distribution weighting favoring patients arriving punctually within their scheduled window.
- $\ln(1 + t - t_{\text{checkin}})$: Time-dependent logarithmic aging factor that monotonically elevates priority as waiting time increases, permanently eliminating token starvation.
- $\text{AgeVulnerability}(i)$: Priority weighting for pediatric ($<5$ yrs) and geriatric ($>65$ yrs) patients.
- $w_1, w_2, w_3, w_4$: Experimentally optimized weights.

#### B. Adaptive Wait-Time Forecasting (EWMA) with Confidence Bounds
Expected wait time for a patient with $N_{\text{ahead}}$ higher-ranked tokens in the queue:
$$W_e = \frac{N_{\text{ahead}} \cdot \mu_{\text{service}}}{C_{\text{active}}}$$
$$\text{Confidence Interval} = \left[ W_e \cdot (1 - \alpha), \; W_e \cdot (1 + \beta) \right]$$

- $\mu_{\text{service}}$: Rolling Exponentially Weighted Moving Average (EWMA) of actual consultation durations over the previous 2 hours ($\lambda = 0.2$).
- $C_{\text{active}}$: Count of active and logged-in doctor rooms in that department.
- $[\alpha, \beta]$: Dynamic confidence bounds calculated from service time standard deviation.

### 5. Full-Stack System Architecture & Tech Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Real-Time Gateway:** Socket.IO Client & Server (sub-100ms room-based event broadcasting).
- **Backend Core:** Node.js, Express, TypeScript, RESTful API architecture, JWT authentication, and RBAC middleware.
- **Database & Persistence:** PostgreSQL with Prisma ORM (relational models for Users, Doctors, Rooms, Appointments, Queues, Workflows, AuditLogs).
- **AI Integration:** Google Gemini Generative AI connected to live queue database state for contextual patient assistance.

---

## 🎙️ Slide-by-Slide Viva Speaking Notes (Review 1)

Use these concise, professional speaking notes during your Project Review 1 presentation:

### Slide 1: Title & Introduction
> *"Good morning, respected review committee members. I am presenting Project Review 1 for SmartQMS: Intelligent Workflow-Aware Hospital Queue Management and Dynamic Resource Allocation System under register number 24MIS0469. This project addresses the severe operational bottlenecks, long waiting times, and disconnected queues that plague modern hospital outpatient departments."*

### Slide 2: Problem Statement & Clinical Challenges
> *"In traditional hospital OPDs, patient care does not happen in a single room; patients transition through a complex care trajectory—from general consultation to blood labs, radiology, and pharmacy. Today's hospital queues operate on rigid First-Come-First-Served logic in isolated silos. When doctors refer patients for tests, patients must stand in another physical queue from scratch. This leads to cascading congestion, dangerous triage delays for unstable patients, idle doctors waiting for late patients, and high anxiety for patients."*

### Slide 3: Objectives & Innovations
> *"To solve this, SmartQMS proposes four main innovations: First, a Dynamic Fair-Priority Scoring algorithm balancing clinical severity, appointment punctuality, and logarithmic time-aging to prevent starvation. Second, multi-stage workflow orchestration modeling the patient journey as a Directed Acyclic Graph (DAG) with zero manual re-ticketing. Third, adaptive wait-time estimation using rolling EWMA analytics. And fourth, a sub-second WebSocket event bus connecting touch kiosks, doctor chamber controls, and public TV displays."*

### Slide 4 & 5: Literature Survey & Comparison Matrix
> *"We systematically surveyed 15 recent peer-reviewed papers from 2022 to 2026 spanning queuing theory, discrete-event simulation, IoT token dispensers, machine learning wait predictors, and LLM hospital assistants. As shown in the comparative matrix on Slide 5, existing systems either optimize single rooms in isolation, suffer from static FIFO dispatching, run offline batch simulations without live feedback, or utilize black-box models that cannot be audited during medical emergencies. SmartQMS combines explainable triage mathematics with full-stack, production-ready operational execution."*

### Slide 6: Research Gap & Central Research Question
> *"The core research question is: How can a unified platform dynamically orchestrate multi-department workflows, balance clinical urgency with wait-time fairness, provide bounded wait estimates, and maintain sub-second multi-counter synchronization? SmartQMS answers this through our chained workflow DAG, DFPS priority engine, reactive event bus, and explainable audit trails."*

### Slide 7: System Architecture
> *"Our architecture consists of four distinct tiers: Tier 1 comprises responsive client interfaces for kiosks, doctor portals, and public TV displays. Tier 2 houses the Express REST API and Socket.IO real-time event gateway with JWT-based role access control. Tier 3 contains the core business logic—the priority scorer, workflow orchestrator, and wait estimator. Tier 4 provides relational persistence through PostgreSQL and Prisma ORM, tracking high-resolution timestamps for every queue event."*

### Slide 8: Mathematical Formulations
> *"On Slide 8, our dynamic priority formula P_i(t) integrates clinical acuity, appointment window punctuality, and an essential logarithmic aging term: ln(1 + t - t_checkin). This guarantees that routine walk-in patients will eventually gain higher priority, completely eliminating starvation. Our wait-time estimator uses rolling exponentially weighted moving averages calibrated against currently active doctor rooms, accompanied by confidence bounds."*

### Slide 9: Multi-Stage Workflow Orchestration
> *"Slide 9 illustrates the patient trajectory. At Stage 1, the patient checks in via QR kiosk. In Stage 2, the doctor conducts the consultation and orders tests. When the doctor concludes the consultation, Stage 3 automatically transfers the token into the Central Lab queue without the patient needing to register again. Cumulative wait times are preserved, directly eliminating the 40% inter-department transfer delay reported in literature."*

### Slide 10 & 11: Modules & Full-Stack Implementation
> *"Unlike purely theoretical review projects, we have already built a fully working prototype. We have implemented the QR Kiosk, Doctor Chamber Portal, Public TV Display with audio chime announcements, Workflow Orchestrator, Executive Analytics Dashboard, and a context-grounded AI Assistant. The technology stack features React 18, Node.js, Express, Socket.IO, Prisma ORM, and PostgreSQL."*

### Slide 12: Experimental Evaluation Plan
> *"We evaluate SmartQMS against four rigorous baselines: random walk-ins, pure FCFS token systems, static appointment scheduling, and disconnected departmental queues. Our quantitative metrics include Average Wait Time, Total Hospital Dwell Time, Counter Idle Ratio, Triage Response Latency, and Starvation Index. Our target hypotheses anticipate a 30% to 45% reduction in total dwell time and over 60% acceleration in emergency triage response."*

### Slide 13 & 14: Review 1 Milestones & Future Roadmap
> *"In Review 1, we have completed the comprehensive literature survey, finalized the mathematical models, and built the full-stack prototype. For Review 2, our roadmap focuses on discrete-event simulation benchmarking, concurrency stress testing under 1,000+ simultaneous connections, and fine-tuning the LLM assistant for mock clinical deployment. Thank you, and I look forward to your questions."*

---

## 🎯 Anticipated Viva Questions & Model Answers

### Q1: Why use a logarithmic aging factor in your priority formula instead of linear aging?
**Answer:**  
*"A linear aging factor ($w_3 \cdot \Delta t$) can cause routine walk-in patients to rapidly overtake newly arriving emergency or high-acuity patients during peak hours. A logarithmic function ($\ln(1 + \Delta t)$) provides concave growth: it rapidly elevates a waiting patient out of zero-priority status, but saturates smoothly so that true clinical emergencies can still jump ahead when clinically necessary. This mathematically prevents infinite starvation while preserving emergency triage integrity."*

### Q2: How does your system handle patient no-shows or when a patient misses their token call?
**Answer:**  
*"SmartQMS implements a soft-deprioritization and recall mechanism. When a doctor calls a token and the patient is not present, the clinician clicks 'Skip Entry'. The token status transitions to `SKIPPED` rather than permanent cancellation. The entry is held in a secondary recall buffer. If the patient arrives within a grace window, the staff can 'Recall' the token, placing them at the next available slot without forcing them to re-register at reception."*

### Q3: What happens if the network drops or the WebSocket disconnects during peak hospital operations?
**Answer:**  
*"The client tier maintains an automatic exponential backoff reconnection strategy. Furthermore, state persistence is maintained in PostgreSQL via atomic transactions. Upon reconnection, the client queries the REST `/api/queue/overview` endpoint to hydrate the latest queue state, ensuring no token or consultation state is lost."*

### Q4: How is your AI Assistant grounded to avoid hallucinating doctor availability or waiting times?
**Answer:**  
*"The Gemini AI assistant does not operate as an unconstrained chatbot. We implement an AI Context Adapter in the backend that fetches live database telemetry—including current queue lengths, active doctor rooms, and department operating hours—and injects this structured JSON context into the system prompt. The LLM is strictly instructed to answer patient navigation and queue queries based solely on this verified live data."*

### Q5: What is the primary focus of Review 2?
**Answer:**  
*"While Review 1 established the literature survey, mathematical formulation, and core working prototype, Review 2 will deliver rigorous empirical validation. We will conduct extensive discrete-event simulation experiments comparing SmartQMS against all four baselines under diverse Poisson arrival rates and conduct concurrency stress testing of the WebSocket architecture."*
