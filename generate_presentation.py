import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # Blank slide

    # Color Palette - Professional Medical / Tech Dark Theme
    BG_DARK = RGBColor(15, 23, 42)       # Slate 900
    CARD_BG = RGBColor(30, 41, 59)       # Slate 800
    CARD_BORDER = RGBColor(51, 65, 85)   # Slate 700
    PRIMARY = RGBColor(14, 165, 233)     # Sky 500 / Cyan
    SECONDARY = RGBColor(16, 185, 129)   # Emerald 500 / Green
    ACCENT = RGBColor(245, 158, 11)      # Amber 500
    TEXT_LIGHT = RGBColor(248, 250, 252) # Slate 50
    TEXT_MUTED = RGBColor(148, 163, 184) # Slate 400
    WHITE = RGBColor(255, 255, 255)
    LIGHT_BG = RGBColor(241, 245, 249)

    def set_slide_bg(slide, color=BG_DARK):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="PROJECT REVIEW 1 • 24MIS0469"):
        # Category / breadcrumb
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf = cat_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = PRIMARY

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.65))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = tf_t.margin_top = tf_t.margin_right = tf_t.margin_bottom = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_LIGHT

    def add_card(slide, left, top, width, height, title=None, title_color=PRIMARY, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1)
        else:
            card.line.fill.background()
        
        if title:
            tb = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), Inches(0.45))
            tf = tb.text_frame
            tf.word_wrap = True
            tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(14)
            p.font.bold = True
            p.font.color.rgb = title_color
            
        return card

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s1)

    # Accent decorative top bar
    bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), prs.slide_width, Inches(0.1))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PRIMARY
    bar.line.fill.background()

    # Badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.2), Inches(3.2), Inches(0.4))
    badge.fill.solid()
    badge.fill.fore_color.rgb = CARD_BG
    badge.line.color.rgb = PRIMARY
    tb_b = s1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(3.2), Inches(0.4))
    p = tb_b.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "PROJECT REVIEW 1 • CAPSTONE"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = PRIMARY

    # Title
    t_box = s1.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.7), Inches(1.8))
    tf = t_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "SmartQMS"
    p.font.size = Pt(44)
    p.font.bold = True
    p.font.color.rgb = WHITE

    p2 = tf.add_paragraph()
    p2.text = "Intelligent Workflow-Aware Hospital Queue Management & Dynamic Resource Allocation System"
    p2.font.size = Pt(20)
    p2.font.color.rgb = PRIMARY
    p2.space_before = Pt(8)

    # Subtitle / Summary Card
    add_card(s1, Inches(0.8), Inches(3.8), Inches(11.7), Inches(1.4), title="Project Core Synopsis", title_color=SECONDARY)
    syn_box = s1.shapes.add_textbox(Inches(1.0), Inches(4.35), Inches(11.3), Inches(0.75))
    tf = syn_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "An end-to-end, multi-department hospital queuing platform integrating dynamic triage priority scoring, automated inter-departmental care pathways (Consultation -> Lab -> Radiology -> Pharmacy), sub-second WebSocket synchronization, and context-grounded AI guidance."
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_LIGHT

    # Metadata Cards (Student, Guide, Review)
    m1 = add_card(s1, Inches(0.8), Inches(5.45), Inches(3.7), Inches(1.4))
    tb = s1.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(3.3), Inches(1.1))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "CANDIDATE DETAILS"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p2 = tf.add_paragraph()
    p2.text = "Register No: 24MIS0469"
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = WHITE
    p3 = tf.add_paragraph()
    p3.text = "Integrated M.Tech Software Engineering"
    p3.font.size = Pt(11)
    p3.font.color.rgb = TEXT_MUTED

    m2 = add_card(s1, Inches(4.8), Inches(5.45), Inches(3.7), Inches(1.4))
    tb = s1.shapes.add_textbox(Inches(5.0), Inches(5.6), Inches(3.3), Inches(1.1))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "REVIEW STAGE"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = SECONDARY
    p2 = tf.add_paragraph()
    p2.text = "Project Review - 1"
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = WHITE
    p3 = tf.add_paragraph()
    p3.text = "Literature Survey & Architecture Design"
    p3.font.size = Pt(11)
    p3.font.color.rgb = TEXT_MUTED

    m3 = add_card(s1, Inches(8.8), Inches(5.45), Inches(3.7), Inches(1.4))
    tb = s1.shapes.add_textbox(Inches(9.0), Inches(5.6), Inches(3.3), Inches(1.1))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "TECHNOLOGY DEMO"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = ACCENT
    p2 = tf.add_paragraph()
    p2.text = "Full-Stack Prototype"
    p2.font.size = Pt(14)
    p2.font.bold = True
    p2.font.color.rgb = WHITE
    p3 = tf.add_paragraph()
    p3.text = "React 18 + Node.js + Socket.IO + PostgreSQL"
    p3.font.size = Pt(11)
    p3.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 2: Problem Statement & Clinical Challenges
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s2)
    add_header(s2, "Problem Statement & Clinical Bottlenecks in Outpatient Departments")

    # 3 Column Cards
    col_w = Inches(3.7)
    gap = Inches(0.3)
    top_pos = Inches(1.6)
    card_h = Inches(5.2)

    # Card 1: The Bottlenecks
    add_card(s2, Inches(0.8), top_pos, col_w, card_h, title="Operational Pain Points", title_color=PRIMARY)
    tb = s2.shapes.add_textbox(Inches(1.0), top_pos + Inches(0.65), col_w - Inches(0.4), card_h - Inches(0.8))
    tf = tb.text_frame
    tf.word_wrap = True
    points1 = [
        ("Static FCFS Queuing:", "Conventional systems treat all arrivals equally; urgent cases wait behind routine wellness checks."),
        ("Departmental Silos:", "Consultation, Diagnostic Lab, Radiology, and Pharmacy operate disconnected queues."),
        ("Cascading Delays:", "Delays in OPD consultation cause sudden unannounced surges at blood sample counters and imaging rooms."),
        ("No-Shows & Volatility:", "Unpunctual arrivals and patient no-shows cause unpredictability and counter starvation.")
    ]
    for title, desc in points1:
        p = tf.add_paragraph()
        p.text = f"• {title} "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE
        p2 = tf.add_paragraph()
        p2.text = f"  {desc}"
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(8)

    # Card 2: Clinical Impact
    add_card(s2, Inches(0.8) + col_w + gap, top_pos, col_w, card_h, title="Clinical & Patient Impact", title_color=ACCENT)
    tb = s2.shapes.add_textbox(Inches(1.0) + col_w + gap, top_pos + Inches(0.65), col_w - Inches(0.4), card_h - Inches(0.8))
    tf = tb.text_frame
    tf.word_wrap = True
    points2 = [
        ("Compromised Triage:", "Acute distress patients (chest pain, acute pediatric fever) face avoidable, dangerous delays."),
        ("Excessive Dwell Time:", "Patients spend 3-5 hours on multi-department visits due to repeated manual check-ins."),
        ("Resource Imbalance:", "Specialist doctors sit idle waiting for delayed patients while nearby diagnostic queues overflow."),
        ("Patient Frustration:", "Zero visibility into queue progress or estimated wait times creates severe lobby crowding and anxiety.")
    ]
    for title, desc in points2:
        p = tf.add_paragraph()
        p.text = f"• {title} "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE
        p2 = tf.add_paragraph()
        p2.text = f"  {desc}"
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(8)

    # Card 3: Real World Case
    add_card(s2, Inches(0.8) + (col_w + gap)*2, top_pos, col_w, card_h, title="Real-World Trajectory Gap", title_color=SECONDARY)
    tb = s2.shapes.add_textbox(Inches(1.0) + (col_w + gap)*2, top_pos + Inches(0.65), col_w - Inches(0.4), card_h - Inches(0.8))
    tf = tb.text_frame
    tf.word_wrap = True
    steps = [
        ("Step 1: OPD Arrival", "Takes paper slip, waits 50 mins in General Medicine."),
        ("Step 2: Lab Referral", "Doctor orders urgent ECG & Troponin; patient walks to Lab."),
        ("Step 3: Disconnected Queue", "Patient takes 2nd paper token, joins 30-person queue with routine fasting tests."),
        ("Step 4: Imaging / X-Ray", "Waits in 3rd separate queue at Radiology wing."),
        ("Step 5: The Breakdown", "By the time results return, doctor's shift has ended or initial queue is 20 people deep.")
    ]
    for title, desc in steps:
        p = tf.add_paragraph()
        p.text = f"▸ {title}:"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = SECONDARY
        p2 = tf.add_paragraph()
        p2.text = f"  {desc}"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(6)

    # ==========================================
    # SLIDE 3: Objectives & Key Innovations
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s3)
    add_header(s3, "Main Research Objectives & Core Innovations of SmartQMS")

    # 4 Cards in 2x2 Grid
    gw = Inches(5.7)
    gh = Inches(2.5)
    g_gap_x = Inches(0.3)
    g_gap_y = Inches(0.2)

    objs = [
        ("1. Dynamic Triage-Aware Priority Engine", PRIMARY, [
            "Mathematical formulation combining Clinical Acuity (ESI levels 0-2).",
            "Punctuality scoring for scheduled appointments vs walk-ins.",
            "Logarithmic time-aging factor to prevent patient starvation.",
            "Pediatric (<5 yrs) and geriatric (>65 yrs) vulnerability weighting."
        ]),
        ("2. Multi-Stage Workflow Orchestration", SECONDARY, [
            "End-to-end patient journey modeled as a Directed Acyclic Graph (DAG).",
            "Single master QR token for entire hospital visit (no manual re-ticketing).",
            "Automated transfer and pre-notification to downstream diagnostic counters.",
            "Preserves cumulative hospital wait tenure across department handoffs."
        ]),
        ("3. Adaptive Wait-Time Forecasting & Kiosks", ACCENT, [
            "Rolling EWMA calculation of active service rates across doctors.",
            "Calculates expected wait time with upper/lower confidence intervals [We*(1-a), We*(1+b)].",
            "Self-service touch kiosks with cryptographic QR tokenization.",
            "Large-screen public waiting hall displays with live token announcements."
        ]),
        ("4. Real-Time Synchronization & AI Guidance", PRIMARY, [
            "Sub-100ms bidirectional event broadcast powered by Socket.IO.",
            "Doctor room status locking (Available -> Calling -> Occupied -> Completed).",
            "Context-grounded AI Assistant (Gemini LLM) answering queue and prep FAQs.",
            "Comprehensive role-based access control (Admin, Reception, Doctor, Lab, Pharmacy)."
        ])
    ]

    for i, (title, color, items) in enumerate(objs):
        row = i // 2
        col = i % 2
        x = Inches(0.8) + col * (gw + g_gap_x)
        y = Inches(1.6) + row * (gh + g_gap_y)
        add_card(s3, x, y, gw, gh, title=title, title_color=color)
        tb = s3.shapes.add_textbox(x + Inches(0.2), y + Inches(0.55), gw - Inches(0.4), gh - Inches(0.65))
        tf = tb.text_frame
        tf.word_wrap = True
        for it in items:
            p = tf.add_paragraph()
            p.text = f"• {it}"
            p.font.size = Pt(11)
            p.font.color.rgb = TEXT_LIGHT
            p.space_after = Pt(3)

    # ==========================================
    # SLIDE 4: Literature Survey Overview (15 Papers)
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s4)
    add_header(s4, "Literature Survey: 15 Peer-Reviewed Works (2022 – 2026)")

    # 3 Summary categories
    cat_w = Inches(3.7)
    cat_h = Inches(5.2)

    cats = [
        ("Queuing Models & Scheduling", PRIMARY, [
            ("Al-Refaie et al. (2023)", "ESI multi-priority queuing in ER; reduces emergency wait but lacks multi-stage OPD workflow."),
            ("Zhang & Wang (2024)", "Discrete-event Arena simulation; bottleneck detection but static offline batch execution."),
            ("Liu et al. (2025)", "Stochastic appointment buffer scheduling; mitigates unpunctuality but isolated to single clinics."),
            ("Gupta & Mehrotra (2022)", "Optimal walk-in interleaving for single-server queues; degrades in multi-server networks."),
            ("Lakshmi & Iyer (2023)", "Extensive healthcare queuing survey; notes <8% bridging theoretical models to full systems.")
        ]),
        ("IoT, Workflow & Handoffs", SECONDARY, [
            ("Suresh & Sundararajan (2023)", "IoT & RFID digital token system; replaces paper slips but adheres to rigid FIFO order."),
            ("Kavitha & Mohan (2024)", "Petri-net formal workflow coordination for clinic-lab synchronization; no software UI implementation."),
            ("Patel & Joshi (2025)", "Stochastic inpatient handoff queuing networks; proves handoffs cause 40% delays, but neglects outpatient OPD."),
            ("Fernandez et al. (2023)", "Automated mobile notifications; cuts no-shows by 31.4% but uses fixed time triggers, not live queue states.")
        ]),
        ("AI, Telemetry & Real-Time Sync", ACCENT, [
            ("El-Banna et al. (2023)", "XGBoost & Random Forest wait prediction; accurate MAE but purely observational; doesn't reorder queues."),
            ("Chen et al. (2025)", "Deep Q-Network (DQN) room allocation; high compute cost and black-box opacity unsuited for emergency audits."),
            ("Rahman & Hasan (2024)", "Polyclinic automated triage heuristics; static priority causes starvation during surges."),
            ("Nair et al. (2026)", "Kafka & WebSocket hospital telemetry; sub-second broadcast but lacks active queue dispatching logic."),
            ("Bhat et al. (2024)", "TCN with self-attention for lobby congestion; macro-level forecasting without individual token tracking."),
            ("Martinez et al. (2026)", "LLM patient navigation; high usability but disconnected from backend databases, causing hallucinations.")
        ])
    ]

    for i, (col_title, col_col, papers) in enumerate(cats):
        x = Inches(0.8) + i * (cat_w + gap)
        add_card(s4, x, Inches(1.6), cat_w, cat_h, title=col_title, title_color=col_col)
        tb = s4.shapes.add_textbox(x + Inches(0.2), Inches(2.2), cat_w - Inches(0.4), cat_h - Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        for author, desc in papers:
            p = tf.add_paragraph()
            p.text = f"▸ {author}"
            p.font.bold = True
            p.font.size = Pt(10.5)
            p.font.color.rgb = WHITE
            p2 = tf.add_paragraph()
            p2.text = f"  {desc}"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_MUTED
            p2.space_after = Pt(4)

    # ==========================================
    # SLIDE 5: Literature Comparison Matrix
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s5)
    add_header(s5, "Literature Survey Comparison Matrix & Methodological Analysis")

    # Table layout
    rows = 7
    cols = 5
    table_shape = s5.shapes.add_table(rows, cols, Inches(0.8), Inches(1.5), Inches(11.7), Inches(5.3))
    table = table_shape.table

    col_widths = [Inches(1.2), Inches(2.6), Inches(2.6), Inches(2.6), Inches(2.7)]
    for i, w in enumerate(col_widths):
        table.columns[i].width = w

    headers = ["Year", "Approach / Paper", "Key Merits", "Identified Demerits", "SmartQMS Advancement"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BG
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = PRIMARY
        p.alignment = PP_ALIGN.CENTER

    data = [
        ("2023", "Multi-Priority Queuing (Al-Refaie)", "Reduces critical patient wait times", "High starvation risk for non-urgent patients", "Logarithmic aging prevents starvation"),
        ("2024", "Simulation Models (Zhang & Wang)", "Accurate bottleneck & room reallocation", "Static offline batch execution only", "Live real-time operational feedback loop"),
        ("2023", "IoT Smart Tokens (Suresh & Sundar.)", "Replaces physical paper slips", "Static FIFO dispatch; ignores urgency", "Dynamic Triage + QR tokens"),
        ("2024", "Petri Nets Workflow (Kavitha & M.)", "Formal multi-department synchronization", "Purely theoretical; no UI/kiosks", "Full-stack web/kiosk DAG orchestration"),
        ("2025", "Reinforcement Learning (Chen et al.)", "Self-learning room dispatching", "Black-box decisions; unexplainable", "Explainable, auditable priority formulas"),
        ("2026", "Telemetry & LLMs (Nair / Martinez)", "Sub-second event bus & patient chat", "No active dispatch; LLMs hallucinate", "Socket.IO dispatch + DB-grounded LLM")
    ]

    for i, row in enumerate(data):
        for j, val in enumerate(row):
            cell = table.cell(i+1, j)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(22, 32, 50) if i % 2 == 0 else CARD_BG
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(9.5)
            p.font.color.rgb = TEXT_LIGHT if j < 4 else SECONDARY
            if j == 0:
                p.alignment = PP_ALIGN.CENTER
                p.font.bold = True

    # ==========================================
    # SLIDE 6: Research Gap & Architectural Justification
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s6)
    add_header(s6, "Identified Research Gaps & The Core Research Question")

    # Left: 5 Existing Paradigms vs Right: The SmartQMS Solution
    w_half = Inches(5.7)
    add_card(s6, Inches(0.8), Inches(1.5), w_half, Inches(5.3), title="5 Fragmented Paradigms in Existing Literature", title_color=ACCENT)
    tb = s6.shapes.add_textbox(Inches(1.0), Inches(2.1), w_half - Inches(0.4), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True
    gaps = [
        ("1. Single-Stage Queuing Island:", "Existing systems focus on one department (OPD or ER) in isolation, ignoring multi-department journeys."),
        ("2. Archaic FIFO / Static Token Systems:", "Hardware token dispensers lack clinical triage awareness and appointment punctuality weighting."),
        ("3. Passive Predictive Models:", "ML algorithms predict wait times without feeding back into active queue controllers or room routing."),
        ("4. Opaque AI Black-Boxes:", "Deep reinforcement learning lack explainability and clinical auditability needed during medical emergencies."),
        ("5. Disconnected Information Silos:", "Zero sub-second sync between kiosks, doctor rooms, diagnostic desks, and public TV displays.")
    ]
    for g_title, g_desc in gaps:
        p = tf.add_paragraph()
        p.text = g_title
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE
        p2 = tf.add_paragraph()
        p2.text = g_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(5)

    add_card(s6, Inches(6.8), Inches(1.5), w_half, Inches(5.3), title="The Central Research Question & SmartQMS Answer", title_color=SECONDARY)
    tb2 = s6.shapes.add_textbox(Inches(7.0), Inches(2.1), w_half - Inches(0.4), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.add_paragraph()
    p.text = "CENTRAL RESEARCH QUESTION:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = PRIMARY
    p_q = tf2.add_paragraph()
    p_q.text = "“How can a unified healthcare queue management platform dynamically orchestrate multi-department patient workflows, adaptively balance clinical urgency with waiting-time fairness, provide confidence-bounded wait estimates, and maintain sub-second multi-client synchronization across physical hospital counters?”"
    p_q.font.italic = True
    p_q.font.size = Pt(11)
    p_q.font.color.rgb = WHITE
    p_q.space_after = Pt(12)

    p_a = tf2.add_paragraph()
    p_a.text = "SMARTQMS BRIDGES THIS VIA FOUR PILLARS:"
    p_a.font.bold = True
    p_a.font.size = Pt(11)
    p_a.font.color.rgb = SECONDARY

    pillars = [
        ("Chained Workflow DAG:", "Automated multi-department handoffs without manual re-registration."),
        ("Dynamic Fair-Priority Scoring (DFPS):", "Acuity + Punctuality + Logarithmic Aging."),
        ("Sub-second Reactive Event Bus:", "Real-time Socket.IO synchronization for public TVs & doctors."),
        ("Explainable & Auditable Architecture:", "Deterministic scoring with admin override & event logs.")
    ]
    for pt, pd in pillars:
        p = tf2.add_paragraph()
        p.text = f"✓ {pt} "
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_LIGHT
        p2 = tf2.add_paragraph()
        p2.text = f"   {pd}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(4)

    # ==========================================
    # SLIDE 7: System Architecture
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s7)
    add_header(s7, "Proposed System Architecture (4-Tier Reactive Design)")

    # 4 Tier Cards horizontally
    tier_w = Inches(2.7)
    tier_gap = Inches(0.3)
    tier_h = Inches(5.2)

    tiers = [
        ("Tier 1: Client Interfaces", PRIMARY, [
            ("Touch Kiosk Portal", "Self-service QR token generation and symptom selector."),
            ("Public Hall Monitor", "Wall-mounted TV display with audio chime and token list."),
            ("Doctor/Staff Portal", "Chamber calling, triage, consultation notes, transfers."),
            ("Executive Dashboard", "Real-time analytics, queue monitoring, and audit logs.")
        ]),
        ("Tier 2: Real-Time Gateway", SECONDARY, [
            ("Express REST API", "Secure endpoints for CRUD, authentication, and reporting."),
            ("Socket.IO Event Bus", "Room-based event distribution for instant token calls."),
            ("JWT & RBAC Middleware", "Role-based authorization (Admin, Reception, Doctor, Staff)."),
            ("Gemini AI Adapter", "Grounds LLM prompts with live queue telemetry.")
        ]),
        ("Tier 3: Business Logic Core", ACCENT, [
            ("Priority Scoring Engine", "Calculates dynamic triage weights with aging factors."),
            ("Workflow Orchestrator", "Tracks multi-department step transitions (DAG)."),
            ("Adaptive Wait Estimator", "EWMA historical rate * queue ahead / active counters."),
            ("Counter Load Balancer", "Directs patients to available doctor rooms efficiently.")
        ]),
        ("Tier 4: Data & Persistence", PRIMARY, [
            ("Prisma ORM", "Type-safe database queries and migration management."),
            ("PostgreSQL Database", "Relational models for Users, Queues, Workflows, Audit."),
            ("Event Telemetry Store", "High-resolution timestamps for every state change."),
            ("Audit Logging", "Immutable record of manual overrides, calls, and transfers.")
        ])
    ]

    for i, (t_title, t_col, items) in enumerate(tiers):
        x = Inches(0.8) + i * (tier_w + tier_gap)
        add_card(s7, x, Inches(1.5), tier_w, tier_h, title=t_title, title_color=t_col)
        tb = s7.shapes.add_textbox(x + Inches(0.15), Inches(2.1), tier_w - Inches(0.3), tier_h - Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        for it_title, it_desc in items:
            p = tf.add_paragraph()
            p.text = f"■ {it_title}"
            p.font.bold = True
            p.font.size = Pt(11)
            p.font.color.rgb = WHITE
            p2 = tf.add_paragraph()
            p2.text = f"  {it_desc}"
            p2.font.size = Pt(9.5)
            p2.font.color.rgb = TEXT_MUTED
            p2.space_after = Pt(6)

    # ==========================================
    # SLIDE 8: Mathematical Modeling & Algorithms
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s8)
    add_header(s8, "Mathematical Formulations: Dynamic Priority & Adaptive Wait Estimation")

    # Left: DFPS Formula, Right: EWMA Wait Formula
    w_card = Inches(5.7)
    h_card = Inches(5.2)

    # Left Card: Dynamic Fair-Priority Scoring (DFPS)
    add_card(s8, Inches(0.8), Inches(1.5), w_card, h_card, title="1. Dynamic Fair-Priority Scoring (DFPS) Algorithm", title_color=PRIMARY)
    tb = s8.shapes.add_textbox(Inches(1.0), Inches(2.05), w_card - Inches(0.4), h_card - Inches(0.65))
    tf = tb.text_frame
    tf.word_wrap = True

    p = tf.add_paragraph()
    p.text = "Mathematical Formulation:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = SECONDARY

    p_eq = tf.add_paragraph()
    p_eq.text = "Pi(t) = w1·Acuity(i) + w2·ApptPunctuality(i,t) + w3·ln(1 + t - t_checkin) + w4·AgeVulnerability(i)"
    p_eq.font.bold = True
    p_eq.font.size = Pt(12)
    p_eq.font.color.rgb = WHITE
    p_eq.space_after = Pt(8)

    formula_terms = [
        ("Acuity(i) ∈ {0, 1, 2}:", "Clinical Triage severity (0=Routine, 1=Urgent, 2=Emergency)."),
        ("ApptPunctuality(i, t):", "Normal distribution penalty centered at scheduled appointment slot."),
        ("ln(1 + t - t_checkin):", "Logarithmic time-aging term that monotonically elevates priority with dwell time, eliminating infinite starvation."),
        ("AgeVulnerability(i):", "Elevation weight for pediatric (<5 yrs) and geriatric (>65 yrs) patients."),
        ("w1, w2, w3, w4:", "Experimentally tuned multi-criteria weights ensuring fairness.")
    ]
    for term, expl in formula_terms:
        p = tf.add_paragraph()
        p.text = f"• {term} "
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = PRIMARY
        p2 = tf.add_paragraph()
        p2.text = f"  {expl}"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(4)

    # Right Card: Adaptive Wait-Time Estimation
    add_card(s8, Inches(6.8), Inches(1.5), w_card, h_card, title="2. Adaptive Wait-Time Forecasting with Confidence Bounds", title_color=ACCENT)
    tb2 = s8.shapes.add_textbox(Inches(7.0), Inches(2.05), w_card - Inches(0.4), h_card - Inches(0.65))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.add_paragraph()
    p.text = "Expected Wait Time Formulation:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = SECONDARY

    p_eq2 = tf2.add_paragraph()
    p_eq2.text = "We = (N_ahead · μ_service) / C_active\nConfidence Interval = [ We · (1 - α),  We · (1 + β) ]"
    p_eq2.font.bold = True
    p_eq2.font.size = Pt(12)
    p_eq2.font.color.rgb = WHITE
    p_eq2.space_after = Pt(8)

    wait_terms = [
        ("N_ahead:", "Number of active higher-priority tokens ahead in that department queue."),
        ("μ_service (EWMA):", "Exponentially weighted moving average of actual completed consultations over the preceding 2-hour window:"),
        (" ", "μ(t) = λ · S_current + (1 - λ) · μ(t-1)  [where λ = 0.2]"),
        ("C_active:", "Count of currently logged-in and available doctor rooms."),
        ("[α, β] Margins:", "Dynamic confidence spread derived from standard deviation of service times, eliminating false expectations.")
    ]
    for term, expl in wait_terms:
        if term.strip():
            p = tf2.add_paragraph()
            p.text = f"• {term} "
            p.font.bold = True
            p.font.size = Pt(10.5)
            p.font.color.rgb = ACCENT
        p2 = tf2.add_paragraph()
        p2.text = f"  {expl}"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(4)

    # ==========================================
    # SLIDE 9: Multi-Stage Patient Workflow & Hand-offs
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s9)
    add_header(s9, "End-to-End Multi-Stage Workflow Orchestration (DAG Flow)")

    # 5 Horizontal Process Steps
    step_w = Inches(2.15)
    step_gap = Inches(0.24)
    step_h = Inches(4.2)
    step_top = Inches(1.6)

    flow_steps = [
        ("Stage 1", "Self-Service Check-in", PRIMARY, [
            "Patient arrives with appointment QR or walk-in.",
            "Touch Kiosk generates cryptographic token (e.g. C-001).",
            "Initial triage rating assigned.",
            "Enters initial OPD queue."
        ]),
        ("Stage 2", "Doctor Consultation", SECONDARY, [
            "Top priority token called via audio chime.",
            "Doctor room marked OCCUPIED.",
            "Physician conducts exam.",
            "Doctor prescribes diagnostic tests (Lab, X-Ray) in portal."
        ]),
        ("Stage 3", "Automated Transfer", ACCENT, [
            "Completing Step 1 triggers Step 2 in workflow DAG.",
            "Auto-transfers token to Central Lab queue (L-014).",
            "NO re-registration needed.",
            "Lab technician pre-alerted."
        ]),
        ("Stage 4", "Diagnostic Testing", PRIMARY, [
            "Sample collected / Scan taken.",
            "Results logged into system.",
            "System auto-routes to next required department or back to Physician."
        ]),
        ("Stage 5", "Pharmacy & Departure", SECONDARY, [
            "Prescription dispatched to Pharmacy counter.",
            "Medication dispensed.",
            "Full patient workflow marked COMPLETED.",
            "Audit metrics logged."
        ])
    ]

    for i, (st_num, st_name, st_col, st_items) in enumerate(flow_steps):
        x = Inches(0.8) + i * (step_w + step_gap)
        add_card(s9, x, step_top, step_w, step_h, title=st_num, title_color=st_col)
        
        # Sub-title
        tb_sub = s9.shapes.add_textbox(x + Inches(0.1), step_top + Inches(0.55), step_w - Inches(0.2), Inches(0.45))
        p = tb_sub.text_frame.paragraphs[0]
        p.text = st_name
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE

        tb = s9.shapes.add_textbox(x + Inches(0.1), step_top + Inches(1.05), step_w - Inches(0.2), step_h - Inches(1.15))
        tf = tb.text_frame
        tf.word_wrap = True
        for item in st_items:
            p = tf.add_paragraph()
            p.text = f"• {item}"
            p.font.size = Pt(9.5)
            p.font.color.rgb = TEXT_LIGHT
            p.space_after = Pt(4)

    # Bottom Callout Box
    add_card(s9, Inches(0.8), Inches(6.0), Inches(11.7), Inches(0.9), title=None, bg_color=CARD_BG, border_color=PRIMARY)
    tb_bot = s9.shapes.add_textbox(Inches(1.0), Inches(6.05), Inches(11.3), Inches(0.8))
    tf = tb_bot.text_frame
    p = tf.paragraphs[0]
    p.text = "KEY ARCHITECTURAL BENEFIT: ZERO RE-TICKETING OVERHEAD"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = PRIMARY
    p2 = tf.add_paragraph()
    p2.text = "Patients retain their master cryptographic identity throughout their hospital visit. Cumulative wait times in earlier queues are carried over into priority weightings for downstream stages, eliminating the 40% transfer delay bottleneck identified in literature."
    p2.font.size = Pt(10.5)
    p2.font.color.rgb = TEXT_LIGHT

    # ==========================================
    # SLIDE 10: Modules Implemented in Full-Stack Prototype
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s10)
    add_header(s10, "Implemented System Modules & Core Capabilities")

    # 6 Modular Cards (2 rows x 3 columns)
    m_w = Inches(3.7)
    m_h = Inches(2.5)
    m_top1 = Inches(1.5)
    m_top2 = Inches(4.25)

    mods = [
        ("1. Contactless QR Kiosk", PRIMARY, [
            "Instant walk-in token generation & symptom selection.",
            "QR code scan check-in for pre-scheduled appointments.",
            "Touch-optimized, multilingual-ready interface."
        ]),
        ("2. Doctor & Chamber Portal", SECONDARY, [
            "One-click 'Call Next' highest-priority patient.",
            "Room state toggling (Available, Occupied, Maintenance).",
            "Consultation notes, soft skips, recalls, and department transfers."
        ]),
        ("3. Public Waiting Hall Display", ACCENT, [
            "Wall-mounted TV display with high contrast and audio chimes.",
            "Renders currently called tokens with flashing room numbers.",
            "Displays upcoming wait queue and department wait estimations."
        ]),
        ("4. Workflow Orchestrator", PRIMARY, [
            "Automated multi-department clinical care DAG transitions.",
            "Department-to-department patient routing with zero friction.",
            "Synchronized status tracking across Reception, OPD, Lab, Rx."
        ]),
        ("5. Executive Analytics & Audit", SECONDARY, [
            "Real-time operational dashboards (AWT, throughput, idle ratio).",
            "Immutable audit logs of all calls, skips, and clinician overrides.",
            "Peak arrival hour analysis and department capacity reports."
        ]),
        ("6. Context-Aware AI Assistant", ACCENT, [
            "Google Gemini LLM integrated with live queue database context.",
            "Answers patient questions: current token status, room directions.",
            "Provides pre-procedure guidance (fasting rules, documents needed)."
        ])
    ]

    for i, (m_title, m_col, m_points) in enumerate(mods):
        col = i % 3
        row = i // 3
        x = Inches(0.8) + col * (m_w + gap)
        y = m_top1 if row == 0 else m_top2
        add_card(s10, x, y, m_w, m_h, title=m_title, title_color=m_col)
        tb = s10.shapes.add_textbox(x + Inches(0.15), y + Inches(0.55), m_w - Inches(0.3), m_h - Inches(0.65))
        tf = tb.text_frame
        tf.word_wrap = True
        for pt in m_points:
            p = tf.add_paragraph()
            p.text = f"• {pt}"
            p.font.size = Pt(10)
            p.font.color.rgb = TEXT_LIGHT
            p.space_after = Pt(3)

    # ==========================================
    # SLIDE 11: Technology Stack & Database Architecture
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s11)
    add_header(s11, "Technology Stack & Relational Database Architecture")

    # Left: Tech Stack breakdown, Right: Database Schema & Entity Relationships
    w_col = Inches(5.7)
    add_card(s11, Inches(0.8), Inches(1.5), w_col, Inches(5.3), title="Production-Grade Technology Stack", title_color=PRIMARY)
    tb = s11.shapes.add_textbox(Inches(1.0), Inches(2.1), w_col - Inches(0.4), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    stacks = [
        ("Frontend Tier:", "React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti."),
        ("Real-Time Engine:", "Socket.IO Client & Server for sub-100ms room-based event broadcasting."),
        ("Backend Services:", "Node.js, Express, TypeScript, RESTful JSON architecture, JWT + Bcrypt RBAC."),
        ("Data Persistence:", "PostgreSQL relational engine managed via Prisma ORM for type-safe queries."),
        ("AI / LLM Integration:", "Google Gemini API (Generative AI) with context injection for live queue Q&A."),
        ("Tooling & Testing:", "Prisma Studio visual GUI, ESLint, TypeScript compiler, Git.")
    ]
    for st_title, st_desc in stacks:
        p = tf.add_paragraph()
        p.text = f"■ {st_title} "
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE
        p2 = tf.add_paragraph()
        p2.text = f"   {st_desc}"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(4)

    add_card(s11, Inches(6.8), Inches(1.5), w_col, Inches(5.3), title="Database Schema & Entities (Prisma / PostgreSQL)", title_color=SECONDARY)
    tb2 = s11.shapes.add_textbox(Inches(7.0), Inches(2.1), w_col - Inches(0.4), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    entities = [
        ("User & Doctor / Staff:", "Authentication, role enforcement (ADMIN, RECEPTIONIST, DOCTOR, LAB, PHARMACY)."),
        ("Department & Room:", "Capacity management, room status (AVAILABLE, OCCUPIED, MAINTENANCE)."),
        ("Patient & QRToken:", "Cryptographic token strings, medical history links, status (ACTIVE, USED)."),
        ("Appointment:", "Scheduled time slot, doctor allocation, status (SCHEDULED, CHECKED_IN)."),
        ("Queue & QueueEntry:", "Dynamic priority integer, status (WAITING, CALLED, IN_SERVICE, SKIPPED), checkinTime, serviceStartAt, serviceEndAt."),
        ("PatientWorkflow & Step:", "Master multi-department trajectory tracker (step order, active department, step status)."),
        ("AuditLog:", "Immutable event tracking (actorId, action, entity, metadata) for auditability.")
    ]
    for ent_title, ent_desc in entities:
        p = tf2.add_paragraph()
        p.text = f"▸ {ent_title} "
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = SECONDARY
        p2 = tf2.add_paragraph()
        p2.text = f"   {ent_desc}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(3)

    # ==========================================
    # SLIDE 12: Experimental Evaluation Plan & Baselines
    # ==========================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s12)
    add_header(s12, "Experimental Evaluation Plan, Baselines & Benchmarks")

    # 4 Baselines (Left), 6 Quantitative Metrics & Targets (Right)
    add_card(s12, Inches(0.8), Inches(1.5), w_col, Inches(5.3), title="4 Comparative Benchmark Baselines", title_color=ACCENT)
    tb = s12.shapes.add_textbox(Inches(1.0), Inches(2.1), w_col - Inches(0.4), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    bases = [
        ("Baseline 1: Random / Unregulated Walk-in", "Physical queues outside chambers without centralized tokenization or visibility."),
        ("Baseline 2: Pure FCFS Electronic Token System", "Electronic token dispensers operating strictly on First-Come-First-Served dispatching."),
        ("Baseline 3: Static Appointment Scheduling", "Fixed-slot scheduling without dynamic adjustment for consultation overruns or walk-in surges."),
        ("Baseline 4: Disconnected Multi-Queue Systems", "Department-specific isolated queues requiring physical re-ticketing at each stage.")
    ]
    for b_title, b_desc in bases:
        p = tf.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = WHITE
        p2 = tf.add_paragraph()
        p2.text = f"  {b_desc}"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(8)

    add_card(s12, Inches(6.8), Inches(1.5), w_col, Inches(5.3), title="Quantitative Metrics & Target Hypotheses", title_color=SECONDARY)
    tb2 = s12.shapes.add_textbox(Inches(7.0), Inches(2.1), w_col - Inches(0.4), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    metrics = [
        ("Average Wait Time (AWT):", "Mean time from check-in to consultation across all departments."),
        ("Total Hospital Dwell Time (THDT):", "Cumulative time for multi-stage visits (Consult -> Lab -> Pharmacy)."),
        ("Counter Idle Ratio (CIR):", "Percentage of time counters sit idle while patients wait."),
        ("Triage Response Latency (TRL):", "Time taken to call Category-1 (Emergency) arrivals."),
        ("Starvation Index:", "Maximum wait experienced by low-priority walk-ins during surges.")
    ]
    for m_name, m_info in metrics:
        p = tf2.add_paragraph()
        p.text = f"✓ {m_name} "
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = PRIMARY
        p2 = tf2.add_paragraph()
        p2.text = f"   {m_info}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(2)

    p_targ = tf2.add_paragraph()
    p_targ.text = "TARGET PERFORMANCE HYPOTHESES:"
    p_targ.font.bold = True
    p_targ.font.size = Pt(11)
    p_targ.font.color.rgb = SECONDARY
    p_targ.space_before = Pt(8)

    targets = [
        "30% to 45% reduction in Total Outpatient Dwell Time (THDT).",
        ">60% reduction in high-acuity Triage Response Latency (TRL).",
        "Zero patient starvation achieved via logarithmic time aging.",
        "Sub-100ms real-time event dissemination across waiting displays."
    ]
    for tg in targets:
        p = tf2.add_paragraph()
        p.text = f"★ {tg}"
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = WHITE
        p.space_after = Pt(2)

    # ==========================================
    # SLIDE 13: Review 1 Milestones & Demo Readiness
    # ==========================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s13)
    add_header(s13, "Review 1 Status: Accomplishments & Working Prototype Demonstration")

    # 3 Progress Cards
    p_w = Inches(3.7)
    p_h = Inches(5.2)

    add_card(s13, Inches(0.8), Inches(1.5), p_w, p_h, title="Theoretical & Design Phase", title_color=PRIMARY)
    tb = s13.shapes.add_textbox(Inches(1.0), Inches(2.1), p_w - Inches(0.4), p_h - Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    t_items = [
        ("Literature Survey Completed:", "Comprehensive review of 15 papers (2022-2026) in hospital queuing, IoT, and simulation."),
        ("Research Gap Articulated:", "5 isolated paradigms identified and formalized."),
        ("Mathematical Models Formulated:", "Dynamic Priority (DFPS) and EWMA Adaptive Wait Estimators mathematically defined."),
        ("System Architecture Finalized:", "4-tier modular, event-driven reactive architecture.")
    ]
    for it_t, it_d in t_items:
        p = tf.add_paragraph()
        p.text = f"✓ {it_t}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = SECONDARY
        p2 = tf.add_paragraph()
        p2.text = f"  {it_d}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(6)

    add_card(s13, Inches(0.8) + p_w + gap, Inches(1.5), p_w, p_h, title="Software Implementation Done", title_color=SECONDARY)
    tb = s13.shapes.add_textbox(Inches(1.0) + p_w + gap, Inches(2.1), p_w - Inches(0.4), p_h - Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    s_items = [
        ("Backend Server Operational:", "Node.js + Express + TypeScript with JWT authentication and RBAC middleware."),
        ("Database & Schema Deployed:", "PostgreSQL with Prisma ORM; seed script creates default departments, doctors, counters."),
        ("Socket.IO Event Gateway:", "Live token calling, queue updates, and room status synchronization working."),
        ("Frontend Web App Built:", "React 18 + Vite responsive dashboards for Admin, Reception, Doctor, Display, and Kiosks.")
    ]
    for it_t, it_d in s_items:
        p = tf.add_paragraph()
        p.text = f"✓ {it_t}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = PRIMARY
        p2 = tf.add_paragraph()
        p2.text = f"  {it_d}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(6)

    add_card(s13, Inches(0.8) + (p_w + gap)*2, Inches(1.5), p_w, p_h, title="Live Demo Capabilities", title_color=ACCENT)
    tb = s13.shapes.add_textbox(Inches(1.0) + (p_w + gap)*2, Inches(2.1), p_w - Inches(0.4), p_h - Inches(0.7))
    tf = tb.text_frame
    tf.word_wrap = True
    d_items = [
        ("Kiosk Check-in (/kiosk):", "Generate walk-in tokens or scan appointment QR code."),
        ("Public Display (/display):", "Wall display flashes called token with audio announcement chime."),
        ("Doctor Chamber Portal (/queue):", "Call next patient, start service, skip/recall, and initiate department transfers."),
        ("Admin Analytics (/admin):", "View live queue statistics, department throughput, and audit logs.")
    ]
    for it_t, it_d in d_items:
        p = tf.add_paragraph()
        p.text = f"★ {it_t}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = ACCENT
        p2 = tf.add_paragraph()
        p2.text = f"  {it_d}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(6)

    # ==========================================
    # SLIDE 14: Future Roadmap, Conclusion & Q&A
    # ==========================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_bg(s14)
    add_header(s14, "Review 2 Roadmap, Conclusion & Summary")

    # Left: Roadmap, Right: Conclusion & Summary
    add_card(s14, Inches(0.8), Inches(1.5), w_col, Inches(5.3), title="Review 2 & Final Review Milestone Roadmap", title_color=PRIMARY)
    tb = s14.shapes.add_textbox(Inches(1.0), Inches(2.1), w_col - Inches(0.4), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    roadmaps = [
        ("Phase 1: Simulation Benchmarking", "Conduct large-scale discrete-event simulations comparing SmartQMS against Baselines 1-4 with synthetic Poisson arrival distributions."),
        ("Phase 2: Stress & Concurrency Testing", "Benchmark sub-second WebSocket performance under 1000+ concurrent simulated patient kiosks and displays."),
        ("Phase 3: AI Assistant Fine-Tuning", "Ground Gemini LLM with hospital floorplans, department prep checklists, and dynamic doctor availability."),
        ("Phase 4: Pilot Clinical Deployment", "Test in mock OPD environment with RFID/barcode scanners and evaluate clinical staff usability.")
    ]
    for r_title, r_desc in roadmaps:
        p = tf.add_paragraph()
        p.text = f"▸ {r_title}"
        p.font.bold = True
        p.font.size = Pt(11)
        p.font.color.rgb = SECONDARY
        p2 = tf.add_paragraph()
        p2.text = f"  {r_desc}"
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_LIGHT
        p2.space_after = Pt(6)

    add_card(s14, Inches(6.8), Inches(1.5), w_col, Inches(5.3), title="Conclusion & Key Takeaways", title_color=SECONDARY)
    tb2 = s14.shapes.add_textbox(Inches(7.0), Inches(2.1), w_col - Inches(0.4), Inches(4.5))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.add_paragraph()
    p.text = "SUMMARY OF CONTRIBUTION:"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = PRIMARY

    c_points = [
        ("Solves Hospital Fragmentation:", "Bridges the gap between clinical triage and multi-department operational execution."),
        ("Eliminates Patient Starvation:", "Dynamic logarithmic aging ensures fair service without compromising emergency arrivals."),
        ("Production-Ready Full Stack:", "Working React, Node.js, Socket.IO, PostgreSQL prototype ready for live demonstration."),
        ("Measurable Impact:", "Expected 30-45% dwell time reduction, >60% emergency triage acceleration, and zero paper ticketing overhead.")
    ]
    for c_t, c_d in c_points:
        p = tf2.add_paragraph()
        p.text = f"✓ {c_t} "
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = WHITE
        p2 = tf2.add_paragraph()
        p2.text = f"   {c_d}"
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_after = Pt(4)

    # Thank you / Q&A badge
    ty_box = s14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.5), Inches(5.5), Inches(4.3), Inches(0.9))
    ty_box.fill.solid()
    ty_box.fill.fore_color.rgb = CARD_BG
    ty_box.line.color.rgb = PRIMARY
    tb_ty = s14.shapes.add_textbox(Inches(7.5), Inches(5.5), Inches(4.3), Inches(0.9))
    p = tb_ty.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.text = "THANK YOU!"
    p.font.bold = True
    p.font.size = Pt(16)
    p.font.color.rgb = WHITE
    p2 = tb_ty.text_frame.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "Questions & Feedback Welcomed"
    p2.font.size = Pt(11)
    p2.font.color.rgb = SECONDARY

    # Save presentation
    output_path = r"c:\Users\RAGHUL\Desktop\24mis0469\SmartQMS_Project_Review_1_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
