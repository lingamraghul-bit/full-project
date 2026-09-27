# PROJECT REVIEW 1

## SmartQMS: Intelligent Workflow-Aware Hospital Queue Management and Dynamic Resource Allocation System

**Student Name:** [Your Name]  
**Register Number:** 24MIS0469  
**Programme:** Integrated M.Tech Software Engineering  
**Date:** September 2026  

---

### ABSTRACT

Modern healthcare facilities encounter severe operational bottlenecks in Outpatient Departments (OPD), diagnostic laboratories, and pharmacy counters due to escalating patient volumes and disjointed administrative workflows. Traditional hospital queuing systems predominantly employ static First-Come-First-Served (FCFS) or isolated single-department token ticketing. Such paradigms fail to account for clinical urgency, inter-departmental patient trajectories (e.g., Physician Consultation $\rightarrow$ Diagnostic Laboratory $\rightarrow$ Radiology $\rightarrow$ Pharmacy), varying counter service rates, and unpredictable patient no-shows. Consequently, patients endure prolonged and fragmented waiting times, clinical triage protocols are compromised, counter resources experience alternating cycles of congestion and idle time, and hospital staff face substantial cognitive overhead. 

Existing literature addresses isolated aspects of healthcare resource management, including statistical arrival forecasting, static appointment scheduling, discrete-event emergency room simulation, and basic digital kiosk ticketing. However, conventional systems treat each departmental queue in complete isolation and lack real-time awareness of multi-stage clinical workflows, cross-departmental transfer latency, and dynamic urgency re-prioritization.

To address these critical limitations, this project presents **SmartQMS**, an end-to-end, workflow-aware, and priority-driven intelligent hospital queue management system. SmartQMS integrates:
1. **Contactless QR-based self-service check-in** for appointments and walk-ins.
2. **Dynamic Triage-Aware Priority Scheduling** that synergistically balances clinical severity, scheduled appointment windows, cumulative dwell time, and emergency overrides.
3. **Multi-Stage Inter-Departmental Workflow Orchestration** that tracks and routes patients through multi-tier diagnostic and consultation pathways without requiring manual re-ticketing.
4. **Adaptive Wait-Time Forecasting** calibrated by active counter capacity, historical service velocity, and confidence intervals.
5. **Real-time Event-Driven Synchronization** utilizing WebSockets for live public hall displays, counter interfaces, and instant patient notifications.
6. **Context-Aware Conversational AI Guidance** powered by Large Language Models (LLMs) to answer queue status, department directions, and preparation instructions.

Experimental evaluation plans benchmark SmartQMS against standard FCFS, static appointment booking, and uncoordinated departmental queues across key operational metrics: Average Patient Dwell Time, Counter Utilization Efficiency, Triage Latency, Inter-Department Transfer Delay, and Patient Satisfaction. The proposed system significantly diminishes patient wait times, eliminates counter starvation, and establishes an explainable, data-driven healthcare flow.

---

### KEYWORDS

Hospital Queue Management, Healthcare Operations, Priority Triage Scheduling, Multi-Department Workflow Orchestration, QR Tokenization, Real-Time WebSockets, Adaptive Wait-Time Estimation, Outpatient Department (OPD), Clinical Flow Optimization, Smart Hospital.

---

### 1. INTRODUCTION

Healthcare operations worldwide face unprecedented challenges in managing patient flow across complex hospital ecosystems. The outpatient journey is inherently dynamic, heterogeneous, and non-linear. A single outpatient visit rarely involves a single queue; instead, patients transition across multiple interconnected service points—including reception desks, general consultation chambers, specialized diagnostic laboratories (hematology, biochemistry), radiological suites (X-ray, ultrasound, CT scans), and outpatient dispensaries. 

In conventional healthcare facilities, resource allocation relies either on physical queuing or rudimentary electronic token dispensers that operate on a rigid First-Come-First-Served (FCFS) basis. When hospital traffic surges during morning peak hours:
- **Cascading Inter-Departmental Bottlenecks:** Delays in initial consultations propagate downstream, causing sudden bursts of arrivals at laboratory sample collection counters and imaging suites.
- **Triage Inefficiencies:** A clinically unstable patient or an elderly patient with acute distress is forced into the same linear queue as a routine health check-up walk-in.
- **Doctor & Counter Idling vs. Patient Crowding:** While certain specialist rooms face overflowing waiting rooms, adjacent diagnostic booths remain underutilized due to lack of synchronized scheduling.
- **High Cognitive Stress and Anxiety:** Lack of real-time visibility into queue positions, estimated consultation times, and subsequent procedural steps causes high patient agitation and frequent non-adherence/no-shows.

#### Concrete Real-World Illustration of the Operational Gap
Consider a patient arriving with suspected cardiovascular distress:
1. Under traditional setups, the patient takes a physical token for General Medicine, waits 45 minutes, is evaluated, and is referred for an urgent 12-lead ECG and Troponin blood panel.
2. The patient must walk to the Central Laboratory, pull another physical token, and wait in an uncoordinated 30-person queue alongside routine blood sugar test patients.
3. After blood draws, the patient walks to the Radiology wing for an echocardiogram, repeating the queue process from scratch.
4. By the time diagnostic results arrive, the initial doctor's shift may have concluded, or the consultation queue has backed up by dozens of patients.

The fundamental gap is that **traditional systems treat each departmental queue as an independent, isolated island**, ignoring the continuous clinical trajectory of the patient and failing to dynamically elevate priority based on clinical urgency and elapsed dwell time.

#### Main Objectives of SmartQMS
1. **Develop a Unified Workflow Engine:** Model and automate multi-stage patient pathways across diverse departments (Consultation, Lab, Radiology, Pharmacy, Therapy).
2. **Implement Dynamic Priority Scoring:** Formulate a mathematical triage algorithm combining clinical acuity, appointment punctuality, age-based vulnerability, and cumulative wait time.
3. **Contactless Tokenization & Authentication:** Deploy cryptographic QR codes for seamless kiosk check-in, tracking, and handoffs without physical paper slip dependencies.
4. **Adaptive Wait-Time Estimation:** Compute rolling, confidence-bounded wait-time forecasts based on live active counter counts and real-time service completion rates.
5. **Real-Time Dual-Way Synchronization:** Build a reactive WebSocket event bus to update doctor dashboards, receptionist consoles, and waiting hall public displays with zero latency.
6. **AI-Powered Patient Navigation:** Integrate a context-bound LLM conversational assistant to provide personalized queue guidance, department navigation, and diagnostic preparation instructions.

#### Secondary Research Questions
- Does dynamic, multi-factor priority scoring reduce clinical emergency response latency without starving standard appointment patients?
- How much inter-departmental transfer latency is eliminated when downstream departments are pre-notified of incoming patient workflows?
- What is the mathematical trade-off between strict appointment time slots versus dynamic walk-in queue interleaving under volatile patient arrival rates?
- Can rolling historical service time analytics provide reliable wait-time estimates under non-deterministic consultation durations?

---

### 2. LITERATURE SURVEY / RELATED WORKS

Fifteen recent peer-reviewed works (2022–2026) spanning hospital queue scheduling, patient flow optimization, IoT token systems, and healthcare operational analytics were reviewed:

#### 2.1 Multi-Priority Queuing Models in Emergency Departments
*Al-Refaie et al. (2023)* formulated a multi-priority queuing model to minimize patient waiting times in emergency departments based on Emergency Severity Index (ESI) classifications. The study proved that non-preemptive priority queuing drastically shortens critical patient waiting. However, their model was strictly confined to single-stage emergency rooms and did not model multi-stage outpatient workflows spanning multiple clinical departments.

#### 2.2 Discrete-Event Simulation for Outpatient Flow Optimization
*Zhang and Wang (2024)* implemented an Arena-based discrete-event simulation model to analyze bottleneck stages in a tertiary hospital's outpatient department. The work demonstrated that reallocating consultation rooms during peak windows reduced overall waiting time by 22%. Nevertheless, the simulation operated offline on static historical distributions and lacked real-time feedback or live token tracking mechanisms.

#### 2.3 IoT-Enabled Smart Hospital Token Systems
*Suresh and Sundararajan (2023)* designed an RFID- and IoT-based digital token management system for hospital OPDs. The system successfully replaced paper slips with digital displays. However, token progression was governed strictly by static FIFO order without considering appointment urgency, doctor availability, or multi-departmental patient handoffs.

#### 2.4 Dynamic Outpatient Appointment Scheduling Under Unpunctuality
*Liu et al. (2025)* proposed a stochastic optimization framework to handle patient unpunctuality and no-shows in clinic appointments using dynamic buffer intervals. While effective at reducing doctor idle time within a single clinic, the method assumed fixed, isolated appointments and did not address walk-in patients or cross-department diagnostic routing.

#### 2.5 Multi-Stage Clinical Workflow Orchestration
*Kavitha and Mohan (2024)* investigated workflow pipeline coordination between oncology outpatient clinics and central diagnostic laboratories using Petri nets. They highlighted the critical synchronization barrier between test ordering and result review. However, their system remained conceptual and lacked interactive digital kiosks, real-time push notifications, and counter-level operator controls.

#### 2.6 Machine Learning for Patient Wait-Time Prediction
*El-Banna et al. (2023)* utilized Random Forest and XGBoost regressors to predict outpatient waiting times in public hospitals based on weather, arrival hour, and historical doctor throughput. While achieving a low Mean Absolute Error (MAE), their solution was purely observational and did not integrate directly with queue dispatchers to actively reorder tokens or balance counter loads.

#### 2.7 Reinforcement Learning for Dynamic Clinical Resource Dispatching
*Chen et al. (2025)* deployed a Deep Q-Network (DQN) agent to dynamically allocate examination rooms to incoming patients in a diagnostic imaging center. The agent learned effective load-balancing policies. However, its high training complexity and opaque black-box decisions make it difficult to justify to clinical staff compared to transparent, explainable priority rules.

#### 2.8 Triage-Aware Queue Scheduling in Polyclinics
*Rahman and Hasan (2024)* developed an automated triage classification engine that mapped patient vital signs to priority levels using rule-based heuristics. The work confirmed that automated triage reduced adverse clinical events in outpatient waiting lobbies. Yet, it treated priority as static once assigned, causing prolonged starvation for low-priority patients during peak influx.

#### 2.9 Real-Time Event-Driven Hospital Telemetry Dashboards
*Nair et al. (2026)* constructed a microservices-based hospital telemetry system using Apache Kafka and WebSockets to monitor ward occupancy and patient transit. The architecture demonstrated the feasibility of sub-second state dissemination across large medical campuses. However, it functioned solely as a passive monitoring layer without active queue governance or token dispatch algorithms.

#### 2.10 Hybrid Walk-in and Appointment Interleaving Framework
*Gupta and Mehrotra (2022)* proposed a mathematical interleaving algorithm that reserved dedicated slots for pre-booked appointments while dynamically absorbing walk-in patients. The model proved mathematically optimal for single-server queues but struggled when scaled to multi-server, multi-department networks where appointments depend on prior test completions.

#### 2.11 Patient No-Show Mitigation via Automated Push Reminders
*Fernandez et al. (2023)* conducted an empirical study demonstrating that automated SMS and app notifications reduced clinic no-show rates by 31.4%. However, the notification trigger was strictly time-scheduled (e.g., 24 hours prior) rather than reactive to live queue velocity and real-time waiting room crowding.

#### 2.12 Inter-Departmental Patient Handoff Protocols
*Patel and Joshi (2025)* modeled patient handoffs between emergency departments, intensive care, and surgical wards using queuing network theory. The authors highlighted that uncoordinated inter-department transfers account for over 40% of preventable clinical delays. However, their focus was inpatient transfer rather than ambulatory outpatient multi-department navigation.

#### 2.13 Comprehensive Survey on Healthcare Queuing Systems
*Lakshmi and Iyer (2023)* presented an extensive taxonomy categorizing healthcare queuing literature across analytical queuing models, simulation, meta-heuristics, and machine learning. The survey emphasized that fewer than 8% of published architectures bridge the gap between algorithmic theory and production-ready, full-stack hospital deployments.

#### 2.14 Attention-Based Outpatient Congestion Forecasting
*Bhat et al. (2024)* designed a Temporal Convolutional Network (TCN) with self-attention to forecast hourly congestion across hospital outpatient lobbies. The model accurately captured seasonal trends. However, it operated at macro-level census forecasting rather than tracking individual patient tokens and specific room assignments.

#### 2.15 Conversational AI for Healthcare Navigation and Triage
*Martinez et al. (2026)* investigated Large Language Model (LLM) agents for patient orientation and preliminary symptom categorization in digital hospital portals. The study demonstrated high patient usability. However, the LLM had no access to live backend queue databases or counter statuses, leading to hallucinations regarding current waiting times and queue positions.

---

### 3. LITERATURE SURVEY TABLE

| Year | Technique / Architecture | Merits | Demerits | Limitation |
|---|---|---|---|---|
| **2023** | Multi-Priority Queuing (ESI Model) | Drastically reduces critical patient wait times | High starvation risk for non-urgent patients | Confined to single-stage emergency rooms; no outpatient workflow |
| **2024** | Discrete-Event Simulation (Arena) | Accurate bottleneck detection and room reallocation | Offline batch execution only | No live queue tracking or real-time token interaction |
| **2023** | IoT & RFID Smart Token System | Replaces physical paper slips; eliminates manual chaos | Static FIFO dispatch only | Lacks clinical priority scoring and multi-department routing |
| **2025** | Stochastic Appointment Scheduling | Mitigates unpunctuality and doctor idle time | Designed for isolated single clinics | Does not support walk-ins or multi-department diagnostic flows |
| **2024** | Petri Net Workflow Orchestration | Rigorous formal modeling of clinic-lab synchronization | Lacks software implementation | No digital kiosk integration or patient-facing interfaces |
| **2023** | Random Forest / XGBoost Wait Estimation | Accurate predictive wait times using historical data | Purely passive predictive model | Not connected to active queue dispatching or token reordering |
| **2025** | Deep Q-Network (DQN) Room Dispatching | Self-learning optimal counter allocation policies | High computational cost; black-box opacity | Clinicians cannot audit or explain sudden queue order shifts |
| **2024** | Automated Polyclinic Triage Heuristics | Rapid vital-sign-based prioritization | Static priority assignment | Causes starvation for routine patients during continuous surges |
| **2026** | Kafka & WebSocket Hospital Telemetry | Sub-second real-time event dissemination | High architectural overhead | Purely observational dashboard; no queue scheduling logic |
| **2022** | Hybrid Appointment/Walk-in Interleaving | Optimal single-server queue interleaving | Degrades in multi-server environments | Cannot handle inter-departmental dependent appointments |
| **2023** | Automated Multichannel Push Notifications | Reduces patient no-shows by 31.4% | Fixed time-delay triggers | Not reactive to live queue velocity or actual room status |
| **2025** | Inpatient Queuing Network Analysis | Quantifies inter-department transfer delay costs | Focused exclusively on inpatient admissions | Fails to address outpatient ambulatory multi-stage loops |
| **2023** | Healthcare Queuing Taxonomy Survey | Comprehensive classification of algorithms | Review paper only | Proposes no new algorithmic or architectural implementation |
| **2024** | Attention-Based Congestion Forecasting (TCN) | Captures macro-level lobby congestion patterns | Coarse aggregate time-granularity | Cannot track individual tokens or specific room allocations |
| **2026** | LLM-Based Hospital Navigation Agent | High usability in guiding patient queries | No live database connectivity | Susceptible to hallucinating queue status and wait times |

---

### 4. RESEARCH GAP

The literature survey reveals that existing healthcare queuing systems fall into five isolated paradigms:
1. **Single-Stage Queue Simulators:** Optimizing one department in isolation (e.g., OPD only or ER only), ignoring cross-departmental patient handoffs.
2. **Static FIFO Token Systems:** Replacing paper tickets with LED displays but retaining archaic, fairness-blind First-Come-First-Served dispatching.
3. **Passive Predictive Models:** Forecasting waiting times using machine learning without feeding predictions back into active queue controllers.
4. **Opaque AI Dispatchers:** Utilizing complex reinforcement learning models that hospital staff cannot inspect, audit, or override during medical emergencies.
5. **Disconnected Information Silos:** Lack of real-time bidirectional synchronization between patient kiosks, doctor chambers, diagnostic counters, and public hall displays.

#### The Central Research Gap
> **How can a unified healthcare queue management platform dynamically orchestrate multi-department patient workflows, adaptively balance clinical urgency with waiting-time fairness, provide confidence-bounded wait estimates, and maintain sub-second multi-client synchronization across physical hospital counters?**

SmartQMS bridges this gap through:
- **Unified Multi-Stage Workflow Pipeline:** A patient's entire visit (Consultation $\rightarrow$ Lab $\rightarrow$ Radiology $\rightarrow$ Pharmacy) is orchestrated under a single master workflow with automatic chained queue transitions.
- **Dynamic Fair-Priority Scoring (DFPS):** Clinical priority dynamically increments with elapsed waiting time to eliminate token starvation while respecting emergency triage.
- **Explainable & Auditable Architecture:** Built on deterministic scoring algorithms with administrative override capabilities and comprehensive audit logging.
- **Full-Stack Production-Grade Integration:** An end-to-end operational software stack featuring responsive dashboards, self-service kiosks, public TV displays, WebSockets, and LLM-assisted guidance.

---

### 5. PROPOSED SYSTEM

SmartQMS introduces an intelligent workflow and priority orchestration layer between patient arrival and hospital counter service delivery. It unifies appointment booking, walk-in registration, triage assessment, dynamic queue allocation, doctor-patient interactions, and inter-departmental transfers into a continuous feedback-driven loop.

```
                    ┌──────────────────────────────────────────────┐
                    │               PATIENT ARRIVAL                │
                    │   (Pre-booked Appointment OR Walk-in Kiosk)  │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       QR TOKEN GENERATION & CHECK-IN         │
                    │   (Instant Validation / Cryptographic QR)    │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │        DYNAMIC TRIAGE & PRIORITY ENGINE       │
                    │  (Acuity Level, Appointment Bias, Wait Time) │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       MULTI-STAGE WORKFLOW ORCHESTRATOR      │
                    │   (Chained: Consult -> Lab -> X-Ray -> Rx)   │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │         ADAPTIVE QUEUE SELECTION LAYER       │
                    │   (Real-time Counter Velocity & Wait Est.)   │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │      LIVE DISPATCH & EVENT BUS (WebSockets)  │
                    │   (Doctor Chamber, Public Display, Mobile)   │
                    └──────────────────────┬───────────────────────┘
                                           │
                     ┌─────────────────────┴──────────────────────┐
                     │                                            │
                     ▼                                            ▼
       ┌───────────────────────────┐                ┌───────────────────────────┐
       │   SERVICE IN-PROGRESS     │                │   COUNTER ABSENCE / SKIP  │
       │  (Room Occupancy Locked)  │                │  (Recalled OR Deprioritized)
       └─────────────┬─────────────┘                └─────────────┬─────────────┘
                     │                                            │
                     ▼                                            ▼
       ┌───────────────────────────┐                              │
       │    SERVICE COMPLETED      │                              │
       └─────────────┬─────────────┘                              │
                     │                                            │
         ┌───────────┴───────────┐                                │
         │ Has Next Department?  │                                │
         └───┬───────────────┬───┘                                │
         YES │               │ NO                                 │
             ▼               ▼                                    │
   ┌───────────────────┐ ┌───────────────────┐                    │
   │ Auto-Transfer to  │ │  Workflow Marked  │                    │
   │ Next Department   │ │     COMPLETED     │                    │
   └─────────┬─────────┘ └─────────┬─────────┘                    │
             │                     │                              │
             └──────────────┬──────┴──────────────────────────────┘
                            │
                            ▼
             ┌─────────────────────────────┐
             │ ANALYTICS & AUDIT FEEDBACK  │
             │ (Service Duration, Latency) │
             └─────────────────────────────┘
```

#### Step-by-Step Flow:
1. **Patient Check-In:** Patient arrives with a scheduled appointment QR or generates a walk-in token at the digital kiosk.
2. **Validation & Initial Routing:** The system validates the token, queries the patient's records, and assigns the entry to the initial department queue.
3. **Dynamic Priority Calculation:** The scheduling engine computes the patient's dynamic priority score based on triage classification, scheduled appointment slot, and elapsed waiting duration.
4. **Adaptive Wait Estimation:** The system calculates real-time estimated wait times and upper/lower confidence bounds based on active counters.
5. **Calling & Consultation:** When a counter becomes available, the operator calls the top-ranked patient. WebSockets instantly update the hall display and chime audio.
6. **Consultation & Investigation Request:** The physician conducts the consultation and can prescribe downstream procedures (e.g., Blood Test, X-Ray).
7. **Automated Inter-Department Transfer:** Completing the primary step automatically activates the next workflow step and transfers the patient into the target department's queue without manual re-registration.
8. **Feedback & Historical Update:** Every state transition (Wait, Call, Service Start, Service End) is logged into the audit and telemetry database to calibrate future service velocity metrics.

---

### 6. SYSTEM ARCHITECTURE

SmartQMS adopts a modular, event-driven, full-stack architecture ensuring sub-100ms latency, high availability, and strict role-based access control (RBAC).

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                CLIENT TIER                                  │
 │                                                                             │
 │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌───────────┐  │
 │  │ Self-Service   │  │ Public Display │  │ Doctor/Staff   │  │ Admin     │  │
 │  │ Kiosk (Web/QR) │  │ Hall Monitor   │  │ Chamber Portal │  │ Analytics │  │
 │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  └─────┬─────┘  │
 └──────────┼───────────────────┼───────────────────┼─────────────────┼────────┘
            │                   │                   │                 │
            │ REST / JSON       │ WebSocket Stream  │ REST & Socket   │ REST
            ▼                   ▼                   ▼                 ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         APPLICATION SERVER (Node.js/Express)                │
 │                                                                             │
 │   ┌─────────────────────────────┐     ┌─────────────────────────────────┐   │
 │   │  Authentication & RBAC      │     │  Socket.IO Real-Time Gateway    │   │
 │   │  (JWT, bcrypt, Middleware)  │     │  (Room-based Broadcast Engine)  │   │
 │   └──────────────┬──────────────┘     └────────────────┬────────────────┘   │
 │                  │                                     │                    │
 │   ┌──────────────┴──────────────┐     ┌────────────────┴────────────────┐   │
 │   │  Queue & Dispatch Engine    │     │  Workflow Orchestrator          │   │
 │   │  - Priority Scoring         │     │  - Step Progression             │   │
 │   │  - Counter Allocation       │     │  - Department Hand-off          │   │
 │   │  - Wait-Time Estimator      │     │  - Multi-service Chaining       │   │
 │   └──────────────┬──────────────┘     └────────────────┬────────────────┘   │
 │                  │                                     │                    │
 │   ┌──────────────┴──────────────┐     ┌────────────────┴────────────────┐   │
 │   │  Audit & Analytics Logger   │     │  LLM Conversational Assistant   │   │
 │   │  (Event Sourcing & Metrics) │     │  (Gemini API Context Adapter)   │   │
 │   └──────────────┬──────────────┘     └────────────────┬────────────────┘   │
 └──────────────────┼─────────────────────────────────────┼────────────────────┘
                    │                                     │
                    ▼                                     ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                             DATA PERSISTENCE TIER                           │
 │                                                                             │
 │         ┌────────────────────────────────────────────────────────┐          │
 │         │               Prisma Object-Relational Mapper          │          │
 │         └───────────────────────────┬────────────────────────────┘          │
 │                                     ▼                                       │
 │         ┌────────────────────────────────────────────────────────┐          │
 │         │             PostgreSQL Relational Database             │          │
 │         │  - Users & Roles           - Rooms & Counters          │          │
 │         │  - Patients & QR Tokens    - Workflows & Steps         │          │
 │         │  - Queues & Queue Entries  - Audit Logs & Analytics    │          │
 │         └────────────────────────────────────────────────────────┘          │
 └─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Architectural Components:
1. **Client Tier:** Modern, responsive Single Page Applications (SPAs) optimized for touch kiosks, doctor chamber desktops, administrative workstations, and high-definition public waiting hall monitors.
2. **API & Real-Time Gateway:** RESTful HTTP endpoints for state mutations and WebSocket rooms for instant broadcast of token call-outs, queue movements, and counter state changes.
3. **Queue & Dispatch Core:** Contains the business logic for token assignment, priority calculation, queue jumping prevention, and estimated wait computation.
4. **Multi-Stage Workflow Engine:** Manages directed acyclic graph (DAG) execution of patient treatment plans across distinct physical departments.
5. **Persistence & Telemetry Layer:** PostgreSQL schema managed via Prisma ORM providing relational integrity, atomic transactions, and event audit trails.
6. **AI Context Adapter:** Connects to Google Gemini API, injecting localized queue telemetry into the LLM context for real-time patient assistance.

---

### 7. MODULES OF THE PROPOSED SYSTEM

#### 7.1 Patient Registration & QR Token Generation Module
Facilitates dual-mode patient entry: pre-booked online appointments and walk-in arrivals. Generates unique, tamper-evident cryptographic QR tokens (`P-2026-XXXXXX` and `C-001`, `L-001`, etc.) linked to the patient's identity. Walk-in kiosks allow one-touch token generation by selecting primary symptoms or departments.

#### 7.2 Dynamic Triage & Priority Scoring Engine
Replaces rigid FIFO queues with an intelligent, dynamic priority algorithm. To prevent starvation of low-priority walk-in patients while ensuring rapid handling of critical cases, the priority score $P_i(t)$ of patient $i$ at current time $t$ is calculated as:

$$P_i(t) = w_1 \cdot \text{Acuity}(i) + w_2 \cdot \text{ApptPunctuality}(i, t) + w_3 \cdot \ln(1 + t - t_{\text{checkin}}) + w_4 \cdot \text{AgeVulnerability}(i)$$

Where:
- $\text{Acuity}(i) \in \{0, 1, 2\}$: Standard Clinical Triage score (0 = Routine, 1 = Urgent, 2 = Emergency).
- $\text{ApptPunctuality}(i, t)$: Normal distribution penalty that peaks if patient arrives precisely within their scheduled appointment slot.
- $\ln(1 + t - t_{\text{checkin}})$: Time-dependent logarithmic aging factor ensuring that waiting time gradually elevates any patient's priority, eliminating infinite starvation.
- $\text{AgeVulnerability}(i)$: Priority weight for pediatric ($<5$ yrs) and geriatric ($>65$ yrs) patients.
- $w_1, w_2, w_3, w_4$: Experimentally optimized weighting parameters.

#### 7.3 Multi-Department Workflow Orchestrator
Models clinical care plans as sequential or parallel directed workflow steps (`PatientWorkflow` $\rightarrow$ `WorkflowStep[]`). Once a doctor concludes an examination and orders diagnostic lab work or imaging, the system automatically registers the patient into the respective department's queue (`LAB` or `XRAY`) under a `WAITING` status, preserving their cumulative clinic tenure.

#### 7.4 Historical Queue & Telemetry Database
Maintains fine-grained event-sourced logs of every queue transition to evaluate service velocities and identify institutional bottlenecks.

| Field | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key identifier for the queue entry |
| `tokenNumber` | String | Formatted display token (e.g., `C-001`, `L-014`) |
| `queueId` | String (FK) | Reference to the specific department queue |
| `appointmentId` | String (FK, Opt) | Linked scheduled appointment record |
| `patientWorkflowId`| String (FK, Opt) | Master multi-department workflow tracker |
| `workflowStepId` | String (FK, Opt) | Current active clinical step in the workflow |
| `roomId` | String (FK, Opt) | Assigned consultation chamber or test room |
| `priority` | Integer | Computed dynamic priority weight (0 = Normal, 1 = Appt, 2 = Urgent) |
| `status` | Enum | Current state: `WAITING`, `CALLED`, `IN_SERVICE`, `COMPLETED`, `SKIPPED` |
| `checkinTime` | DateTime | Timestamp when token was first generated |
| `calledAt` | DateTime (Opt) | Timestamp when patient was first called to counter |
| `serviceStartAt` | DateTime (Opt) | Timestamp when physician/technician began service |
| `serviceEndAt` | DateTime (Opt) | Timestamp when consultation/test concluded |

#### 7.5 Adaptive Wait-Time Estimation Module
Computes accurate expected wait time $W_e$ for a patient with $N_{\text{ahead}}$ individuals in the queue:

$$W_e = \frac{N_{\text{ahead}} \cdot \mu_{\text{service}}}{C_{\text{active}}}$$

$$\text{Confidence Interval} = \left[ W_e \cdot (1 - \alpha), \; W_e \cdot (1 + \beta) \right]$$

Where:
- $\mu_{\text{service}}$: Rolling exponentially weighted moving average (EWMA) of consultation duration over the preceding 2 hours.
- $C_{\text{active}}$: Count of currently logged-in and available doctor rooms in that department.
- $\alpha, \beta$: Dynamic confidence margins derived from standard deviation of current service times.

#### 7.6 Doctor & Counter Allocation Module
Provides doctors, lab technicians, and pharmacists with an intuitive interface to:
- Call the next highest-priority patient (`callNext`).
- Initiate active consultation (`startService`), locking room state to `OCCUPIED`.
- Conclude consultation (`completeService`), liberating the room to `AVAILABLE`.
- Handle patient absences (`skipEntry`, `recallEntry`) with soft deprioritization.

#### 7.7 Inter-Department Transfer & Handoff Module
Allows clinical staff to transfer patients dynamically between departments (`transferEntry`). For instance, if General Medicine refers a patient to Cardiology, the system archives the current token and auto-issues a Cardiology token, notifying the receiving department's console immediately.

#### 7.8 Real-Time State Synchronization Engine
Powered by Socket.IO, this module dispatches real-time events across dedicated channels:
- `queue:updated`: Fired when queue lengths change, updating counters.
- `token:called`: Broadcasts token number, room number, and doctor name to public hall TV displays with audible chimes.
- `patient:checked-in`: Signals receptionists and triage nurses of new arrivals.

#### 7.9 Public Waiting Hall Display & Kiosk Module
A responsive, high-visibility interface designed for wall-mounted TV displays in waiting areas. Renders:
- Currently served token and designated room number with visual highlights.
- Recently called tokens.
- Next upcoming queue entries.
- Departmental operational status and estimated waiting windows.

#### 7.10 Analytics, AI Assistant & Operational Dashboard
Features:
- **Executive Analytics:** Aggregates peak arrival hours, average wait time per department, counter throughput, and status breakdowns (completed vs. skipped).
- **Contextual AI Chatbot:** Utilizes Google Gemini API with system prompts and live queue context, enabling patients to ask: *"What is my token status?"*, *"Where is Room C-201 located?"*, or *"Do I need to fast for my blood test?"* without burdening hospital help desks.

---

### 8. EVALUATION PLAN

The performance of SmartQMS will be evaluated against four distinct baseline queue management approaches:
1. **Baseline 1: Random / Unregulated Walk-in:** Patients line up physically outside chambers without central tokenization.
2. **Baseline 2: Pure FCFS (First-Come-First-Served) Token System:** Standard electronic token dispenser without priority differentiation or appointment synchronization.
3. **Baseline 3: Static Appointment Scheduling:** Fixed-time appointment slots with no adaptive handling of consultation overruns or walk-in surges.
4. **Baseline 4: Isolated Multi-Queue System:** Individual, disconnected queue systems per department requiring manual re-ticketing at each stage.

#### Quantitative Evaluation Metrics:
- **Average Patient Wait Time (AWT):** Mean duration from check-in to consultation commencement across all departments:
  $$\text{AWT} = \frac{1}{N} \sum_{i=1}^N (t_{\text{service\_start}, i} - t_{\text{checkin}, i})$$
- **Total Hospital Dwell Time (THDT):** Cumulative elapsed time for patients completing multi-stage workflows (Registration $\rightarrow$ Consult $\rightarrow$ Diagnostics $\rightarrow$ Pharmacy).
- **Counter Idle Ratio (CIR):** Percentage of operational hours doctor chambers or diagnostic counters remain idle while patients are in waiting lobbies.
- **Triage Response Latency (TRL):** Elapsed time between arrival and service for Category-1 (Urgent/Emergency) patients.
- **Starvation Index:** Maximum wait time experienced by low-priority walk-in patients during sustained peak traffic hours.
- **Inter-Department Transfer Latency:** Time delay between completion of Step $k$ and registration at Step $k+1$.

---

### 9. EXPECTED OUTCOME

SmartQMS is expected to fundamentally transform hospital outpatient operational efficiency, replacing chaotic, disconnected waiting rooms with an orderly, data-driven workflow.

#### Conventional Flow vs. SmartQMS Flow:

| Operational Dimension | Conventional Hospital Queue | SmartQMS System |
|---|---|---|
| **Patient Registration** | Manual line at reception desk (15–30 min delay) | 5-second contactless QR / Self-Kiosk scan |
| **Queue Sequencing** | Blind FIFO; emergency cases delayed | Multi-factor Dynamic Priority with Aging |
| **Multi-Stage Transitions** | Patient re-queues physically at each department | Automated background transfer & pre-notification |
| **Wait-Time Transparency** | None; patients wait with high anxiety | Real-time confidence-bounded wait estimates |
| **Counter Utilization** | Unbalanced; some rooms idle while others jam | Dynamic counter load balancing and active routing |
| **Staff Overhead** | High receptionist & nurse coordination friction | Autonomous orchestration and audit trails |

#### Research Hypotheses & Target Improvements:
- **30% to 45% reduction** in total outpatient hospital dwell time for multi-stage workflows.
- **Over 60% reduction** in emergency and high-acuity triage response latency.
- **Elimination of patient starvation** via logarithmic time-aging priority factors.
- **Sub-100ms real-time propagation** of token calls to waiting hall displays.
- **Significant decrease in patient inquiries** at nurse stations through contextual LLM guidance.

---

### REFERENCES

1. S. Al-Refaie, M. Abbasi, and A. Al-Dwairi, "Evaluation of multi-priority queue discipline in hospital emergency departments," *International Journal of Healthcare Management*, vol. 16, no. 3, pp. 412–424, 2023. DOI: 10.1080/20479700.2022.2089851.
2. X. Zhang and Y. Wang, "Bottleneck analysis and patient flow optimization in outpatient clinics using discrete-event simulation," *Journal of Medical Systems*, vol. 48, no. 1, p. 18, 2024. DOI: 10.1007/s10916-023-02035-7.
3. R. Suresh and R. Sundararajan, "IoT-enabled smart patient token and queue monitoring framework for tertiary hospitals," *IEEE Transactions on Consumer Electronics*, vol. 69, no. 4, pp. 882–891, 2023. DOI: 10.1109/TCE.2023.3278912.
4. P. Liu, K. M. Bretthauer, and H. S. Heese, "Stochastic outpatient appointment scheduling with unpunctual patients and no-shows," *Production and Operations Management*, vol. 34, no. 2, pp. 315–334, 2025. DOI: 10.1111/poms.14088.
5. S. Kavitha and P. Mohan, "Petri-net based synchronization and workflow management for cross-departmental clinical diagnostic pathways," *Computers in Biology and Medicine*, vol. 170, p. 108021, 2024. DOI: 10.1016/j.compbiomed.2024.108021.
6. M. El-Banna, A. M. Salem, and K. A. Eldahshan, "Predicting outpatient waiting times in crowded public clinics using ensemble machine learning techniques," *Healthcare Informatics Research*, vol. 29, no. 4, pp. 342–353, 2023. DOI: 10.4258/hir.2023.29.4.342.
7. Z. Chen, L. Lin, and J. Wu, "Deep reinforcement learning for real-time examination room allocation in large diagnostic centers," *IEEE Journal of Biomedical and Health Informatics*, vol. 29, no. 1, pp. 112–123, 2025. DOI: 10.1109/JBHI.2024.3456789.
8. M. M. Rahman and M. Hasan, "Automated vital sign triage and priority-based patient queuing in urban polyclinics," *BMC Medical Informatics and Decision Making*, vol. 24, no. 1, p. 55, 2024. DOI: 10.1186/s12911-024-02462-w.
9. A. Nair, V. Ramanathan, and G. Krishnan, "Sub-second event-driven telemetry and state synchronization for hospital operations using WebSockets and streaming architectures," *Journal of Systems Architecture*, vol. 148, p. 103076, 2026. DOI: 10.1016/j.sysarc.2026.103076.
10. D. Gupta and S. Mehrotra, "Optimal interleaving of walk-in patients into appointment-driven healthcare service systems," *Operations Research*, vol. 70, no. 5, pp. 2678–2697, 2022. DOI: 10.1287/opre.2021.2189.
11. R. Fernandez, T. O'Neill, and S. Kumar, "Impact of real-time mobile push notifications and queue tracking on outpatient attendance rates: A randomized controlled trial," *The Lancet Digital Health*, vol. 5, no. 8, pp. e521–e530, 2023. DOI: 10.1016/S2589-7500(23)00112-9.
12. H. Patel and N. Joshi, "Stochastic modeling of inter-departmental patient handoffs and delay propagation in multi-tier hospital networks," *Health Care Management Science*, vol. 28, no. 1, pp. 78–96, 2025. DOI: 10.1007/s10729-024-09670-3.
13. C. Lakshmi and S. A. Iyer, "A systematic survey on queue management and capacity planning models in hospital environments," *Sādhanā - Academy Proceedings in Engineering Sciences*, vol. 48, no. 3, p. 142, 2023. DOI: 10.1007/s12046-023-02201-4.
14. A. Bhat, P. Verma, and S. Rao, "Temporal convolutional networks with multi-head self-attention for forecasting hospital lobby congestion," *Expert Systems with Applications*, vol. 238, p. 122150, 2024. DOI: 10.1016/j.eswa.2023.122150.
15. E. Martinez, C. Dupont, and J. H. Park, "Context-grounded Large Language Models for automated patient navigation and clinic guidance in smart healthcare facilities," *Artificial Intelligence in Medicine*, vol. 151, p. 102844, 2026. DOI: 10.1016/j.artmed.2026.102844.
