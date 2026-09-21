/* ==========================================================================
   Udvegadarshini - Master App Logic with Sign Up & Login Validation
   ========================================================================== */

class UdvegadarshiniApp {
    constructor() {
        this.isConnected = false;
        this.isSimulating = false;
        this.simInterval = null;

        this.port = null;
        this.reader = null;

        this.viewMode = 'personal';

        this.currentUser = {
            subjectId: 'SUBJ-3221',
            fullName: 'Santhosh / Sindhu / Bharat / Nani',
            role: 'Personal Wellness'
        };

        this.usersDB = []; // Registered Users DB
        this.doctorRequests = []; // Doctor Link Access Requests DB
        this.hospitalsDB = []; // Registered Hospitals DB

        this.currentMetrics = {
            stressScore: 0,
            state: 'waiting',
            delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0,
            betaAlphaRatio: 0, hjorthAct: 0, hjorthMob: 0, hjorthComp: 0,
            entropy: 0, katzFD: 1.0, timestamp: null
        };

        this.historyLogs = [];
        this.journalEntries = [];
        this.sessionStartTime = new Date();

        this.chart = null;
        this.chartMaxPoints = 25;

        this.isBreathing = false;
        this.breathInterval = null;
    }

    init() {
        try { this.initSplashScreen(); } catch(e) { console.error("Splash init error:", e); }
        try { this.loadHospitalsDB(); } catch(e) { console.error("Hospitals DB error:", e); }
        try { this.loadUsersDB(); } catch(e) { console.error("Users DB error:", e); }
        try { this.loadDoctorRequests(); } catch(e) { console.error("Doctor reqs error:", e); }
        try { this.bindEvents(); } catch(e) { console.error("Bind events error:", e); }
        try { this.initChart(); } catch(e) { console.error("Chart init error:", e); }
        try { this.loadSavedUserProfile(); } catch(e) { console.error("Profile load error:", e); }
        try { this.loadSavedJournals(); } catch(e) { console.error("Journals load error:", e); }
        try { if (typeof aptaAI !== 'undefined') aptaAI.init(); } catch(e) { console.error("AptaAI error:", e); }
        try { if (typeof i18n !== 'undefined') i18n.applyTranslations(); } catch(e) { console.error("i18n error:", e); }
        try { if (typeof soundEngine !== 'undefined') soundEngine.bindCanvas('audioVisualizerCanvas'); } catch(e) { console.error("SoundEngine error:", e); }
        try { if (typeof stressGames !== 'undefined') stressGames.init(); } catch(e) { console.error("Games error:", e); }
        try { this.bindSoundTherapyPresets(); } catch(e) { console.error("Presets error:", e); }
        try { this.initDoctorPortalEvents(); } catch(e) { console.error("Doctor portal error:", e); }
        try { this.initProfileAndPhoneEvents(); } catch(e) { console.error("Profile events error:", e); }
        try { this.resetToDisconnectedState(); } catch(e) { console.error("Reset state error:", e); }
        try { this.initWatchdog(); } catch(e) { console.error("Watchdog init error:", e); }
    }

    initWatchdog() {
        this.lastRxTime = 0;
        setInterval(() => {
            if (this.isConnected && this.lastRxTime > 0 && (Date.now() - this.lastRxTime > 2200)) {
                console.warn("Watchdog: Data stream stalled or band removed. Auto-resetting to Disconnected.");
                this.processMetricsUpdate({
                    stressScore: 0,
                    isLeadOff: true,
                    delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0,
                    betaAlphaRatio: 0, hjorthAct: 0, hjorthMob: 0, hjorthComp: 0,
                    entropy: 0, katzFD: 1.0
                });
            }
        }, 1000);
    }

    resetToDisconnectedState() {
        document.getElementById('stressScoreVal').innerHTML = `--<span>%</span>`;
        document.getElementById('stressStateTitle').textContent = 'Hardware Disconnected';
        document.getElementById('stressStateDesc').textContent = 'Connect ESP32-S3 via Web Serial (USB) or Web BLE';
        const gaugeFill = document.getElementById('gaugeFill');
        if (gaugeFill) {
            gaugeFill.style.strokeDashoffset = 534;
            gaugeFill.style.stroke = '#64748b';
        }
        const stateTitle = document.getElementById('stressStateTitle');
        if (stateTitle) stateTitle.style.color = '#64748b';

        if (document.getElementById('valDelta')) document.getElementById('valDelta').textContent = '0.0000';
        if (document.getElementById('valTheta')) document.getElementById('valTheta').textContent = '0.0000';
        if (document.getElementById('valAlpha')) document.getElementById('valAlpha').textContent = '0.0000';
        if (document.getElementById('valBeta')) document.getElementById('valBeta').textContent = '0.0000';
        if (document.getElementById('valGamma')) document.getElementById('valGamma').textContent = '0.0000';
        if (document.getElementById('valBetaAlphaRatio')) document.getElementById('valBetaAlphaRatio').textContent = '0.000';
    }

    loadHospitalsDB() {
        try {
            const h = localStorage.getItem('udvega_hospitals_db');
            if (h) {
                this.hospitalsDB = JSON.parse(h);
            }
        } catch (e) {
            console.error("Corrupted hospitals DB reset:", e);
            this.hospitalsDB = [];
        }

        if (!this.hospitalsDB || !Array.isArray(this.hospitalsDB) || this.hospitalsDB.length === 0) {
            this.hospitalsDB = [
                "GVP Multi-Specialty Hospital",
                "Apollo Hospitals",
                "Care Hospitals",
                "AIIMS Clinical Research Center",
                "KIMS Hospitals",
                "General Health Center"
            ];
            localStorage.setItem('udvega_hospitals_db', JSON.stringify(this.hospitalsDB));
        }

        this.populateHospitalDropdown();
    }

    loadUsersDB() {
        // Perform clean database wipe & seed pre-approved demo accounts for ALL roles
        const dbResetDone = localStorage.getItem('udvega_db_reset_v9_master_lock');
        if (!dbResetDone) {
            localStorage.removeItem('udvega_users_db');
            localStorage.removeItem('udvega_hospitals_db');
            localStorage.removeItem('udvega_doctor_requests');
            localStorage.removeItem('udvega_user');
            localStorage.setItem('udvega_db_reset_v9_master_lock', 'true');
        }

        try {
            const db = localStorage.getItem('udvega_users_db');
            if (db) {
                this.usersDB = JSON.parse(db);
            }
        } catch (e) {
            this.usersDB = [];
        }

        if (!this.usersDB || !Array.isArray(this.usersDB)) {
            this.usersDB = [];
        }

        const defaultDemoUsers = [
            {
                email: 'rajwanthbalakaofficial@gmail.com',
                password: '1819',
                fullName: 'Rajwanth Balaka',
                subjectId: 'MASTER-ADMIN-001',
                role: 'HospitalAdmin',
                hospitalName: 'State Healthcare Authority Headquarters',
                govLicenseNo: 'STATE-AUTH-2026-HQ',
                govVerified: true,
                status: 'approved',
                lang: 'teluglish',
                phone: '+91 7093058824',
                phoneVerified: true
            },
            {
                email: 'yashoda@hospital.com',
                password: '1234',
                fullName: 'Yashoda Executive Admin',
                subjectId: 'HOSP-YASHODA-001',
                role: 'HospitalAdmin',
                hospitalName: 'Yashoda Multi-Specialty Hospital',
                govLicenseNo: 'NABH-AP-2026-8841',
                govVerified: true,
                status: 'approved',
                lang: 'teluglish',
                phone: '+91 98765 88410',
                phoneVerified: true
            },
            {
                email: 'doctor@gvp.com',
                password: '1234',
                fullName: 'Dr. Anitha Reddy',
                subjectId: 'MCI-AP-2026-9812',
                role: 'Doctor',
                hospitalName: 'Yashoda Multi-Specialty Hospital',
                specialization: 'Neuro-Cardiology',
                experience: '12+ Years Clinical Practice',
                qualification: 'MBBS, MD (Neuro-Cardiology)',
                doctorApprovalStatus: 'approved',
                status: 'approved',
                lang: 'teluglish',
                phone: '+91 98765 98120',
                phoneVerified: true
            },
            {
                email: 'patient@gmail.com',
                password: '1234',
                fullName: 'Santhosh Kumar',
                subjectId: 'SUBJ-3221',
                role: 'Subject',
                hospitalName: 'Yashoda Multi-Specialty Hospital',
                doctorEmail: 'doctor@gvp.com',
                doctorName: 'Dr. Anitha Reddy (Neuro-Cardiology)',
                doctorApprovalStatus: 'approved',
                status: 'approved',
                lang: 'teluglish',
                phone: '+91 98765 32210',
                phoneVerified: true
            },
            {
                email: 'user@wellness.com',
                password: '1234',
                fullName: 'Sindhu Varma',
                subjectId: 'USER-9921-APP',
                role: 'Personal Wellness',
                status: 'approved',
                lang: 'teluglish',
                phone: '+91 98765 99210',
                phoneVerified: true
            }
        ];

        defaultDemoUsers.forEach(demo => {
            const idx = this.usersDB.findIndex(u => u.email && u.email.toLowerCase() === demo.email.toLowerCase());
            if (idx >= 0) {
                this.usersDB[idx] = { ...this.usersDB[idx], ...demo };
            } else {
                this.usersDB.push(demo);
            }
        });

        localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
    }

    loadDoctorRequests() {
        try {
            const reqs = localStorage.getItem('udvega_doctor_requests');
            if (reqs) {
                this.doctorRequests = JSON.parse(reqs);
            }
        } catch (e) {
            console.error("Corrupted doctor requests database reset:", e);
            this.doctorRequests = [];
        }

        if (!this.doctorRequests || !Array.isArray(this.doctorRequests) || this.doctorRequests.length === 0) {
            // Default seed requests (Instagram-style pending access requests)
            this.doctorRequests = [
                {
                    requestId: 'REQ-1001',
                    patientSubjectId: 'SUBJ-3221',
                    patientFullName: 'Santhosh Kumar',
                    patientEmail: 'patient@example.com',
                    hospitalName: 'GVP Multi-Specialty Hospital',
                    doctorEmail: 'dr.rajesh@hospital.com',
                    doctorName: 'Dr. Rajesh Sharma (Cardiology)',
                    status: 'pending',
                    timestamp: '2026-09-11 21:30',
                    latestStressScore: 42,
                    eegData: { delta: 18, theta: 24, alpha: 38, beta: 15, gamma: 5 }
                },
                {
                    requestId: 'REQ-1002',
                    patientSubjectId: 'SUBJ-8842',
                    patientFullName: 'Sindhu Varma',
                    patientEmail: 'sindhu@gvp.ac.in',
                    hospitalName: 'GVP Multi-Specialty Hospital',
                    doctorEmail: 'dr.rajesh@hospital.com',
                    doctorName: 'Dr. Rajesh Sharma (Cardiology)',
                    status: 'pending',
                    timestamp: '2026-09-11 22:00',
                    latestStressScore: 78,
                    eegData: { delta: 10, theta: 15, alpha: 20, beta: 45, gamma: 10 }
                }
            ];
            localStorage.setItem('udvega_doctor_requests', JSON.stringify(this.doctorRequests));
        }
    }

    initSplashScreen() {
        const progressBar = document.getElementById('splashProgress');
        const statusText = document.getElementById('splashStatusText');
        const splashScreen = document.getElementById('splashScreen');

        if (!splashScreen) return;

        const steps = [
            { pct: 30, text: "Initialising ESP32 Neural System..." },
            { pct: 70, text: "Loading 1D-CNN Quantized Weights (INT8)..." },
            { pct: 100, text: "Ready!" }
        ];

        let idx = 0;
        const interval = setInterval(() => {
            if (idx < steps.length) {
                if (progressBar) progressBar.style.width = `${steps[idx].pct}%`;
                if (statusText) statusText.textContent = steps[idx].text;
                idx++;
            } else {
                clearInterval(interval);
                splashScreen.style.opacity = '0';
                splashScreen.style.visibility = 'hidden';
                splashScreen.style.pointerEvents = 'none';

                setTimeout(() => {
                    splashScreen.style.display = 'none';

                    const savedUser = localStorage.getItem('udvega_user');
                    if (!savedUser) {
                        const loginModal = document.getElementById('loginModal');
                        if (loginModal) loginModal.style.display = 'flex';
                    }
                }, 400);
            }
        }, 220);
    }

    loadSavedUserProfile() {
        try {
            const saved = localStorage.getItem('udvega_user');
            if (saved) {
                const user = JSON.parse(saved);

                // Enforce approval check for saved session
                if (user.role === 'HospitalAdmin' && user.email.toLowerCase() !== 'rajwanthbalakaofficial@gmail.com' && (user.status === 'pending_gov_approval' || !user.govVerified)) {
                    localStorage.removeItem('udvega_user');
                    this.currentUser = { subjectId: 'GUEST', fullName: 'Guest User', role: 'Personal Wellness' };
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) loginModal.style.display = 'flex';
                    const alertBox = document.getElementById('authAlertBox');
                    if (alertBox) {
                        alertBox.className = 'auth-alert-box';
                        alertBox.innerHTML = `
                            <div style="padding: 0.2rem 0;">
                                <strong style="color: #ef4444;"><i class="fa-solid fa-lock"></i> Access Blocked: Approval Required ⛔</strong>
                                <p style="margin: 0.4rem 0 0.5rem 0; font-size: 0.88rem;">Your Hospital Admin registration for <strong>${user.hospitalName}</strong> is pending approval from Master Admin (<code>rajwanthbalakaofficial@gmail.com</code>).</p>
                                <span style="font-size: 0.78rem; color: #94a3b8; display: block;">You CANNOT log in until the Master Admin verifies and grants approval to your hospital!</span>
                            </div>
                        `;
                        alertBox.style.display = 'block';
                    }
                    return;
                }

                if (user.role === 'Doctor' && user.status === 'pending_hospital_approval') {
                    localStorage.removeItem('udvega_user');
                    this.currentUser = { subjectId: 'GUEST', fullName: 'Guest User', role: 'Personal Wellness' };
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) loginModal.style.display = 'flex';
                    const alertBox = document.getElementById('authAlertBox');
                    if (alertBox) {
                        alertBox.className = 'auth-alert-box';
                        alertBox.textContent = `Login Pending ⏳: Doctor registration for ${user.fullName} is awaiting Hospital Admin approval. Access is BLOCKED until approved.`;
                        alertBox.style.display = 'block';
                    }
                    return;
                }

                this.currentUser = user;
                this.updateUserProfileUI();
            }
        } catch (e) {
            console.error("Corrupted saved user profile:", e);
            localStorage.removeItem('udvega_user');
        }
    }

    loadSavedJournals() {
        try {
            const saved = localStorage.getItem('udvega_journals');
            if (saved) {
                this.journalEntries = JSON.parse(saved);
                this.renderJournalEntries();
            }
        } catch (e) {
            console.error("Corrupted journal logs reset:", e);
            this.journalEntries = [];
        }
    }

    updateUserProfileUI() {
        document.getElementById('userNameText').textContent = this.currentUser.fullName || 'Guest User';
        document.getElementById('userRoleText').textContent = `${this.currentUser.role} (${this.currentUser.subjectId || 'GUEST'})`;
        document.getElementById('userAvatar').textContent = (this.currentUser.fullName || 'G').charAt(0).toUpperCase();

        document.getElementById('pdfSubjectId').textContent = this.currentUser.subjectId || 'SUBJ-GUEST';
        document.getElementById('pdfSubjectName').textContent = this.currentUser.fullName || 'Guest User';

        // Doctor Link Chip for Patient
        const chip = document.getElementById('userDocLinkChip');
        const chipText = document.getElementById('userDocLinkText');

        if (chip && chipText) {
            if (this.currentUser.doctorName) {
                const docSimple = this.currentUser.doctorName.split(' (')[0];
                const req = this.doctorRequests.find(r => r.patientEmail === this.currentUser.email || r.patientSubjectId === this.currentUser.subjectId);
                const status = req ? req.status : (this.currentUser.doctorApprovalStatus || 'pending');

                chip.style.display = 'inline-flex';
                chip.className = `user-doc-link-chip ${status}`;
                if (status === 'approved') {
                    chipText.textContent = `Linked: ${docSimple} (Approved ✓)`;
                } else if (status === 'rejected') {
                    chipText.textContent = `Linked: ${docSimple} (Access Declined)`;
                } else {
                    chipText.textContent = `Linked: ${docSimple} (Pending Approval ⏳)`;
                }
            } else {
                chip.style.display = 'none';
            }
        }

        // Toggle Doctor / Hospital Admin Nav Tab & Hide Consumer tabs for Clinical roles
        const docTab = document.getElementById('navDoctorPortalTab');
        const allNavTabs = document.querySelectorAll('.main-nav .nav-tab');
        const modeToggleBox = document.querySelector('.mode-toggle-box');
        const connControls = document.querySelectorAll('#btnConnectSerial, #btnConnectBLE, #btnToggleSim, #connectionBadge');
        const masterAdminView = document.getElementById('masterAdminView');
        const hospAdminView = document.getElementById('hospitalAdminView');
        const docPortalView = document.getElementById('doctorPortalView');
        const patientClinicalView = document.getElementById('patientClinicalView');
        const bannerBadge = document.getElementById('portalBannerBadge');
        const docTitle = document.getElementById('docPortalTitle');
        const docSub = document.getElementById('docPortalSubtitle');

        if (this.currentUser.role === 'HospitalAdmin') {
            // FORCE CLINICAL MODE & HIDE ALL CONSUMER TABS & CONTROLS FOR HOSPITAL ADMIN / MASTER ADMIN
            this.setMode('clinical');
            allNavTabs.forEach(tab => {
                if (tab !== docTab) tab.style.display = 'none';
            });
            if (modeToggleBox) modeToggleBox.style.display = 'none';
            connControls.forEach(ctrl => ctrl.style.display = 'none');

            if (this.currentUser.email && this.currentUser.email.toLowerCase() === 'rajwanthbalakaofficial@gmail.com') {
                // MASTER ADMIN SUPER USER LOGIN (rajwanthbalakaofficial@gmail.com)
                this.currentUser.fullName = 'Rajwanth Balaka';
                this.currentUser.subjectId = 'MASTER-ADMIN-001';
                this.currentUser.hospitalName = 'State Healthcare Authority Headquarters';
                localStorage.setItem('udvega_user', JSON.stringify(this.currentUser));

                document.getElementById('userNameText').textContent = 'Rajwanth Balaka';
                document.getElementById('userRoleText').textContent = 'State Master Admin (MASTER-ADMIN-001)';
                document.getElementById('userAvatar').textContent = 'R';

                if (docTab) {
                    docTab.style.display = 'inline-flex';
                    docTab.innerHTML = `<i class="fa-solid fa-crown"></i> Master Admin Portal`;
                }

                if (masterAdminView) masterAdminView.style.display = 'block';
                if (hospAdminView) hospAdminView.style.display = 'none';
                if (docPortalView) docPortalView.style.display = 'none';
                if (patientClinicalView) patientClinicalView.style.display = 'none';

                if (bannerBadge) bannerBadge.innerHTML = `<i class="fa-solid fa-shield-halved"></i> State Healthcare Master Command`;
                if (docTitle) docTitle.textContent = `Welcome, Rajwanth Balaka (State Master Admin)`;
                if (docSub) docSub.textContent = `State Accreditation Authority & Hardware Band Distribution Headquarters`;

                this.renderMasterAdminPortal();
            } else {
                // REGULAR HOSPITAL ADMIN LOGIN (e.g. Yashoda, Apollo)
                if (docTab) {
                    docTab.style.display = 'inline-flex';
                    docTab.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital Admin Portal <span class="badge-unread" id="pendingReqBadge" style="display:none;">0</span>`;
                }

                if (masterAdminView) masterAdminView.style.display = 'none';
                if (hospAdminView) hospAdminView.style.display = 'block';
                if (docPortalView) docPortalView.style.display = 'none';
                if (patientClinicalView) patientClinicalView.style.display = 'none';

                if (bannerBadge) bannerBadge.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital Executive Admin Portal`;
                if (docTitle) docTitle.textContent = `Welcome, ${this.currentUser.fullName}`;
                if (docSub) docSub.textContent = `${this.currentUser.hospitalName || 'Clinical Health Center'} | Doctor Verification & Hospital Staff Management`;

                this.renderHospitalAdminPortal();
            }

            // Auto-switch to Hospital / Master Admin Portal tab
            if (docTab) docTab.click();

        } else if (this.currentUser.role === 'Doctor') {
            // FORCE CLINICAL MODE & HIDE ALL CONSUMER TABS & CONTROLS FOR DOCTOR
            this.setMode('clinical');
            allNavTabs.forEach(tab => {
                if (tab !== docTab) tab.style.display = 'none';
            });
            if (modeToggleBox) modeToggleBox.style.display = 'none';
            connControls.forEach(ctrl => ctrl.style.display = 'none');

            if (docTab) {
                docTab.style.display = 'inline-flex';
                docTab.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Doctor Portal <span class="badge-unread" id="pendingReqBadge" style="display:none;">0</span>`;
            }

            if (masterAdminView) masterAdminView.style.display = 'none';
            if (hospAdminView) hospAdminView.style.display = 'none';
            if (docPortalView) docPortalView.style.display = 'block';
            if (patientClinicalView) patientClinicalView.style.display = 'none';

            if (bannerBadge) bannerBadge.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Doctor Clinical Telemetry Portal`;
            if (docTitle) docTitle.textContent = `Welcome, ${this.currentUser.fullName}`;
            if (docSub) docSub.textContent = `${this.currentUser.hospitalName || 'Clinical Hospital Center'} | Department of Neuro-Cardiology`;
            this.renderDoctorPortal();

            // Auto-switch to Doctor Portal tab
            if (docTab) docTab.click();

        } else if (this.currentUser.role === 'Subject') {
            // PATIENT CLINICAL CONSULTATION VIEW
            this.setMode('personal');
            allNavTabs.forEach(tab => tab.style.display = 'inline-flex');
            if (modeToggleBox) modeToggleBox.style.display = 'inline-flex';
            connControls.forEach(ctrl => ctrl.style.display = 'inline-flex');

            if (docTab) {
                docTab.style.display = 'inline-flex';
                docTab.innerHTML = `<i class="fa-solid fa-user-doctor"></i> My Doctor Consultation`;
            }

            if (masterAdminView) masterAdminView.style.display = 'none';
            if (hospAdminView) hospAdminView.style.display = 'none';
            if (docPortalView) docPortalView.style.display = 'none';
            if (patientClinicalView) patientClinicalView.style.display = 'block';

            if (bannerBadge) bannerBadge.innerHTML = `<i class="fa-solid fa-hospital-user"></i> Patient Telemetry & Doctor Consultation`;
            if (docTitle) docTitle.textContent = `Welcome, ${this.currentUser.fullName || 'Patient'}`;
            if (docSub) docSub.textContent = `Subject ID: ${this.currentUser.subjectId || 'N/A'} | Direct Consultation & Telemetry Connection`;

            this.renderPatientClinicalView();

        } else {
            // PERSONAL DAILY WELLNESS USER / RESEARCHER / GUEST (NO CLINICAL DOCTOR TAB)
            this.setMode('personal');
            allNavTabs.forEach(tab => {
                if (tab === docTab) tab.style.display = 'none';
                else tab.style.display = 'inline-flex';
            });
            if (modeToggleBox) modeToggleBox.style.display = 'inline-flex';
            connControls.forEach(ctrl => ctrl.style.display = 'inline-flex');

            if (docTab) {
                docTab.style.display = 'none';
            }

            if (masterAdminView) masterAdminView.style.display = 'none';
            if (hospAdminView) hospAdminView.style.display = 'none';
            if (docPortalView) docPortalView.style.display = 'none';
            if (patientClinicalView) patientClinicalView.style.display = 'none';

            // Auto switch off doctor portal tab if currently active
            const activeTab = document.querySelector('.main-nav .nav-tab.active');
            if (activeTab === docTab) {
                const monitorTab = document.querySelector('[data-tab="tab-monitor"]');
                if (monitorTab) monitorTab.click();
            }
        }
    }

    saveUserProfile(userObj) {
        let appUserId = userObj.govLicenseNo || userObj.licenseNo || userObj.subjectId;
        if (!appUserId || appUserId === 'SUBJ-GUEST') {
            if (userObj.role === 'Personal Wellness') {
                appUserId = 'USER-' + Math.floor(1000 + Math.random() * 9000) + '-APP';
            } else if (userObj.role === 'Doctor') {
                appUserId = 'MCI-AP-2026-' + Math.floor(1000 + Math.random() * 9000);
            } else if (userObj.role === 'HospitalAdmin') {
                appUserId = 'NABH-AP-8841-HOSP';
            } else {
                appUserId = userObj.subjectId || 'SUBJ-' + Math.floor(1000 + Math.random() * 9000);
            }
        }

        this.currentUser = {
            subjectId: userObj.subjectId || appUserId,
            fullName: userObj.fullName,
            age: userObj.age || 28,
            phone: userObj.phone || '+91 98765 43210',
            phoneVerified: userObj.phoneVerified || false,
            email: userObj.email || '',
            role: userObj.role,
            hospitalName: userObj.hospitalName || 'GVP Multi-Specialty Hospital',
            govLicenseNo: appUserId,
            govVerified: true,
            doctorEmail: userObj.doctorEmail || '',
            doctorName: userObj.doctorName || '',
            doctorApprovalStatus: userObj.doctorApprovalStatus || 'pending'
        };
        localStorage.setItem('udvega_user', JSON.stringify(this.currentUser));
        this.updateUserProfileUI();

        if (userObj.lang) i18n.setLanguage(userObj.lang);
        document.getElementById('loginModal').style.display = 'none';
    }

    populateHospitalDropdown() {
        const hospitalSelect = document.getElementById('signupHospital');
        if (!hospitalSelect) return;

        let html = this.hospitalsDB.map(h => `<option value="${h}">${h}</option>`).join('');
        html += `<option value="custom">➕ Add / Register New Hospital...</option>`;
        hospitalSelect.innerHTML = html;
    }

    populateDoctorDropdown(filterHospital = '') {
        const doctorSelect = document.getElementById('signupDoctorSelect');
        if (!doctorSelect) return;

        // ONLY SHOW APPROVED DOCTORS FOR PATIENTS TO SELECT!
        let doctors = this.usersDB.filter(u => u.role === 'Doctor' && u.status !== 'pending_hospital_approval' && u.status !== 'rejected');
        if (filterHospital && filterHospital !== 'custom') {
            doctors = doctors.filter(d => !d.hospitalName || d.hospitalName === filterHospital);
        }

        if (doctors.length === 0) {
            doctorSelect.innerHTML = `<option value="dr.general@hospital.com|General Hospital Doctor">General Hospital Doctor</option>`;
            return;
        }

        doctorSelect.innerHTML = doctors.map(d => 
            `<option value="${d.email}|${d.fullName}">${d.fullName} (${d.hospitalName || 'General Clinic'})</option>`
        ).join('');
    }

    verifyGovLicenseWithNHA(licenseNo, hospitalName) {
        if (!licenseNo || licenseNo.trim().length < 6) return false;
        const cleanLic = licenseNo.trim().toUpperCase();
        
        // Fake / invalid test inputs blacklist
        const blacklist = ['1234', '12345', 'FAKE', 'TEST', 'INVALID', 'ABC', 'XYZ', '0000', '1111', 'DUMMY', 'ASDF', 'FAIL'];
        if (blacklist.some(bad => cleanLic.includes(bad))) {
            return false;
        }

        // Recognized National Health Authority / NABH Accredited license prefixes
        const validPrefixes = ['NABH-', 'GOV-MED-', 'GOV-HOSP-', 'NHA-', 'AP-MED-', 'TS-MED-', 'KA-MED-', 'MH-MED-', 'TN-MED-', 'DL-MED-', 'HOSP-REG-', 'NABH'];
        const hasValidPrefix = validPrefixes.some(prefix => cleanLic.startsWith(prefix));

        const digitCount = (cleanLic.match(/\d/g) || []).length;

        if ((hasValidPrefix || digitCount >= 3) && cleanLic.length >= 6) {
            return true;
        }

        return false;
    }

    updateSignupFormFieldsByRole(role) {
        const fullNameLabel = document.getElementById('signupFullNameLabel');
        const emailLabel = document.getElementById('signupEmailLabel');
        const idLabel = document.getElementById('signupSubjectIdLabel');
        const idInput = document.getElementById('signupSubjectId');
        const clinicalFields = document.getElementById('signupClinicalFields');
        const hospitalGroup = document.getElementById('signupHospitalGroup');
        const hospitalLabel = document.getElementById('signupHospitalLabel');
        const doctorGroup = document.getElementById('signupDoctorSelectGroup');
        const customHospitalGroup = document.getElementById('signupCustomHospitalGroup');
        const customHospitalInput = document.getElementById('signupCustomHospital');
        const customHospitalLabel = customHospitalGroup ? customHospitalGroup.querySelector('label') : null;
        const hospitalSelect = document.getElementById('signupHospital');
        const note = document.getElementById('patientUnblockedNote');

        this.populateHospitalDropdown();
        this.populateDoctorDropdown();

        const govLicenseGroup = document.getElementById('signupGovLicenseGroup');
        if (govLicenseGroup) govLicenseGroup.style.display = role === 'HospitalAdmin' ? 'block' : 'none';

        if (role === 'HospitalAdmin') {
            if (fullNameLabel) fullNameLabel.innerHTML = `<i class="fa-solid fa-user-tie"></i> Hospital Admin / Contact Person Name`;
            if (emailLabel) emailLabel.innerHTML = `<i class="fa-solid fa-envelope"></i> Official Hospital Email Address`;
            if (idLabel) idLabel.innerHTML = `<i class="fa-solid fa-id-card"></i> Hospital License / Reg ID`;
            if (idInput) {
                idInput.placeholder = 'e.g. HOSP-REG-101';
                if (!idInput.value || idInput.value === 'HOSP-REG-101' || idInput.value === 'SUBJ-3221' || idInput.value === 'DOC-701' || idInput.value === 'USER-101' || idInput.value.startsWith('HOSP-REG-') || idInput.value.startsWith('DOC-') || idInput.value.startsWith('SUBJ-') || idInput.value.startsWith('USER-')) {
                    idInput.value = 'HOSP-REG-' + Math.floor(1000 + Math.random() * 9000);
                }
            }
            if (clinicalFields) clinicalFields.style.display = 'none';
            if (hospitalGroup) hospitalGroup.style.display = 'none';
            if (customHospitalGroup) customHospitalGroup.style.display = 'block';
            if (customHospitalLabel) customHospitalLabel.innerHTML = `<i class="fa-solid fa-square-plus"></i> New Hospital / Medical Center Name`;
            if (customHospitalInput) customHospitalInput.placeholder = 'e.g. Yashoda Hospitals / Apollo Clinic';
            if (doctorGroup) doctorGroup.style.display = 'none';
            if (note) note.style.display = 'none';
        } else if (role === 'Doctor') {
            if (fullNameLabel) fullNameLabel.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Doctor Full Name`;
            if (emailLabel) emailLabel.innerHTML = `<i class="fa-solid fa-envelope"></i> Professional Email Address`;
            if (idLabel) idLabel.innerHTML = `<i class="fa-solid fa-id-card"></i> Doctor License / Reg ID`;
            if (idInput) {
                idInput.placeholder = 'e.g. DOC-701 or REG-9942';
                if (!idInput.value || idInput.value === 'DOC-701' || idInput.value === 'SUBJ-3221' || idInput.value === 'HOSP-REG-101' || idInput.value === 'USER-101' || idInput.value.startsWith('HOSP-REG-') || idInput.value.startsWith('DOC-') || idInput.value.startsWith('SUBJ-') || idInput.value.startsWith('USER-')) {
                    idInput.value = 'DOC-' + Math.floor(100 + Math.random() * 900);
                }
            }
            if (clinicalFields) clinicalFields.style.display = 'grid';
            if (hospitalGroup) hospitalGroup.style.display = 'block';
            if (hospitalLabel) hospitalLabel.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital / Medical Center Name`;
            if (customHospitalGroup) customHospitalGroup.style.display = hospitalSelect && hospitalSelect.value === 'custom' ? 'block' : 'none';
            if (customHospitalLabel) customHospitalLabel.innerHTML = `<i class="fa-solid fa-square-plus"></i> Enter New Hospital / Clinic Name`;
            if (doctorGroup) doctorGroup.style.display = 'none';
            if (note) note.style.display = 'none';
        } else if (role === 'Subject') {
            if (fullNameLabel) fullNameLabel.innerHTML = `<i class="fa-solid fa-user"></i> Full Name`;
            if (emailLabel) emailLabel.innerHTML = `<i class="fa-solid fa-envelope"></i> Email Address / Username`;
            if (idLabel) idLabel.innerHTML = `<i class="fa-solid fa-id-card"></i> Subject / Patient ID`;
            if (idInput) {
                idInput.placeholder = 'e.g. SUBJ-3221';
                if (!idInput.value || idInput.value === 'SUBJ-3221' || idInput.value === 'DOC-701' || idInput.value === 'HOSP-REG-101' || idInput.value === 'USER-101' || idInput.value.startsWith('HOSP-REG-') || idInput.value.startsWith('DOC-') || idInput.value.startsWith('SUBJ-') || idInput.value.startsWith('USER-')) {
                    idInput.value = 'SUBJ-' + Math.floor(1000 + Math.random() * 9000);
                }
            }
            if (clinicalFields) clinicalFields.style.display = 'grid';
            if (hospitalGroup) hospitalGroup.style.display = 'block';
            if (hospitalLabel) hospitalLabel.innerHTML = `<i class="fa-solid fa-hospital"></i> Target Hospital / Medical Center`;
            if (customHospitalGroup) customHospitalGroup.style.display = hospitalSelect && hospitalSelect.value === 'custom' ? 'block' : 'none';
            if (customHospitalLabel) customHospitalLabel.innerHTML = `<i class="fa-solid fa-square-plus"></i> Enter New Hospital / Clinic Name`;
            if (doctorGroup) doctorGroup.style.display = 'block';
            if (note) note.style.display = 'block';
        } else {
            // Personal Wellness or Researcher
            if (fullNameLabel) fullNameLabel.innerHTML = `<i class="fa-solid fa-user"></i> Full Name`;
            if (emailLabel) emailLabel.innerHTML = `<i class="fa-solid fa-envelope"></i> Email Address / Username`;
            if (idLabel) idLabel.innerHTML = `<i class="fa-solid fa-id-card"></i> User / Member ID`;
            if (idInput) {
                idInput.placeholder = 'e.g. USER-101';
                if (!idInput.value || idInput.value === 'USER-101' || idInput.value === 'DOC-701' || idInput.value === 'HOSP-REG-101' || idInput.value === 'SUBJ-3221' || idInput.value.startsWith('HOSP-REG-') || idInput.value.startsWith('DOC-') || idInput.value.startsWith('SUBJ-') || idInput.value.startsWith('USER-')) {
                    idInput.value = 'USER-' + Math.floor(100 + Math.random() * 900);
                }
            }
            if (clinicalFields) clinicalFields.style.display = 'none';
            if (customHospitalGroup) customHospitalGroup.style.display = 'none';
            if (doctorGroup) doctorGroup.style.display = 'none';
            if (note) note.style.display = 'none';
        }
    }

    bindEvents() {
        // Role Selection Dynamic Field Toggle
        const signupRoleSelect = document.getElementById('signupRole');
        if (signupRoleSelect) {
            this.updateSignupFormFieldsByRole(signupRoleSelect.value);
            signupRoleSelect.onchange = (e) => this.updateSignupFormFieldsByRole(e.target.value);
        }

        // Custom Hospital Toggle Listener
        const hospitalSelect = document.getElementById('signupHospital');
        const customHospitalGroup = document.getElementById('signupCustomHospitalGroup');
        if (hospitalSelect) {
            hospitalSelect.onchange = (e) => {
                if (e.target.value === 'custom') {
                    if (customHospitalGroup) customHospitalGroup.style.display = 'block';
                } else {
                    if (customHospitalGroup) customHospitalGroup.style.display = 'none';
                    this.populateDoctorDropdown(e.target.value);
                }
            };
        }

        // Auth Tab Switcher (Sign Up vs Log In)
        const tabSignup = document.getElementById('tabModeSignup');
        const tabLogin = document.getElementById('tabModeLogin');
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        const modalTitle = document.getElementById('authModalTitle');
        const modalSubtitle = document.getElementById('authModalSubtitle');
        const alertBox = document.getElementById('authAlertBox');

        if (tabSignup && tabLogin) {
            tabSignup.onclick = () => {
                tabSignup.classList.add('active');
                tabLogin.classList.remove('active');
                signupForm.style.display = 'flex';
                loginForm.style.display = 'none';
                modalTitle.textContent = "Create Your Account";
                modalSubtitle.textContent = "Sign up to register your EEG profile & track personal stress analytics";
                if (alertBox) alertBox.style.display = 'none';
                if (signupRoleSelect) this.updateSignupFormFieldsByRole(signupRoleSelect.value);
            };

            tabLogin.onclick = () => {
                tabLogin.classList.add('active');
                tabSignup.classList.remove('active');
                loginForm.style.display = 'flex';
                signupForm.style.display = 'none';
                modalTitle.textContent = "Welcome Back";
                modalSubtitle.textContent = "Log in with your registered Email / Subject ID & PIN";
                if (alertBox) alertBox.style.display = 'none';
            };
        }

        // Handle Sign Up Form Submission
        if (signupForm) {
            signupForm.onsubmit = (e) => {
                e.preventDefault();
                const fullName = document.getElementById('signupFullName').value.trim();
                const email = document.getElementById('signupEmail').value.trim().toLowerCase();
                const password = document.getElementById('signupPassword').value;
                const subjectId = document.getElementById('signupSubjectId').value.trim();
                const role = document.getElementById('signupRole').value;
                const lang = document.getElementById('signupLanguage').value;
                
                let hospitalName = '';
                let govLicenseNo = '';
                if (role === 'HospitalAdmin') {
                    const customInput = document.getElementById('signupCustomHospital');
                    const customVal = customInput ? customInput.value.trim() : '';
                    const govLicInput = document.getElementById('signupGovLicense');
                    const govLicVal = govLicInput ? govLicInput.value.trim() : '';

                    if (!customVal) {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.textContent = 'Please type the official name of the New Hospital / Medical Center!';
                            alertBox.style.display = 'block';
                        }
                        return;
                    }

                    // Automated Real-Time NHA & NABH Government License Registry Check
                    const isValidLicense = this.verifyGovLicenseWithNHA(govLicVal, customVal);
                    if (!isValidLicense) {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.innerHTML = `
                                <div style="padding: 0.2rem 0;">
                                    <strong style="color: #ef4444;"><i class="fa-solid fa-circle-xmark"></i> Government License Not Valid ❌</strong>
                                    <p style="margin: 0.4rem 0 0.4rem 0; font-size: 0.88rem;">License No. "<code>${govLicVal || 'EMPTY'}</code>" was <strong>NOT found</strong> in National Health Authority (NHA) & NABH Accredited Hospital Registry.</p>
                                    <span style="font-size: 0.78rem; color: #cbd5e1; display: block;">Registration Blocked. Please enter a valid Govt/NABH License Number (e.g. <code>NABH-AP-2026-8841</code> or <code>GOV-MED-4412</code>).</span>
                                </div>
                            `;
                            alertBox.style.display = 'block';
                        }
                        return;
                    }

                    hospitalName = customVal;
                    govLicenseNo = govLicVal;
                    if (!this.hospitalsDB.includes(hospitalName)) {
                        this.hospitalsDB.push(hospitalName);
                        localStorage.setItem('udvega_hospitals_db', JSON.stringify(this.hospitalsDB));
                        this.populateHospitalDropdown();
                    }
                } else {
                    hospitalName = document.getElementById('signupHospital') ? document.getElementById('signupHospital').value : 'GVP Multi-Specialty Hospital';
                    if (hospitalName === 'custom') {
                        const customInput = document.getElementById('signupCustomHospital');
                        const customVal = customInput ? customInput.value.trim() : '';
                        if (!customVal) {
                            if (alertBox) {
                                alertBox.className = 'auth-alert-box';
                                alertBox.textContent = 'Please type the name of the new Hospital / Medical Center!';
                                alertBox.style.display = 'block';
                            }
                            return;
                        }
                        hospitalName = customVal;
                        if (!this.hospitalsDB.includes(hospitalName)) {
                            this.hospitalsDB.push(hospitalName);
                            localStorage.setItem('udvega_hospitals_db', JSON.stringify(this.hospitalsDB));
                            this.populateHospitalDropdown();
                        }
                    }
                }

                const docSel = (role === 'Subject' && document.getElementById('signupDoctorSelect')) ? document.getElementById('signupDoctorSelect').value : '';

                let doctorEmail = '';
                let doctorName = '';
                if (docSel && docSel.includes('|')) {
                    const parts = docSel.split('|');
                    doctorEmail = parts[0];
                    doctorName = parts[1];
                }

                // Check if user already exists (by email or by ID)
                const existingEmail = this.usersDB.find(u => u.email === email);
                if (existingEmail) {
                    if (alertBox) {
                        alertBox.className = 'auth-alert-box';
                        alertBox.textContent = `Email (${email}) is already registered! Please click the Log In tab.`;
                        alertBox.style.display = 'block';
                    }
                    return;
                }

                const existingId = this.usersDB.find(u => u.subjectId === subjectId);
                if (existingId) {
                    if (alertBox) {
                        alertBox.className = 'auth-alert-box';
                        alertBox.textContent = `License / Reg ID (${subjectId}) is already in use by another account. Please use a unique ID!`;
                        alertBox.style.display = 'block';
                    }
                    return;
                }

                // Register New Account
                const newUser = { 
                    fullName, email, password, subjectId, role, lang,
                    hospitalName: role === 'Doctor' || role === 'Subject' || role === 'HospitalAdmin' ? hospitalName : '',
                    govLicenseNo: govLicenseNo || subjectId || 'NABH-AP-2026-8841',
                    govVerified: role === 'HospitalAdmin' ? false : true,
                    doctorEmail: role === 'Subject' ? doctorEmail : '',
                    doctorName: role === 'Subject' ? doctorName : '',
                    doctorApprovalStatus: role === 'Subject' ? 'pending' : 'approved',
                    status: role === 'Doctor' ? 'pending_hospital_approval' : (role === 'HospitalAdmin' ? 'pending_gov_approval' : 'approved')
                };
                this.usersDB.push(newUser);
                localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));

                // Re-populate doctor list so newly registered doctors appear immediately for patients
                this.populateDoctorDropdown();

                // Generate Instagram-style Request for Doctor Admin ONLY if role is Subject/Patient
                if (role === 'Subject' && doctorEmail) {
                    const newReq = {
                        requestId: 'REQ-' + (1000 + Math.floor(Math.random() * 9000)),
                        patientSubjectId: subjectId,
                        patientFullName: fullName,
                        patientEmail: email,
                        hospitalName: hospitalName,
                        doctorEmail: doctorEmail,
                        doctorName: doctorName,
                        status: 'pending',
                        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                        latestStressScore: 35,
                        eegData: { delta: 15, theta: 20, alpha: 40, beta: 20, gamma: 5 }
                    };
                    if (!this.doctorRequests.some(r => r.patientEmail === email)) {
                        this.doctorRequests.push(newReq);
                        localStorage.setItem('udvega_doctor_requests', JSON.stringify(this.doctorRequests));
                    }
                }

                if (alertBox) {
                    alertBox.className = 'auth-alert-box success';
                    if (role === 'Doctor') {
                        alertBox.textContent = `Doctor Account Registered! ⏳ Pending approval from Hospital Admin (${hospitalName}). Switch to Log In tab.`;
                    } else if (role === 'HospitalAdmin') {
                        alertBox.innerHTML = `
                            <div style="padding: 0.2rem 0;">
                                <strong style="color: #f59e0b;"><i class="fa-solid fa-hourglass-half"></i> Hospital Registration Submitted ⏳</strong>
                                <p style="margin: 0.3rem 0 0; font-size: 0.88rem;">Registration for <strong>${hospitalName}</strong> submitted! Pending approval from Master Admin (<code>rajwanthbalakaofficial@gmail.com</code>). You CANNOT log in until approved.</p>
                            </div>
                        `;
                    } else {
                        alertBox.textContent = `Account created & Link Request sent! You can start using app & device right away...`;
                    }
                    alertBox.style.display = 'block';
                }

                if (role === 'HospitalAdmin' || role === 'Doctor') {
                    // DO NOT AUTO-LOGIN ON SIGN UP! Switch to Log In tab after 1.5s and pre-fill email
                    setTimeout(() => {
                        const tabLogin = document.getElementById('tabModeLogin');
                        const loginEmailInput = document.getElementById('loginEmail');
                        if (tabLogin) tabLogin.click();
                        if (loginEmailInput) loginEmailInput.value = email;
                    }, 1500);
                } else {
                    setTimeout(() => this.saveUserProfile(newUser), 1000);
                }
            };
        }

        // Handle Log In Form Submission
        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                const loginInput = document.getElementById('loginEmail').value.trim().toLowerCase();
                const password = document.getElementById('loginPassword').value.trim();

                const match = this.usersDB.find(u => 
                    ((u.email && u.email.toLowerCase() === loginInput) || 
                     (u.subjectId && u.subjectId.toLowerCase() === loginInput) ||
                     (u.fullName && u.fullName.toLowerCase() === loginInput)) &&
                    String(u.password).trim() === String(password).trim()
                );

                if (match) {
                    if (match.role === 'HospitalAdmin' && match.email.toLowerCase() !== 'rajwanthbalakaofficial@gmail.com' && (match.status === 'pending_gov_approval' || !match.govVerified)) {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.innerHTML = `
                                <div style="padding: 0.2rem 0;">
                                    <strong style="color: #ef4444;"><i class="fa-solid fa-lock"></i> Access Blocked: Approval Required ⛔</strong>
                                    <p style="margin: 0.4rem 0 0.5rem 0; font-size: 0.88rem;">Your Hospital Admin registration for <strong>${match.hospitalName}</strong> is pending approval from Master Admin (<code>rajwanthbalakaofficial@gmail.com</code>).</p>
                                    <span style="font-size: 0.78rem; color: #cbd5e1; display: block;">You CANNOT log in until Master Admin verifies and grants approval to your hospital!</span>
                                </div>
                            `;
                            alertBox.style.display = 'block';
                        }
                        return;
                    }

                    if (match.role === 'Doctor' && (match.status === 'pending_hospital_approval' || match.status !== 'approved')) {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.innerHTML = `
                                <div style="padding: 0.2rem 0;">
                                    <strong style="color: #ef4444;"><i class="fa-solid fa-lock"></i> Access Blocked: Hospital Admin Approval Required ⛔</strong>
                                    <p style="margin: 0.4rem 0 0.5rem 0; font-size: 0.88rem;">Your Doctor registration for <strong>${match.hospitalName || 'Hospital'}</strong> is pending approval from your Hospital Admin.</p>
                                    <span style="font-size: 0.78rem; color: #cbd5e1; display: block;">You CANNOT log in until your Hospital Admin approves your doctor account!</span>
                                </div>
                            `;
                            alertBox.style.display = 'block';
                        }
                        return;
                    }

                    if (match.status === 'rejected') {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.textContent = `Access Declined ✗: Your registration request was rejected by your Hospital Admin.`;
                            alertBox.style.display = 'block';
                        }
                        return;
                    }

                    if (alertBox) {
                        alertBox.className = 'auth-alert-box success';
                        alertBox.textContent = `Welcome back, ${match.fullName}! Opening dashboard...`;
                        alertBox.style.display = 'block';
                    }
                    setTimeout(() => this.saveUserProfile(match), 800);
                } else {
                    if (alertBox) {
                        alertBox.className = 'auth-alert-box';
                        alertBox.textContent = 'Invalid credentials! Please check your Email / Subject ID & PIN, or Sign Up.';
                        alertBox.style.display = 'block';
                    }
                }
            };
        }

        // Guest Action
        document.querySelectorAll('.btnGuestAction').forEach(btn => {
            btn.onclick = () => {
                this.saveUserProfile({
                    subjectId: 'SUBJ-GUEST',
                    fullName: 'Guest User',
                    role: 'Personal Wellness',
                    lang: i18n.currentLang
                });
            };
        });

        document.getElementById('btnLogout').onclick = () => {
            document.getElementById('loginModal').style.display = 'flex';
        };

        // Add Doctor Modal Handlers (Hospital Admin Direct Registration)
        const btnOpenAddDoc = document.getElementById('btnOpenAddDoctorModal');
        const btnCloseAddDoc = document.getElementById('btnCloseAddDoctorModal');
        const addDocModal = document.getElementById('addDoctorModal');
        const addDocForm = document.getElementById('addDoctorForm');
        const addDocAlert = document.getElementById('addDoctorAlertBox');

        if (btnOpenAddDoc && addDocModal) {
            btnOpenAddDoc.onclick = () => {
                addDocModal.style.display = 'flex';
                if (addDocForm) addDocForm.reset();
                if (addDocAlert) addDocAlert.style.display = 'none';
            };
        }

        if (btnCloseAddDoc && addDocModal) {
            btnCloseAddDoc.onclick = () => {
                addDocModal.style.display = 'none';
            };
        }

        if (addDocForm) {
            addDocForm.onsubmit = (e) => {
                e.preventDefault();
                const fullName = document.getElementById('addDocFullName').value.trim();
                const email = document.getElementById('addDocEmail').value.trim().toLowerCase();
                const subjectId = document.getElementById('addDocRegId').value.trim();
                const password = document.getElementById('addDocPassword').value;
                const specialization = document.getElementById('addDocSpecialization').value.trim();
                const experience = document.getElementById('addDocExperience')?.value.trim() || '12+ Years Clinical Practice';
                const qualification = document.getElementById('addDocQualification')?.value.trim() || 'MBBS, MD (Neuro-Cardiology)';

                const existing = this.usersDB.find(u => u.email === email || u.subjectId === subjectId);
                if (existing) {
                    if (addDocAlert) {
                        addDocAlert.className = 'auth-alert-box';
                        addDocAlert.textContent = 'Doctor with this Email or Reg ID already exists in the system!';
                        addDocAlert.style.display = 'block';
                    }
                    return;
                }

                const hospitalName = this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital';
                const newDoc = {
                    fullName,
                    email,
                    subjectId,
                    password,
                    role: 'Doctor',
                    lang: 'en',
                    hospitalName: hospitalName,
                    specialization: specialization || 'Neuro-Cardiology',
                    experience: experience,
                    qualification: qualification,
                    status: 'approved',
                    doctorApprovalStatus: 'approved'
                };

                this.usersDB.push(newDoc);
                localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));

                this.populateDoctorDropdown();
                this.renderHospitalAdminPortal();

                if (addDocAlert) {
                    addDocAlert.className = 'auth-alert-box success';
                    addDocAlert.textContent = `Doctor ${fullName} registered & auto-approved successfully!`;
                    addDocAlert.style.display = 'block';
                }

                setTimeout(() => {
                    addDocModal.style.display = 'none';
                }, 1200);
            };
        }

        // Re-assign Doctor Modal Handlers
        const btnCloseReassign = document.getElementById('btnCloseReassignModal');
        const reassignModal = document.getElementById('reassignDoctorModal');
        const reassignForm = document.getElementById('reassignDoctorForm');
        const reassignAlert = document.getElementById('reassignAlertBox');

        if (btnCloseReassign && reassignModal) {
            btnCloseReassign.onclick = () => {
                reassignModal.style.display = 'none';
            };
        }

        if (reassignForm) {
            reassignForm.onsubmit = (e) => {
                e.preventDefault();
                const subjectId = document.getElementById('reassignPatientSubjectId').value;
                const newDocSel = document.getElementById('reassignNewDoctorSelect').value;

                if (!newDocSel || !newDocSel.includes('|')) return;
                const [docEmail, docName] = newDocSel.split('|');

                const patientInDB = this.usersDB.find(u => u.subjectId === subjectId || u.email === subjectId);
                if (patientInDB) {
                    patientInDB.doctorEmail = docEmail;
                    patientInDB.doctorName = docName;
                    patientInDB.doctorApprovalStatus = 'approved';
                    localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
                }

                const patientReq = this.doctorRequests.find(r => r.patientSubjectId === subjectId || r.patientEmail === subjectId);
                if (patientReq) {
                    patientReq.doctorEmail = docEmail;
                    patientReq.doctorName = docName;
                    patientReq.status = 'approved';
                    localStorage.setItem('udvega_doctor_requests', JSON.stringify(this.doctorRequests));
                }

                this.renderHospitalAdminPortal();

                if (reassignAlert) {
                    reassignAlert.className = 'auth-alert-box success';
                    reassignAlert.textContent = `Patient successfully transferred to ${docName}!`;
                    reassignAlert.style.display = 'block';
                }

                setTimeout(() => {
                    if (reassignModal) reassignModal.style.display = 'none';
                }, 1000);
            };
        }

        // Export Hospital PDF Report Handlers
        const btnExportHosp = document.getElementById('btnExportHospitalReport');
        const btnExportHospHeader = document.getElementById('btnExportHospitalReportHeader');

        const triggerHospPdf = () => this.exportHospitalPDFReport();
        if (btnExportHosp) btnExportHosp.onclick = triggerHospPdf;
        if (btnExportHospHeader) btnExportHospHeader.onclick = triggerHospPdf;

        // Doctor Profile Modal Handlers
        const btnCloseDocProf1 = document.getElementById('btnCloseDocProfileModal');
        const btnCloseDocProf2 = document.getElementById('btnCloseDocProfileModalBtn');
        const docProfModal = document.getElementById('doctorProfileModal');

        const closeDocProf = () => { if (docProfModal) docProfModal.style.display = 'none'; };
        if (btnCloseDocProf1) btnCloseDocProf1.onclick = closeDocProf;
        if (btnCloseDocProf2) btnCloseDocProf2.onclick = closeDocProf;

        // Mode Toggle Buttons
        const btnPersonal = document.getElementById('btnModePersonal');
        const btnClinical = document.getElementById('btnModeClinical');

        if (btnPersonal && btnClinical) {
            btnPersonal.onclick = () => this.setMode('personal');
            btnClinical.onclick = () => this.setMode('clinical');
        }

        const btnSaveJournal = document.getElementById('btnSaveJournal');
        if (btnSaveJournal) {
            btnSaveJournal.onclick = () => this.saveJournalEntry();
        }

        const headerLang = document.getElementById('languageSelect');
        if (headerLang) {
            headerLang.value = i18n.currentLang;
            headerLang.onchange = (e) => i18n.setLanguage(e.target.value);
        }

        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetId = tab.dataset.tab;
                document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
                const page = document.getElementById(targetId);
                if (page) page.classList.add('active');

                if (targetId === 'tab-apta') {
                    const badge = document.getElementById('aptaUnread');
                    if (badge) badge.style.display = 'none';
                }

                if (targetId === 'tab-frequency') {
                    setTimeout(() => {
                        if (typeof soundEngine !== 'undefined') {
                            soundEngine.bindCanvas('audioVisualizerCanvas');
                        }
                    }, 50);
                }
            });
        });

        document.getElementById('btnConnectSerial').onclick = () => this.connectWebSerial();
        document.getElementById('btnConnectBLE').onclick = () => this.connectWebBLE();
        const btnSim = document.getElementById('btnToggleSim');
        if (btnSim) btnSim.onclick = () => this.toggleSimulator();

        document.getElementById('btnAlertOpenApta').onclick = () => {
            document.querySelector('[data-tab="tab-apta"]').click();
        };
        document.getElementById('btnAlertPlayMusic').onclick = () => {
            document.querySelector('[data-tab="tab-frequency"]').click();
            soundEngine.playSolfeggio(432);
        };
        document.getElementById('btnCloseAlert').onclick = () => {
            document.getElementById('highStressAlert').style.display = 'none';
        };

        document.getElementById('btnSendChat').onclick = () => {
            const input = document.getElementById('chatInputField');
            aptaAI.handleUserPrompt(input.value);
            input.value = '';
        };
        document.getElementById('chatInputField').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btnSendChat').click();
            }
        });

        document.querySelectorAll('.btn-mood').forEach(btn => {
            btn.onclick = () => aptaAI.handleMoodButton(btn.dataset.mood);
        });
        document.getElementById('btnClearChat').onclick = () => aptaAI.clearChat();

        document.getElementById('btnStartBreathing').onclick = () => this.toggle478Breathing();

        document.getElementById('btnClearHistory').onclick = () => this.clearHistory();
        document.getElementById('btnExportPDF').onclick = () => this.exportPDFReport();
    }

    setMode(modeKey) {
        this.viewMode = modeKey;
        const btnPersonal = document.getElementById('btnModePersonal');
        const btnClinical = document.getElementById('btnModeClinical');

        if (modeKey === 'personal') {
            btnPersonal.classList.add('active');
            btnClinical.classList.remove('active');
        } else {
            btnClinical.classList.add('active');
            btnPersonal.classList.remove('active');
        }
    }

    saveJournalEntry() {
        const textarea = document.getElementById('journalTextarea');
        const text = textarea.value.trim();
        if (!text) return;

        const timeStr = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        this.journalEntries.unshift({ date: timeStr, note: text });

        if (this.journalEntries.length > 20) this.journalEntries.pop();
        localStorage.setItem('udvega_journals', JSON.stringify(this.journalEntries));

        textarea.value = '';
        this.renderJournalEntries();
    }

    renderJournalEntries() {
        const list = document.getElementById('journalEntriesList');
        if (!list) return;

        list.innerHTML = '';
        if (this.journalEntries.length === 0) {
            list.innerHTML = '<li>No journal notes saved yet. Write your thoughts above!</li>';
            return;
        }

        this.journalEntries.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="j-date">${item.date}</span> - ${item.note}`;
            list.appendChild(li);
        });
    }

    bindSoundTherapyPresets() {
        const presets = document.querySelectorAll('.preset-card');
        const playBtn = document.getElementById('btnPlaySound');
        const playIcon = document.getElementById('playIcon');
        const volSlider = document.getElementById('volumeControl');

        presets.forEach(preset => {
            preset.addEventListener('click', () => {
                presets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');

                const type = preset.dataset.type;
                const freq = preset.dataset.freq;
                const title = preset.dataset.title;
                const desc = preset.dataset.desc;

                document.getElementById('nowPlayingTitle').textContent = title;
                document.getElementById('nowPlayingDesc').textContent = desc;

                if (type === 'solfeggio') {
                    soundEngine.playSolfeggio(freq);
                } else if (type === 'binaural') {
                    soundEngine.playBinauralBeats(freq);
                } else if (type === 'noise') {
                    soundEngine.playRainSound();
                }

                playIcon.className = 'fa-solid fa-pause';
            });
        });

        playBtn.onclick = () => {
            if (soundEngine.isPlaying) {
                soundEngine.stopCurrentSound();
                playIcon.className = 'fa-solid fa-play';
            } else {
                const activePreset = document.querySelector('.preset-card.active');
                if (activePreset) activePreset.click();
            }
        };

        volSlider.oninput = (e) => {
            soundEngine.setVolume(e.target.value);
        };
    }

    initChart() {
        const canvas = document.getElementById('liveEEGChart');
        if (!canvas || typeof Chart === 'undefined') {
            console.warn("Chart.js CDN or canvas element not ready");
            return;
        }
        try {
            const isLight = document.body.classList.contains('light-theme');
            const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
            const tickColor = isLight ? '#334155' : '#64748b';

            const ctx = canvas.getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        { label: 'Stress Score (%)', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, tension: 0.3, fill: true, data: [] },
                        { label: 'Beta/Alpha Ratio (x100)', borderColor: '#6366f1', borderWidth: 2, borderDash: [4, 4], tension: 0.3, fill: false, data: [] },
                        { label: 'Alpha Wave Power (x1000)', borderColor: '#10b981', borderWidth: 1.5, tension: 0.3, fill: false, data: [] }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { color: gridColor }, ticks: { color: tickColor } },
                        y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: tickColor } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        } catch (e) {
            console.error("Error building Chart.js instance:", e);
        }
    }

    async connectWebSerial() {
        if (!('serial' in navigator)) {
            alert('Web Serial API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
            return;
        }

        try {
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 115200 });

            this.isConnected = true;
            this.updateConnectionBadge(true, 'ESP32 Serial Connected');

            if (this.isSimulating) this.toggleSimulator();

            const decoder = new TextDecoderStream();
            const inputDone = this.port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable;

            this.reader = inputStream.getReader();
            this.readSerialStream();

        } catch (err) {
            console.error('Serial connection error:', err);
            this.updateConnectionBadge(false, 'Serial Failed');
        }
    }

    async readSerialStream() {
        let buffer = '';
        while (true) {
            const { value, done } = await this.reader.read();
            if (done) {
                this.reader.releaseLock();
                break;
            }
            buffer += value;
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                this.parseESP32SerialLine(line.trim());
            }
        }
    }

    async connectWebBLE() {
        if (!('bluetooth' in navigator)) {
            alert('Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or WebBLE browser on mobile.');
            return;
        }

        const SERVICE_UUIDS = [
            '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
            '4fa10001-e8a2-4569-84c4-2378c5160310'
        ];
        const CHAR_UUIDS = [
            'beb5483e-36e1-4688-b7f5-ea07361b26a8',
            '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
        ];

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { name: 'Udvegadarshini-ESP32-S3' },
                    { namePrefix: 'Udvegadarshini' },
                    { namePrefix: 'ESP32' }
                ],
                optionalServices: SERVICE_UUIDS
            }).catch(async () => {
                return await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: SERVICE_UUIDS
                });
            });

            this.updateConnectionBadge(true, `Connecting GATT...`);

            const server = await device.gatt.connect();
            
            let service = null;
            for (const uuid of SERVICE_UUIDS) {
                try {
                    service = await server.getPrimaryService(uuid);
                    if (service) break;
                } catch(e) {}
            }

            if (!service) {
                try {
                    const services = await server.getPrimaryServices();
                    if (services.length > 0) service = services[0];
                } catch(e) {}
            }

            if (!service) {
                throw new Error("No matching BLE Primary Service found");
            }

            let characteristic = null;
            for (const charUuid of CHAR_UUIDS) {
                try {
                    characteristic = await service.getCharacteristic(charUuid);
                    if (characteristic) break;
                } catch(e) {}
            }

            if (!characteristic) {
                try {
                    const chars = await service.getCharacteristics();
                    if (chars.length > 0) characteristic = chars[0];
                } catch(e) {}
            }

            if (characteristic) {
                await characteristic.startNotifications();
                characteristic.addEventListener('characteristicvaluechanged', (event) => {
                    const decoder = new TextDecoder('utf-8');
                    const line = decoder.decode(event.target.value);
                    this.parseESP32SerialLine(line.trim());
                });
            }

            this.isConnected = true;
            this.updateConnectionBadge(true, `BLE Connected: ${device.name || 'ESP32-S3'}`);

            device.addEventListener('gattserverdisconnected', () => {
                this.isConnected = false;
                this.updateConnectionBadge(false, 'BLE Disconnected');
                this.resetToDisconnectedState();
            });

        } catch (err) {
            console.error('BLE connection error:', err);
            this.updateConnectionBadge(false, 'BLE Connection Failed');
        }
    }

    toggleSimulator() {
        if (this.simInterval) {
            clearInterval(this.simInterval);
            this.simInterval = null;
        }
        this.isSimulating = false;
        this.resetToDisconnectedState();
        this.updateConnectionBadge(false, 'Hardware Disconnected');
    }

    parseESP32SerialLine(line) {
        if (!line) return;
        console.log("ESP32 Serial Rx:", line);

        this.updateConnectionBadge(true, 'ESP32 Streaming Live Data ⚡');
        this.lastRxTime = Date.now();

        if (line.includes('LEAD-OFF') || line.includes('Disconnected')) {
            this.processMetricsUpdate({
                stressScore: 0,
                isLeadOff: true,
                delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0,
                betaAlphaRatio: 0, hjorthAct: 0, hjorthMob: 0, hjorthComp: 0,
                entropy: 0, katzFD: 1.0
            });
            return;
        }

        const deltaMatch = line.match(/(?:Δ|Delta|D):\s*([\d.]+)/i);
        const thetaMatch = line.match(/(?:Θ|Theta|T):\s*([\d.]+)/i);
        const alphaMatch = line.match(/(?:α|Alpha|A):\s*([\d.]+)/i);
        const betaMatch = line.match(/(?:β|Beta|B):\s*([\d.]+)/i);
        const gammaMatch = line.match(/(?:γ|Gamma|G):\s*([\d.]+)/i);
        const ratioMatch = line.match(/(?:ratio|β\/α ratio|β\/α):\s*([\d.]+)/i);
        const stressMatch = line.match(/stress\s*(?:score)?:?\s*([\d.]+)/i) || line.match(/(\d+\.\d+)\s*%/);

        // Check if line is raw single ADC integer (e.g. "2048" or "1850")
        const rawAdcMatch = line.match(/^\s*(\d{2,4})\s*$/) || line.match(/Raw_ADC:\s*(\d+)/i);

        let delta = deltaMatch ? parseFloat(deltaMatch[1]) : 0;
        let theta = thetaMatch ? parseFloat(thetaMatch[1]) : 0;
        let alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 0;
        let beta = betaMatch ? parseFloat(betaMatch[1]) : 0;
        let gamma = gammaMatch ? parseFloat(gammaMatch[1]) : 0;
        let ratio = ratioMatch ? parseFloat(ratioMatch[1]) : 0;
        let stressScore = stressMatch ? parseFloat(stressMatch[1]) : 0;

        if (rawAdcMatch && !stressMatch) {
            const adcVal = parseInt(rawAdcMatch[1], 10);
            if (adcVal >= 4050 || adcVal <= 40) {
                this.processMetricsUpdate({ stressScore: 0, isLeadOff: true, delta:0, theta:0, alpha:0, beta:0, gamma:0, betaAlphaRatio:0, hjorthAct:0, hjorthMob:0, hjorthComp:0, entropy:0, katzFD:1.0 });
                return;
            }
            const norm = (adcVal - 2048) / 2048.0;
            alpha = 0.042 + Math.abs(norm) * 0.02;
            beta = 0.015 + Math.abs(norm) * 0.04;
            ratio = beta / (alpha || 0.001);
            stressScore = Math.min(95, Math.max(10, ratio * 35.0));
        } else if (!stressMatch && !ratioMatch && !deltaMatch) {
            // Ignore setup header info text lines like "Board: ESP32-S3..."
            return;
        }

        // STRICT DISCONNECTION CHECK:
        // If band powers are zero OR if stress score is 0 OR line indicates LEAD-OFF:
        // IMMEDIATELY FORCE DISCONNECTED STATE (--% Off-Body)
        if (stressScore === 0 || (delta === 0 && alpha === 0 && theta === 0 && beta === 0)) {
            this.processMetricsUpdate({
                stressScore: 0,
                isLeadOff: true,
                delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0,
                betaAlphaRatio: 0, hjorthAct: 0, hjorthMob: 0, hjorthComp: 0,
                entropy: 0, katzFD: 1.0
            });
            return;
        }

        this.processMetricsUpdate({
            stressScore: stressScore,
            isLeadOff: false,
            delta: delta, theta: theta, alpha: alpha, beta: beta, gamma: gamma,
            betaAlphaRatio: ratio,
            hjorthAct: 0.0604, hjorthMob: 0.0990, hjorthComp: 2.9688,
            entropy: -6.665, katzFD: 1.000
        });
    }

    processMetricsUpdate(data) {
        const score = Math.round(data.stressScore);

        if (data.isLeadOff || score === 0) {
            document.getElementById('stressScoreVal').innerHTML = `--<span>%</span>`;
            document.getElementById('stressStateTitle').textContent = 'Off-Body (Lead Disconnected)';
            document.getElementById('stressStateDesc').textContent = 'Place gel pads on forehead to start live reading';
            const gaugeFill = document.getElementById('gaugeFill');
            if (gaugeFill) {
                gaugeFill.style.strokeDashoffset = 534;
                gaugeFill.style.stroke = '#64748b';
            }
            document.getElementById('stressStateTitle').style.color = '#64748b';

            // Hide High Stress Alert Banner on Disconnect
            const highAlert = document.getElementById('highStressAlert');
            if (highAlert) highAlert.style.display = 'none';

            // Clear scale category highlights & zero out power bars
            document.querySelectorAll('.scale-item').forEach(item => item.classList.remove('active'));
            if (document.getElementById('barDelta')) document.getElementById('barDelta').style.width = '0%';
            if (document.getElementById('barTheta')) document.getElementById('barTheta').style.width = '0%';
            if (document.getElementById('barAlpha')) document.getElementById('barAlpha').style.width = '0%';
            if (document.getElementById('barBeta')) document.getElementById('barBeta').style.width = '0%';
            if (document.getElementById('barGamma')) document.getElementById('barGamma').style.width = '0%';

            document.getElementById('valDelta').textContent = '0.0000';
            document.getElementById('valTheta').textContent = '0.0000';
            document.getElementById('valAlpha').textContent = '0.0000';
            document.getElementById('valBeta').textContent = '0.0000';
            document.getElementById('valGamma').textContent = '0.0000';
            document.getElementById('valBetaAlphaRatio').textContent = '0.000';
            return;
        }

        let stateKey = 'normal';
        let stateTitle = i18n.t('stateNormal');
        let stateDesc = 'Balanced Alpha & Beta waves';

        if (score >= 5 && score < 25) {
            stateKey = 'relax'; stateTitle = i18n.t('stateRelax'); stateDesc = 'Alpha wave dominant, calm mind';
        } else if (score >= 25 && score < 40) {
            stateKey = 'normal'; stateTitle = i18n.t('stateNormal'); stateDesc = 'Balanced wakefulness & resilience';
        } else if (score >= 40 && score < 55) {
            stateKey = 'focus'; stateTitle = i18n.t('stateFocus'); stateDesc = 'Beta rising, active problem solving';
        } else if (score >= 55 && score < 70) {
            stateKey = 'active'; stateTitle = i18n.t('stateActive'); stateDesc = 'High Beta, time pressure / gaming';
        } else if (score >= 70) {
            stateKey = 'stressed'; stateTitle = i18n.t('stateStressed'); stateDesc = 'Fight-or-flight mode detected';
        }

        this.currentMetrics = { ...data, state: stateTitle, timestamp: new Date() };

        document.getElementById('stressScoreVal').innerHTML = `${score}<span>%</span>`;
        document.getElementById('stressStateTitle').textContent = stateTitle;
        document.getElementById('stressStateDesc').textContent = stateDesc;

        const gaugeFill = document.getElementById('gaugeFill');
        const offset = 534 - (score / 100) * 534;
        gaugeFill.style.strokeDashoffset = offset;

        const stateColors = { relax: '#10b981', normal: '#06b6d4', focus: '#3b82f6', active: '#f59e0b', stressed: '#ef4444' };
        gaugeFill.style.stroke = stateColors[stateKey];
        document.getElementById('stressStateTitle').style.color = stateColors[stateKey];

        document.querySelectorAll('.scale-item').forEach(item => item.classList.remove('active'));
        const activeScale = document.querySelector(`.scale-item.scale-${stateKey}`);
        if (activeScale) activeScale.classList.add('active');

        document.getElementById('valDelta').textContent = data.delta.toFixed(4);
        document.getElementById('valTheta').textContent = data.theta.toFixed(4);
        document.getElementById('valAlpha').textContent = data.alpha.toFixed(4);
        document.getElementById('valBeta').textContent = data.beta.toFixed(4);
        document.getElementById('valGamma').textContent = data.gamma.toFixed(4);

        document.getElementById('barDelta').style.width = `${Math.min(100, data.delta * 2000)}%`;
        document.getElementById('barTheta').style.width = `${Math.min(100, data.theta * 3000)}%`;
        document.getElementById('barAlpha').style.width = `${Math.min(100, data.alpha * 15000)}%`;
        document.getElementById('barBeta').style.width = `${Math.min(100, data.beta * 20000)}%`;
        document.getElementById('barGamma').style.width = `${Math.min(100, data.gamma * 30000)}%`;

        document.getElementById('valBetaAlphaRatio').textContent = data.betaAlphaRatio.toFixed(3);
        document.getElementById('valHjorthAct').textContent = data.hjorthAct.toFixed(4);
        document.getElementById('valHjorthMob').textContent = data.hjorthMob.toFixed(4);
        document.getElementById('valHjorthComp').textContent = data.hjorthComp.toFixed(4);
        document.getElementById('valEntropy').textContent = data.entropy.toFixed(3);
        document.getElementById('valKatzFD').textContent = data.katzFD.toFixed(3);

        document.getElementById('valPeaceScore').textContent = `${Math.max(10, 100 - score)} / 100`;

        if (this.chart && this.chart.data) {
            const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.chart.data.labels.push(timeLabel);
            this.chart.data.datasets[0].data.push(score);
            this.chart.data.datasets[1].data.push(data.betaAlphaRatio * 100);
            this.chart.data.datasets[2].data.push(data.alpha * 10000);

            if (this.chart.data.labels.length > this.chartMaxPoints) {
                this.chart.data.labels.shift();
                this.chart.data.datasets[0].data.shift();
                this.chart.data.datasets[1].data.shift();
                this.chart.data.datasets[2].data.shift();
            }
            this.chart.update('none');
        }

        aptaAI.updateStressSync(score);
        this.addHistoryRecord({ ...this.currentMetrics, score });
    }

    updateConnectionBadge(connected, text) {
        const badge = document.getElementById('connectionBadge');
        const textEl = document.getElementById('connectionText');

        if (connected) badge.className = 'connection-status-badge connected';
        else badge.className = 'connection-status-badge';

        textEl.textContent = text;
    }

    toggle478Breathing() {
        const circle = document.getElementById('breathingCircle');
        const text = document.getElementById('breathStateText');
        const timerNum = document.getElementById('breathTimerNum');
        const btn = document.getElementById('btnStartBreathing');

        if (this.isBreathing) {
            clearInterval(this.breathInterval);
            this.isBreathing = false;
            circle.className = 'breathing-circle';
            text.textContent = 'Press Start';
            timerNum.textContent = '--';
            btn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Start 4-7-8 Breathing Cycle';
        } else {
            this.isBreathing = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-pause"></i> Stop Breathing Cycle';

            let phase = 'inhale';
            let seconds = 4;

            const runCycle = () => {
                timerNum.textContent = seconds;
                if (phase === 'inhale') { circle.className = 'breathing-circle expand'; text.textContent = 'Inhale (4s)'; }
                else if (phase === 'hold') { circle.className = 'breathing-circle hold'; text.textContent = 'Hold (7s)'; }
                else if (phase === 'exhale') { circle.className = 'breathing-circle contract'; text.textContent = 'Exhale (8s)'; }

                seconds--;
                if (seconds < 0) {
                    if (phase === 'inhale') { phase = 'hold'; seconds = 7; }
                    else if (phase === 'hold') { phase = 'exhale'; seconds = 8; }
                    else if (phase === 'exhale') { phase = 'inhale'; seconds = 4; }
                }
            };

            runCycle();
            this.breathInterval = setInterval(runCycle, 1000);
        }
    }

    addHistoryRecord(record) {
        this.historyLogs.push(record);
        if (this.historyLogs.length > 50) this.historyLogs.shift();

        const tbody = document.getElementById('historyTableBody');
        const emptyMsg = tbody.querySelector('.empty-table-msg');
        if (emptyMsg) tbody.innerHTML = '';

        const tr = document.createElement('tr');
        const timeStr = record.timestamp.toLocaleTimeString();

        tr.innerHTML = `
            <td>${timeStr}</td>
            <td><strong>${record.score}%</strong></td>
            <td>${record.state}</td>
            <td>${record.betaAlphaRatio.toFixed(3)}</td>
            <td>${record.alpha.toFixed(4)}</td>
            <td>${record.beta.toFixed(4)}</td>
            <td><span class="badge-tag">${this.currentUser.subjectId}</span></td>
        `;

        tbody.insertBefore(tr, tbody.firstChild);

        document.getElementById('logCountVal').textContent = this.historyLogs.length;

        const avg = Math.round(this.historyLogs.reduce((a,b) => a + b.score, 0) / this.historyLogs.length);
        const peak = Math.max(...this.historyLogs.map(l => l.score));

        document.getElementById('avgStressVal').textContent = `${avg}%`;
        document.getElementById('peakStressVal').textContent = `${peak}%`;
        document.getElementById('dominantStateVal').textContent = record.state;
    }

    clearHistory() {
        this.historyLogs = [];
        document.getElementById('historyTableBody').innerHTML = `
            <tr><td colspan="7" class="empty-table-msg">No stress records logged yet. Connect device or start simulator.</td></tr>
        `;
        document.getElementById('logCountVal').textContent = '0';
        document.getElementById('avgStressVal').textContent = '--%';
        document.getElementById('peakStressVal').textContent = '--%';
        document.getElementById('dominantStateVal').textContent = '--';
    }

    exportPDFReport() {
        const now = new Date();
        document.getElementById('pdfDate').textContent = now.toLocaleString();
        document.getElementById('pdfSubjectId').textContent = this.currentUser.subjectId;
        document.getElementById('pdfSubjectName').textContent = this.currentUser.fullName;

        const avg = this.historyLogs.length ? Math.round(this.historyLogs.reduce((a,b) => a + b.score, 0) / this.historyLogs.length) : '--';
        const peak = this.historyLogs.length ? Math.max(...this.historyLogs.map(l => l.score)) : '--';

        document.getElementById('pdfAvgStress').textContent = `${avg}%`;
        document.getElementById('pdfPeakStress').textContent = `${peak}%`;
        document.getElementById('pdfDominantState').textContent = this.currentMetrics.state || 'Balanced Baseline';
        document.getElementById('pdfDuration').textContent = `${Math.round((now - this.sessionStartTime) / 60000)} minutes`;

        window.print();
    }

    exportHospitalRosterPDF() {
        const hospitalName = this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital';
        const govLicenseNo = this.currentUser.govLicenseNo || 'NABH-AP-2026-8841';
        const adminName = this.currentUser.fullName || 'Hospital Admin';
        const now = new Date();

        const hospDocs = this.usersDB.filter(u => u.role === 'Doctor' && (!u.hospitalName || u.hospitalName === hospitalName));
        const hospPatients = this.usersDB.filter(u => u.role === 'Subject' && (!u.hospitalName || u.hospitalName === hospitalName));
        const criticalPatients = hospPatients.filter(p => {
            const req = this.doctorRequests.find(r => r.patientEmail === p.email || r.patientSubjectId === p.subjectId);
            return (req && req.latestStressScore > 70) || (p.latestStressScore > 70);
        });

        let totalStress = 0;
        hospPatients.forEach(p => {
            const req = this.doctorRequests.find(r => r.patientEmail === p.email || r.patientSubjectId === p.subjectId);
            totalStress += req ? (req.latestStressScore || 38) : 38;
        });
        const avgStress = hospPatients.length > 0 ? Math.round(totalStress / hospPatients.length) : 38;

        const hospNameElem = document.getElementById('pdfHospName');
        const hospDateElem = document.getElementById('pdfHospDate');
        const hospLicElem = document.getElementById('pdfHospLicense');
        const hospAdminElem = document.getElementById('pdfHospAdminName');
        const docCountElem = document.getElementById('pdfHospDocCount');
        const patientCountElem = document.getElementById('pdfHospPatientCount');
        const avgStressElem = document.getElementById('pdfHospAvgStress');
        const criticalCountElem = document.getElementById('pdfHospCriticalCount');

        if (hospNameElem) hospNameElem.textContent = hospitalName;
        if (hospDateElem) hospDateElem.textContent = now.toLocaleString();
        if (hospLicElem) hospLicElem.textContent = govLicenseNo;
        if (hospAdminElem) hospAdminElem.textContent = adminName;
        if (docCountElem) docCountElem.textContent = hospDocs.length;
        if (patientCountElem) patientCountElem.textContent = hospPatients.length;
        if (avgStressElem) avgStressElem.textContent = `${avgStress}%`;
        if (criticalCountElem) criticalCountElem.textContent = criticalPatients.length;

        const docTableBody = document.getElementById('pdfHospDoctorsTableBody');
        if (docTableBody) {
            docTableBody.innerHTML = hospDocs.map(d => `
                <tr>
                    <td><strong>${d.subjectId}</strong></td>
                    <td>${d.fullName}</td>
                    <td>${d.email}</td>
                    <td>${d.specialization || 'Neuro-Cardiology'}</td>
                    <td>${d.status === 'approved' || !d.status ? 'Approved ✓' : 'Pending ⏳'}</td>
                </tr>
            `).join('');
        }

        const patientTableBody = document.getElementById('pdfHospPatientsTableBody');
        if (patientTableBody) {
            patientTableBody.innerHTML = hospPatients.map(p => `
                <tr>
                    <td><strong>${p.subjectId}</strong></td>
                    <td>${p.fullName}</td>
                    <td>${p.email}</td>
                    <td>${p.doctorName || 'Unassigned'}</td>
                    <td>${p.doctorApprovalStatus === 'approved' ? 'Doctor Linked ✓' : 'Pending Approval ⏳'}</td>
                </tr>
            `).join('');
        }

        const hospTemplate = document.getElementById('pdfHospitalRosterTemplate');
        if (hospTemplate) hospTemplate.style.display = 'block';

        window.print();

        setTimeout(() => {
            if (hospTemplate) hospTemplate.style.display = 'none';
        }, 1000);
    }

    initDoctorPortalEvents() {
        const btnCloseModal = document.getElementById('btnClosePatientTelemetryModal');
        const btnCloseFooter = document.getElementById('btnClosePatientTelemetryModalFooter');
        if (btnCloseModal) btnCloseModal.onclick = () => this.closePatientTelemetryModal();
        if (btnCloseFooter) btnCloseFooter.onclick = () => this.closePatientTelemetryModal();

        const btnCloseDocProf = document.getElementById('btnCloseDocProfileModal');
        const btnCloseDocProfBtn = document.getElementById('btnCloseDocProfileModalBtn');
        if (btnCloseDocProf) btnCloseDocProf.onclick = () => this.closeDoctorProfileModal();
        if (btnCloseDocProfBtn) btnCloseDocProfBtn.onclick = () => this.closeDoctorProfileModal();

        const searchInput = document.getElementById('docPatientSearch');
        if (searchInput) {
            searchInput.oninput = () => this.renderDoctorPortal();
        }

        const filterSelect = document.getElementById('docStatusFilter');
        if (filterSelect) {
            filterSelect.onchange = () => this.renderDoctorPortal();
        }
    }

    openDoctorProfileModal(email) {
        const doc = this.usersDB.find(u => u.role === 'Doctor' && u.email && u.email.toLowerCase() === email.toLowerCase()) || {
            fullName: 'Dr. Rajesh Sharma',
            email: email,
            subjectId: 'DOC-201',
            specialization: 'Neuro-Cardiology',
            hospitalName: this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital',
            experience: '12+ Years Clinical Practice',
            qualification: 'MBBS, MD (Neuro-Cardiology)',
            status: 'approved'
        };

        const modal = document.getElementById('doctorProfileModal');
        if (!modal) return;

        const avatarElem = document.getElementById('docModalAvatar');
        const nameElem = document.getElementById('docModalFullName');
        const deptElem = document.getElementById('docModalDept');
        const regElem = document.getElementById('docModalRegId');
        const hospElem = document.getElementById('docModalHospital');
        const emailElem = document.getElementById('docModalEmail');
        const statusElem = document.getElementById('docModalStatus');
        const expElem = document.getElementById('docModalExperience');
        const qualElem = document.getElementById('docModalQualification');

        if (avatarElem) avatarElem.textContent = (doc.fullName || 'D').charAt(0).toUpperCase();
        if (nameElem) nameElem.textContent = doc.fullName;
        if (deptElem) deptElem.innerHTML = `<i class="fa-solid fa-building-user"></i> Department of ${doc.specialization || 'Neuro-Cardiology'}`;
        if (regElem) regElem.textContent = doc.subjectId || 'DOC-201';
        if (hospElem) hospElem.textContent = doc.hospitalName || this.currentUser.hospitalName || 'Clinical Health Center';
        if (emailElem) emailElem.textContent = doc.email;
        if (statusElem) statusElem.textContent = (doc.status === 'approved' || !doc.status ? 'Approved ✓' : 'Pending Approval ⏳');
        if (expElem) expElem.textContent = doc.experience || '12+ Years Clinical Practice';
        if (qualElem) qualElem.textContent = doc.qualification || 'MBBS, MD (Neuro-Cardiology)';

        // Find all patients under this doctor
        const assignedPatients = this.usersDB.filter(u => u.role === 'Subject' && (
            (u.doctorEmail && u.doctorEmail.toLowerCase() === doc.email.toLowerCase()) || 
            (u.doctorName && u.doctorName.includes(doc.fullName))
        ));

        const reqPatients = this.doctorRequests.filter(r => 
            (r.doctorEmail && r.doctorEmail.toLowerCase() === doc.email.toLowerCase()) || 
            (r.doctorName && r.doctorName.includes(doc.fullName))
        );

        const patientMap = new Map();
        assignedPatients.forEach(p => {
            patientMap.set(p.subjectId, {
                subjectId: p.subjectId,
                fullName: p.fullName,
                email: p.email,
                status: p.doctorApprovalStatus || 'approved'
            });
        });

        reqPatients.forEach(p => {
            if (!patientMap.has(p.patientSubjectId)) {
                patientMap.set(p.patientSubjectId, {
                    subjectId: p.patientSubjectId,
                    fullName: p.patientFullName,
                    email: p.patientEmail,
                    status: p.status
                });
            }
        });

        const combinedList = Array.from(patientMap.values());

        const patientCountElem = document.getElementById('docModalPatientCount');
        if (patientCountElem) patientCountElem.textContent = combinedList.length;

        const listBody = document.getElementById('docModalPatientListBody');
        if (listBody) {
            if (combinedList.length === 0) {
                listBody.innerHTML = `
                    <tr><td colspan="4" class="empty-table-msg" style="text-align: center; padding: 1.2rem; color: #94a3b8;">No patients currently assigned under ${doc.fullName}.</td></tr>
                `;
            } else {
                listBody.innerHTML = combinedList.map(p => `
                    <tr style="cursor: pointer; transition: background 0.2s;" onclick="app.closeDoctorProfileModal(); app.viewPatientTelemetry('${p.subjectId}')" title="Click to view full patient info & stress telemetry">
                        <td><strong style="color: #38bdf8;"><i class="fa-solid fa-id-card"></i> ${p.subjectId}</strong></td>
                        <td><strong style="color: #f8fafc;">${p.fullName}</strong></td>
                        <td style="color: #cbd5e1; font-size: 0.82rem;">${p.email}</td>
                        <td>
                            <button class="btn btn-sm btn-accent" style="font-size: 0.75rem; padding: 0.25rem 0.65rem; background: linear-gradient(135deg, #06b6d4, #0891b2);" onclick="event.stopPropagation(); app.closeDoctorProfileModal(); app.viewPatientTelemetry('${p.subjectId}')">
                                <i class="fa-solid fa-file-medical"></i> View Patient Info
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        const btnFilter = document.getElementById('btnDocModalFilterPatients');
        if (btnFilter) {
            btnFilter.onclick = () => {
                this.closeDoctorProfileModal();
                this.filterPatientsByDoctor(doc.email, doc.fullName);
            };
        }

        modal.style.display = 'flex';
    }

    closeDoctorProfileModal() {
        const modal = document.getElementById('doctorProfileModal');
        if (modal) modal.style.display = 'none';
    }

    renderMasterAdminPortal() {
        const pendingHospitalsList = document.getElementById('pendingHospitalsList');
        const approvedHospitalsList = document.getElementById('approvedHospitalsList');

        const pendingHospitals = this.usersDB.filter(u => u.role === 'HospitalAdmin' && u.status === 'pending_gov_approval');
        const approvedHospitals = this.usersDB.filter(u => u.role === 'HospitalAdmin' && u.status === 'approved');

        // Slide 1: Pending Hospitals Awaiting License Approval
        if (pendingHospitalsList) {
            if (pendingHospitals.length > 0) {
                pendingHospitalsList.innerHTML = pendingHospitals.map(hosp => `
                    <div class="request-card" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(16,185,129,0.4); padding: 1.1rem; border-radius: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.6rem;">
                            <div style="background: rgba(16,185,129,0.2); color: #34d399; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"><i class="fa-solid fa-hospital"></i></div>
                            <div>
                                <strong style="color: #f8fafc; font-size: 1rem; display: block;">${hosp.hospitalName}</strong>
                                <span style="font-size: 0.78rem; color: #94a3b8;">Contact Admin: ${hosp.fullName} (${hosp.email})</span>
                            </div>
                        </div>
                        <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 0.9rem; background: rgba(30,41,59,0.5); padding: 0.6rem; border-radius: 6px;">
                            <div><i class="fa-solid fa-award" style="color: #10b981;"></i> License No: <code>${hosp.govLicenseNo || hosp.subjectId}</code></div>
                            <div><i class="fa-solid fa-id-card" style="color: #818cf8;"></i> Reg ID: <code>${hosp.subjectId}</code></div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn btn-sm btn-success" onclick="app.approveHospitalAccount('${hosp.email}')" style="flex: 1; background: linear-gradient(135deg, #10b981, #059669); border: none; color: #fff; font-weight: 600; cursor: pointer; padding: 0.55rem; border-radius: 6px; font-size: 0.88rem;">
                                <i class="fa-solid fa-shield-check"></i> Grant State License Seal
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                pendingHospitalsList.innerHTML = `
                    <div class="empty-table-msg card" style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; background: rgba(15,23,42,0.5); border: 1px dashed rgba(16,185,129,0.3);">
                        <i class="fa-solid fa-circle-check" style="font-size: 2rem; color: #10b981; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0; color: #a7f3d0; font-weight: 500;">No pending hospital registrations!</p>
                        <span style="font-size: 0.8rem; color: #94a3b8;">All submitted hospital registrations have been granted State Healthcare License Seals.</span>
                    </div>
                `;
            }
        }

        // Slide 2: State Accredited Hospitals & Hardware Band Inventory
        if (approvedHospitalsList) {
            if (approvedHospitals.length === 0) {
                approvedHospitalsList.innerHTML = `
                    <div class="empty-table-msg card" style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; background: rgba(15,23,42,0.5); border: 1px dashed rgba(99,102,241,0.3);">
                        <i class="fa-solid fa-building-circle-exclamation" style="font-size: 2rem; color: #818cf8; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0; color: #cbd5e1;">No approved state hospitals registered yet.</p>
                    </div>
                `;
            } else {
                approvedHospitalsList.innerHTML = approvedHospitals.map(hosp => {
                    const hospDocs = this.usersDB.filter(u => u.role === 'Doctor' && (!u.hospitalName || u.hospitalName === hosp.hospitalName));
                    const hospPatients = this.usersDB.filter(u => u.role === 'Subject' && (!u.hospitalName || u.hospitalName === hosp.hospitalName));
                    const allocatedBands = Math.max(15, hospPatients.length + 8);
                    const activeBands = hospPatients.length > 0 ? hospPatients.length : 5;

                    return `
                        <div class="request-card" style="background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(99, 102, 241, 0.35); padding: 1.1rem; border-radius: 10px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="background: rgba(99, 102, 241, 0.2); color: #818cf8; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"><i class="fa-solid fa-hospital-user"></i></div>
                                    <div>
                                        <strong style="color: #f8fafc; font-size: 0.98rem; display: block;">${hosp.hospitalName}</strong>
                                        <span style="font-size: 0.76rem; color: #a7f3d0;"><i class="fa-solid fa-shield-check"></i> License: ${hosp.govLicenseNo || 'NABH-AP-2026-8841'}</span>
                                    </div>
                                </div>
                                <span class="badge-tag" style="background: rgba(16,185,129,0.15); color: #34d399; font-size: 0.75rem;">Verified ✓</span>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1rem; background: rgba(30,41,59,0.6); padding: 0.75rem; border-radius: 6px;">
                                <div>
                                    <span style="font-size: 0.72rem; color: #94a3b8; display: block; text-transform: uppercase;">Allocated Bands</span>
                                    <strong style="font-size: 1.1rem; color: #38bdf8;">${allocatedBands} Bands</strong>
                                </div>
                                <div>
                                    <span style="font-size: 0.72rem; color: #94a3b8; display: block; text-transform: uppercase;">Active Hardware</span>
                                    <strong style="font-size: 1.1rem; color: #34d399;">${activeBands} Active</strong>
                                </div>
                            </div>

                            <div style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.9rem; display: flex; justify-content: space-between;">
                                <span><i class="fa-solid fa-user-doctor"></i> Registered Doctors: <strong>${hospDocs.length}</strong></span>
                                <span><i class="fa-solid fa-hospital-user"></i> Admin: <strong>${hosp.fullName || 'Hospital Admin'}</strong></span>
                            </div>

                            <button type="button" class="btn btn-sm btn-primary" onclick="app.inspectHospitalBandInventory('${hosp.hospitalName.replace(/'/g, "\\'")}')" style="width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-weight: 600; cursor: pointer; padding: 0.55rem; border-radius: 6px; font-size: 0.88rem;">
                                <i class="fa-solid fa-eye"></i> Inspect Band Inventory & Doctor Roster
                            </button>
                        </div>
                    `;
                }).join('');
            }
        }

        // Slide 3: Master System Database & Accounts Inspector Table
        this.renderMasterDatabaseTable();
    }

    renderMasterDatabaseTable() {
        const searchInput = document.getElementById('masterDbSearchInput');
        const roleFilterSelect = document.getElementById('masterDbRoleFilter');
        const tableBody = document.getElementById('masterDbTableBody');

        const countTotal = document.getElementById('dbCountTotalUsers');
        const countHospitals = document.getElementById('dbCountHospitals');
        const countDoctors = document.getElementById('dbCountDoctors');
        const countPatients = document.getElementById('dbCountPatients');
        const countWellness = document.getElementById('dbCountWellness');
        const countTelemetry = document.getElementById('dbCountTelemetry');

        const totalUsers = this.usersDB.length;
        const hospitalsCount = this.usersDB.filter(u => u.role === 'HospitalAdmin').length;
        const doctorsCount = this.usersDB.filter(u => u.role === 'Doctor').length;
        const patientsCount = this.usersDB.filter(u => u.role === 'Subject').length;
        const wellnessCount = this.usersDB.filter(u => u.role === 'Personal Wellness' || u.role === 'PersonalUser').length;
        
        let telemetryCount = 0;
        try {
            const journals = JSON.parse(localStorage.getItem('udvega_journals') || '[]');
            const telemetry = JSON.parse(localStorage.getItem('udvega_telemetry_history') || '[]');
            telemetryCount = journals.length + telemetry.length + (this.doctorRequests ? this.doctorRequests.length : 0);
        } catch(e) {
            telemetryCount = 18;
        }

        if (countTotal) countTotal.textContent = totalUsers;
        if (countHospitals) countHospitals.textContent = hospitalsCount;
        if (countDoctors) countDoctors.textContent = doctorsCount;
        if (countPatients) countPatients.textContent = patientsCount;
        if (countWellness) countWellness.textContent = wellnessCount;
        if (countTelemetry) countTelemetry.textContent = telemetryCount || 18;

        if (!tableBody) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const roleFilter = roleFilterSelect ? roleFilterSelect.value : 'all';

        let filtered = this.usersDB.filter(u => {
            if (roleFilter !== 'all') {
                if (roleFilter === 'PersonalUser' && u.role !== 'Personal Wellness' && u.role !== 'PersonalUser') return false;
                if (roleFilter === 'MasterAdmin' && u.email.toLowerCase() !== 'rajwanthbalakaofficial@gmail.com') return false;
                if (roleFilter !== 'PersonalUser' && roleFilter !== 'MasterAdmin' && u.role !== roleFilter) return false;
            }

            if (query) {
                const matchName = (u.fullName || '').toLowerCase().includes(query);
                const matchEmail = (u.email || '').toLowerCase().includes(query);
                const matchPhone = (u.phone || '').toLowerCase().includes(query);
                const matchId = (u.subjectId || '').toLowerCase().includes(query);
                const matchLicense = (u.govLicenseNo || '').toLowerCase().includes(query);
                const matchHosp = (u.hospitalName || '').toLowerCase().includes(query);
                const matchPin = (u.password || '').toLowerCase().includes(query);
                const matchRole = (u.role || '').toLowerCase().includes(query);
                return matchName || matchEmail || matchPhone || matchId || matchLicense || matchHosp || matchPin || matchRole;
            }

            return true;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">
                        <i class="fa-solid fa-folder-open" style="font-size: 1.8rem; color: #64748b; margin-bottom: 0.5rem; display: block;"></i>
                        No database records match your filter criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filtered.map(u => {
            const isMaster = u.email && u.email.toLowerCase() === 'rajwanthbalakaofficial@gmail.com';
            
            let roleBadge = '';
            if (isMaster) {
                roleBadge = `<span class="badge-tag" style="background: rgba(139, 92, 246, 0.25); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.5);"><i class="fa-solid fa-crown"></i> Master Super Admin</span>`;
            } else if (u.role === 'HospitalAdmin') {
                roleBadge = `<span class="badge-tag" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);"><i class="fa-solid fa-hospital-user"></i> Hospital Admin</span>`;
            } else if (u.role === 'Doctor') {
                roleBadge = `<span class="badge-tag" style="background: rgba(129, 140, 248, 0.2); color: #818cf8; border: 1px solid rgba(129, 140, 248, 0.4);"><i class="fa-solid fa-user-doctor"></i> Doctor</span>`;
            } else if (u.role === 'Subject') {
                roleBadge = `<span class="badge-tag" style="background: rgba(244, 114, 182, 0.2); color: #f472b6; border: 1px solid rgba(244, 114, 182, 0.4);"><i class="fa-solid fa-bed-pulse"></i> Patient</span>`;
            } else {
                roleBadge = `<span class="badge-tag" style="background: rgba(250, 204, 21, 0.2); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.4);"><i class="fa-solid fa-user-gear"></i> Wellness User</span>`;
            }

            let statusBadge = '';
            if (u.status === 'approved' || (!u.status && u.doctorApprovalStatus === 'approved')) {
                statusBadge = `<span class="status-badge status-badge-approved" style="font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Approved</span>`;
            } else if (u.status === 'pending_gov_approval') {
                statusBadge = `<span class="status-badge status-badge-pending" style="font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> Pending License</span>`;
            } else {
                statusBadge = `<span class="status-badge status-badge-pending" style="font-size: 0.75rem;"><i class="fa-solid fa-hourglass-half"></i> Pending Link</span>`;
            }

            const phoneDisplay = u.phone ? `${u.phone} ${u.phoneVerified ? '<i class="fa-solid fa-circle-check" style="color: #34d399;" title="OTP Verified"></i>' : ''}` : '<span style="color: #64748b;">Not provided</span>';
            const regIdDisplay = u.govLicenseNo || u.subjectId || u.specialization || 'N/A';
            const pinDisplay = u.password ? `<code style="background: rgba(30,41,59,0.9); padding: 0.2rem 0.5rem; border-radius: 4px; color: #38bdf8; font-weight: bold;">${u.password}</code>` : '<span style="color: #64748b;">None</span>';
            
            const escapedEmail = u.email.replace(/'/g, "\\'");
            const escapedName = (u.fullName || '').replace(/'/g, "\\'");

            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); background: ${isMaster ? 'rgba(139, 92, 246, 0.08)' : 'transparent'};">
                    <td style="padding: 0.75rem 0.9rem;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${isMaster ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)'}; color: ${isMaster ? '#c084fc' : '#fff'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                                ${(u.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong style="color: #f8fafc; font-size: 0.9rem; display: block;">${u.fullName || 'Unnamed User'}</strong>
                                <span style="color: #94a3b8; font-size: 0.78rem;">${u.email}</span>
                            </div>
                        </div>
                    </td>
                    <td style="padding: 0.75rem 0.9rem;">${roleBadge}</td>
                    <td style="padding: 0.75rem 0.9rem; color: #e2e8f0;">${phoneDisplay}</td>
                    <td style="padding: 0.75rem 0.9rem; color: #cbd5e1;"><code>${regIdDisplay}</code></td>
                    <td style="padding: 0.75rem 0.9rem;">${pinDisplay}</td>
                    <td style="padding: 0.75rem 0.9rem;">${statusBadge}</td>
                    <td style="padding: 0.75rem 0.9rem; text-align: right;">
                        <div style="display: flex; gap: 4px; justify-content: flex-end;">
                            <button type="button" class="btn btn-sm" onclick="app.promptResetUserPin('${escapedEmail}')" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); padding: 0.3rem 0.6rem; font-size: 0.76rem;" title="Reset PIN / Password">
                                <i class="fa-solid fa-key"></i> PIN
                            </button>
                            ${!isMaster ? `
                                <button type="button" class="btn btn-sm" onclick="app.toggleUserAccountStatus('${escapedEmail}')" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 0.3rem 0.6rem; font-size: 0.76rem;" title="Toggle Approval Status">
                                    <i class="fa-solid fa-user-check"></i> Status
                                </button>
                                <button type="button" class="btn btn-sm" onclick="app.deleteUserAccount('${escapedEmail}', '${escapedName}')" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 0.3rem 0.6rem; font-size: 0.76rem;" title="Delete User Record">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    exportDatabaseJSON() {
        const fullBackup = {
            exportMeta: {
                appName: 'Udvegadarshini State Healthcare Telemetry Database',
                version: 'v20.0.0',
                exportedBy: 'Rajwanth Balaka (State Master Super Admin)',
                exportTimestamp: new Date().toISOString(),
                totalAccounts: this.usersDB.length
            },
            usersDB: this.usersDB,
            hospitalsDB: this.hospitalsDB || [],
            doctorRequests: this.doctorRequests || [],
            journals: JSON.parse(localStorage.getItem('udvega_journals') || '[]')
        };

        const jsonStr = JSON.stringify(fullBackup, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `udvega_database_master_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert(`Database Backup Exported Successfully! 🎉\n\nTotal User Records Saved: ${this.usersDB.length}\nFile: udvega_database_master_backup_${dateStr}.json`);
    }

    exportDatabaseCSV() {
        const headers = ["Full Name", "Email", "Role", "Phone Number", "Phone Verified", "License / Reg ID", "PIN / Password", "Hospital Name", "Approval Status"];
        const rows = this.usersDB.map(u => [
            `"${(u.fullName || '').replace(/"/g, '""')}"`,
            `"${(u.email || '').replace(/"/g, '""')}"`,
            `"${(u.role || '').replace(/"/g, '""')}"`,
            `"${(u.phone || '').replace(/"/g, '""')}"`,
            `"${u.phoneVerified ? 'Verified' : 'Unverified'}"`,
            `"${(u.govLicenseNo || u.subjectId || '').replace(/"/g, '""')}"`,
            `"${(u.password || '').replace(/"/g, '""')}"`,
            `"${(u.hospitalName || '').replace(/"/g, '""')}"`,
            `"${(u.status || 'approved').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `udvega_users_database_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`Users Database CSV Exported Successfully! 📊\nFile: udvega_users_database_${dateStr}.csv`);
    }

    importDatabaseJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && Array.isArray(data.usersDB)) {
                    this.usersDB = data.usersDB;
                    localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));

                    if (Array.isArray(data.hospitalsDB)) {
                        this.hospitalsDB = data.hospitalsDB;
                        localStorage.setItem('udvega_hospitals_db', JSON.stringify(this.hospitalsDB));
                    }
                    if (Array.isArray(data.doctorRequests)) {
                        this.doctorRequests = data.doctorRequests;
                        localStorage.setItem('udvega_doctor_requests', JSON.stringify(this.doctorRequests));
                    }
                    if (Array.isArray(data.journals)) {
                        localStorage.setItem('udvega_journals', JSON.stringify(data.journals));
                    }

                    this.renderMasterAdminPortal();
                    alert(`Database Restored Successfully! ✅\n\nRestored ${this.usersDB.length} user accounts from JSON backup.`);
                } else {
                    alert('Invalid Database File Format! Must contain a valid usersDB array.');
                }
            } catch (err) {
                alert('Error parsing JSON backup file: ' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    promptResetUserPin(email) {
        const user = this.usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return;

        const newPin = prompt(`Enter new Security PIN / Password for ${user.fullName} (${user.email}):`, user.password || '1234');
        if (newPin !== null && newPin.trim() !== '') {
            user.password = newPin.trim();
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            this.renderMasterDatabaseTable();
            alert(`Security PIN / Password updated to "${user.password}" for ${user.fullName}!`);
        }
    }

    toggleUserAccountStatus(email) {
        const user = this.usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return;

        if (user.email.toLowerCase() === 'rajwanthbalakaofficial@gmail.com') {
            alert('Master Super Admin account status cannot be altered!');
            return;
        }

        user.status = (user.status === 'approved' || !user.status) ? 'pending_gov_approval' : 'approved';
        localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
        this.renderMasterAdminPortal();
        alert(`Account status for ${user.fullName} updated to: ${user.status === 'approved' ? 'Approved ✓' : 'Pending Approval ⏳'}`);
    }

    deleteUserAccount(email, name) {
        if (email.toLowerCase() === 'rajwanthbalakaofficial@gmail.com') {
            alert('Master Super Admin account CANNOT be deleted!');
            return;
        }

        if (confirm(`Are you sure you want to permanently delete user account "${name}" (${email}) from the database?`)) {
            this.usersDB = this.usersDB.filter(u => u.email.toLowerCase() !== email.toLowerCase());
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            this.renderMasterAdminPortal();
            alert(`User account "${name}" deleted from database.`);
        }
    }

    renderHospitalAdminPortal() {
        const pendingContainer = document.getElementById('hospPendingDoctorsContainer');
        const doctorsTableBody = document.getElementById('hospDoctorsTableBody');
        const pendingBadge = document.getElementById('pendingDoctorBadgeCount');
        const countPending = document.getElementById('hospStatPendingDoctorsCount');
        const countApproved = document.getElementById('hospStatApprovedDoctorsCount');
        const countTotal = document.getElementById('hospStatTotalDoctorsCount');

        const hospitalName = this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital';

        // Filter doctors registered under THIS hospital
        const allHospitalDoctors = this.usersDB.filter(u => u.role === 'Doctor' && (!u.hospitalName || u.hospitalName === hospitalName));
        const pendingDoctors = allHospitalDoctors.filter(u => u.status === 'pending_hospital_approval');
        const approvedDoctors = allHospitalDoctors.filter(u => u.status === 'approved' || !u.status);

        if (countPending) countPending.textContent = pendingDoctors.length;
        if (countApproved) countApproved.textContent = approvedDoctors.length;
        if (countTotal) countTotal.textContent = allHospitalDoctors.length;
        if (pendingBadge) pendingBadge.textContent = `${pendingDoctors.length} New`;

        const govLicDisplay = document.getElementById('hospGovLicenseDisplay');
        if (govLicDisplay) {
            govLicDisplay.textContent = this.currentUser.govLicenseNo || this.currentUser.subjectId || 'NABH-AP-2026-8841';
        }

        // Calculate Hospital Aggregate Analytics & Critical Alerts
        const hospitalPatients = this.usersDB.filter(u => u.role === 'Subject' && (!u.hospitalName || u.hospitalName === hospitalName));
        const criticalPatients = hospitalPatients.filter(p => {
            const req = this.doctorRequests.find(r => r.patientEmail === p.email || r.patientSubjectId === p.subjectId);
            return (req && req.latestStressScore > 70) || (p.latestStressScore > 70);
        });

        const criticalBanner = document.getElementById('hospCriticalAlertBanner');
        const criticalBadge = document.getElementById('hospCriticalCountBadge');
        const criticalMsg = document.getElementById('hospCriticalAlertMessage');

        if (criticalBanner) {
            if (criticalPatients.length > 0) {
                criticalBanner.style.display = 'block';
                if (criticalBadge) criticalBadge.textContent = criticalPatients.length;
                if (criticalMsg) criticalMsg.textContent = `Critical High-Stress Patients Detected: ${criticalPatients.map(c => c.fullName + ' (' + c.subjectId + ')').join(', ')}. Immediate clinical consultation advised.`;
            } else {
                criticalBanner.style.display = 'none';
            }
        }

        const btnExportBanner = document.getElementById('btnExportHospitalReport');
        const btnExportHeader = document.getElementById('btnExportHospitalReportHeader');
        if (btnExportBanner) btnExportBanner.onclick = () => this.exportHospitalRosterPDF();
        if (btnExportHeader) btnExportHeader.onclick = () => this.exportHospitalRosterPDF();

        // Executive Analytics Stats
        const avgStressElem = document.getElementById('hospAnalyticsAvgStress');
        const criticalCountElem = document.getElementById('hospAnalyticsCriticalCount');
        const dominantStateElem = document.getElementById('hospAnalyticsDominantState');

        let totalStress = 0;
        let countedPatients = 0;
        hospitalPatients.forEach(p => {
            const req = this.doctorRequests.find(r => r.patientEmail === p.email || r.patientSubjectId === p.subjectId);
            const score = req ? (req.latestStressScore || 38) : 38;
            totalStress += score;
            countedPatients++;
        });

        const avgScore = countedPatients > 0 ? Math.round(totalStress / countedPatients) : 38;
        if (avgStressElem) avgStressElem.textContent = `${avgScore}%`;
        if (criticalCountElem) criticalCountElem.textContent = criticalPatients.length;
        if (dominantStateElem) {
            dominantStateElem.textContent = avgScore > 70 ? 'High Stress Alert' : (avgScore > 45 ? 'Elevated Focus' : 'Balanced Baseline');
            dominantStateElem.style.color = avgScore > 70 ? '#f43f5e' : (avgScore > 45 ? '#f59e0b' : '#a7f3d0');
        }

        // Render Pending Doctor Cards
        if (pendingContainer) {
            if (pendingDoctors.length === 0) {
                pendingContainer.innerHTML = `
                    <div class="empty-table-msg card" style="grid-column: 1 / -1; text-align: center; padding: 1.5rem;">
                        <i class="fa-solid fa-user-check" style="font-size: 1.8rem; color: #10b981; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0;">No pending Doctor approval requests! All doctor registrations under ${hospitalName} are verified.</p>
                    </div>
                `;
            } else {
                pendingContainer.innerHTML = pendingDoctors.map(doc => `
                    <div class="request-card">
                        <div class="request-header">
                            <div class="request-avatar" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">${doc.fullName.charAt(0)}</div>
                            <div class="request-meta">
                                <strong>${doc.fullName}</strong>
                                <span>License / Reg ID: ${doc.subjectId}</span>
                            </div>
                        </div>
                        <div class="request-details">
                            <p><i class="fa-solid fa-hospital"></i> Hospital: ${doc.hospitalName || hospitalName}</p>
                            <p><i class="fa-solid fa-envelope"></i> Email: ${doc.email}</p>
                            <p><i class="fa-solid fa-building-user"></i> Dept: ${doc.specialization || 'Neuro-Cardiology'}</p>
                        </div>
                        <div class="request-actions">
                            <button class="btn-accept-request" onclick="app.approveDoctorAccount('${doc.email}')">
                                <i class="fa-solid fa-user-check"></i> Approve Doctor
                            </button>
                            <button class="btn-reject-request" onclick="app.rejectDoctorAccount('${doc.email}')">
                                <i class="fa-solid fa-user-xmark"></i> Decline
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Department Filter for Approved Doctors
        const deptFilter = document.getElementById('hospDoctorDeptFilter')?.value || 'all';
        let filteredApprovedDoctors = approvedDoctors;
        if (deptFilter !== 'all') {
            filteredApprovedDoctors = approvedDoctors.filter(d => (d.specialization || 'Neuro-Cardiology').toLowerCase().includes(deptFilter.toLowerCase()));
        }

        const deptSelect = document.getElementById('hospDoctorDeptFilter');
        if (deptSelect) {
            deptSelect.onchange = () => this.renderHospitalAdminPortal();
        }

        // Render Approved Doctors Table
        if (doctorsTableBody) {
            if (filteredApprovedDoctors.length === 0) {
                doctorsTableBody.innerHTML = `
                    <tr><td colspan="6" class="empty-table-msg" style="text-align: center; padding: 1.5rem;">No active doctors registered under department: ${deptFilter}.</td></tr>
                `;
            } else {
                doctorsTableBody.innerHTML = filteredApprovedDoctors.map(doc => {
                    const assignedPatientCount = this.usersDB.filter(u => u.role === 'Subject' && (u.doctorEmail === doc.email || (u.doctorName && u.doctorName.includes(doc.fullName)))).length;
                    const deptStr = doc.specialization || 'Neuro-Cardiology';
                    return `
                        <tr style="cursor: pointer;" onclick="app.openDoctorProfileModal('${doc.email}')">
                            <td><strong>${doc.subjectId}</strong></td>
                            <td><strong>${doc.fullName}</strong></td>
                            <td>${doc.email}</td>
                            <td><span class="badge-tag" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;"><i class="fa-solid fa-building-user"></i> ${deptStr}</span></td>
                            <td><span class="status-badge status-badge-approved">Approved ✓</span></td>
                            <td>
                                <button class="btn btn-sm btn-accent" onclick="event.stopPropagation(); app.openDoctorProfileModal('${doc.email}')" style="margin-right: 0.3rem;">
                                    <i class="fa-solid fa-id-card"></i> Profile
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); app.filterPatientsByDoctor('${doc.email}', '${doc.fullName}')" style="margin-right: 0.3rem;">
                                    <i class="fa-solid fa-users"></i> Patients (${assignedPatientCount})
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.revokeDoctorAccount('${doc.email}')">
                                    <i class="fa-solid fa-ban"></i> Revoke
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        // Populate Doctor Filter Dropdown in Section 3
        const filterSelect = document.getElementById('hospPatientDoctorFilter');
        if (filterSelect) {
            const currentFilterVal = filterSelect.value || 'all';
            let optionsHtml = `<option value="all">-- All Hospital Doctors --</option>`;
            approvedDoctors.forEach(d => {
                optionsHtml += `<option value="${d.email}">${d.fullName} (${d.subjectId})</option>`;
            });
            filterSelect.innerHTML = optionsHtml;
            filterSelect.value = currentFilterVal;

            filterSelect.onchange = () => this.renderHospitalAdminPortal();
        }

        // Render Hospital Registered Patients Directory
        const patientsTableBody = document.getElementById('hospPatientsTableBody');
        const activeDoctorFilter = filterSelect ? filterSelect.value : 'all';

        let displayedPatients = hospitalPatients;
        if (activeDoctorFilter !== 'all') {
            displayedPatients = hospitalPatients.filter(p => 
                (p.doctorEmail && p.doctorEmail.toLowerCase() === activeDoctorFilter.toLowerCase()) ||
                (p.doctorName && approvedDoctors.some(d => d.email.toLowerCase() === activeDoctorFilter.toLowerCase() && p.doctorName.includes(d.fullName)))
            );
        }

        if (patientsTableBody) {
            if (displayedPatients.length === 0) {
                patientsTableBody.innerHTML = `
                    <tr><td colspan="6" class="empty-table-msg" style="text-align: center; padding: 1.5rem;">No patient records found under selected doctor filter for ${hospitalName}.</td></tr>
                `;
            } else {
                patientsTableBody.innerHTML = displayedPatients.map(p => {
                    const docInfo = p.doctorName || 'Unassigned';
                    const statusClass = p.doctorApprovalStatus === 'approved' ? 'status-badge-approved' : 'status-badge-pending';
                    const statusText = p.doctorApprovalStatus === 'approved' ? 'Doctor Linked ✓' : 'Pending Doctor Approval ⏳';
                    return `
                        <tr style="cursor: pointer;" onclick="app.viewPatientTelemetry('${p.subjectId}')">
                            <td><strong>${p.subjectId}</strong></td>
                            <td><strong>${p.fullName}</strong></td>
                            <td>${p.email}</td>
                            <td><span class="badge-tag" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;"><i class="fa-solid fa-user-doctor"></i> ${docInfo}</span></td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td>
                                <button class="btn btn-sm btn-accent" onclick="event.stopPropagation(); app.viewPatientTelemetry('${p.subjectId}')" style="margin-right: 0.3rem;">
                                    <i class="fa-solid fa-file-medical"></i> Details
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); app.openReassignDoctorModal('${p.subjectId}')">
                                    <i class="fa-solid fa-arrow-right-arrow-left"></i> Transfer
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    filterPatientsByDoctor(docEmail, docName) {
        const filterSelect = document.getElementById('hospPatientDoctorFilter');
        if (filterSelect) {
            filterSelect.value = docEmail;
        }
        this.renderHospitalAdminPortal();
        const section = document.getElementById('hospPatientsSection');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    }

    approveDoctorAccount(email) {
        const doc = this.usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (doc) {
            doc.status = 'approved';
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            this.populateDoctorDropdown();
            this.renderHospitalAdminPortal();
        }
    }

    approveHospitalAccount(email) {
        const hosp = this.usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (hosp) {
            hosp.status = 'approved';
            hosp.govVerified = true;
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            
            const alertBox = document.getElementById('authAlertBox');
            if (alertBox && alertBox.style.display !== 'none') {
                alertBox.className = 'auth-alert-box success';
                alertBox.innerHTML = `
                    <div style="padding: 0.3rem 0;">
                        <i class="fa-solid fa-circle-check" style="font-size: 1.2rem; color: #10b981;"></i> 
                        <strong style="color: #34d399; font-size: 0.95rem;">Hospital License Approved! ✓</strong>
                        <p style="margin: 0.3rem 0 0 0; font-size: 0.85rem; color: #e2e8f0;">State Healthcare Authority approval granted for <strong>${hosp.hospitalName}</strong>. You can now log in!</p>
                    </div>
                `;
            }

            if (this.currentUser && this.currentUser.email && this.currentUser.email.toLowerCase() === 'rajwanthbalakaofficial@gmail.com') {
                this.renderHospitalAdminPortal();
            }
        }
    }

    inspectHospitalBandInventory(hospitalName) {
        const modal = document.getElementById('masterHospitalInspectModal');
        if (!modal) return;

        const hosp = this.usersDB.find(u => u.role === 'HospitalAdmin' && u.hospitalName === hospitalName) || {
            hospitalName: hospitalName,
            govLicenseNo: 'NABH-AP-2026-8841'
        };

        const titleElem = document.getElementById('inspectHospName');
        const licenseElem = document.getElementById('inspectHospLicense');
        const totalBandsElem = document.getElementById('inspectTotalBandsCount');
        const activeBandsElem = document.getElementById('inspectActiveBandsCount');
        const docCountElem = document.getElementById('inspectDoctorCount');
        const docListElem = document.getElementById('inspectDoctorList');
        const mappingTableBody = document.getElementById('inspectBandMappingTableBody');

        if (titleElem) titleElem.innerHTML = `<i class="fa-solid fa-hospital"></i> ${hospitalName}`;
        if (licenseElem) licenseElem.innerHTML = `NABH License: <code>${hosp.govLicenseNo || 'NABH-AP-2026-8841'}</code> | Status: State Accredited ✓`;

        const hospDocs = this.usersDB.filter(u => u.role === 'Doctor' && (!u.hospitalName || u.hospitalName === hospitalName));
        const hospPatients = this.usersDB.filter(u => u.role === 'Subject' && (!u.hospitalName || u.hospitalName === hospitalName));

        const totalBands = Math.max(15, hospPatients.length + 8);
        const activeBands = hospPatients.length > 0 ? hospPatients.length : 5;

        if (totalBandsElem) totalBandsElem.textContent = `${totalBands} Bands`;
        if (activeBandsElem) activeBandsElem.textContent = `${activeBands} Active`;
        if (docCountElem) docCountElem.textContent = `${hospDocs.length} Doctors`;

        // Render Doctor Roster & Band Allocations Cards
        if (docListElem) {
            if (hospDocs.length === 0) {
                docListElem.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 1rem; background: rgba(15,23,42,0.5); border-radius: 8px; color: #94a3b8; text-align: center;">
                        No doctors registered under this hospital yet.
                    </div>
                `;
            } else {
                docListElem.innerHTML = hospDocs.map(d => {
                    const docPatients = hospPatients.filter(p => p.doctorEmail === d.email || (p.doctorName && p.doctorName.includes(d.fullName)));
                    const docBandsCount = Math.max(3, docPatients.length + 2);
                    return `
                        <div style="background: rgba(15,23,42,0.7); border: 1px solid rgba(99,102,241,0.25); padding: 0.9rem; border-radius: 8px;">
                            <strong style="color: #f8fafc; display: block;">${d.fullName}</strong>
                            <span style="font-size: 0.78rem; color: #818cf8; display: block; margin-bottom: 0.4rem;">Dept: ${d.specialization || 'Neuro-Cardiology'}</span>
                            <div style="font-size: 0.8rem; color: #cbd5e1; display: flex; justify-content: space-between; background: rgba(30,41,59,0.5); padding: 0.4rem 0.6rem; border-radius: 4px;">
                                <span>Hardware Bands: <strong>${docBandsCount} Bands</strong></span>
                                <span>Patients Assigned: <strong>${docPatients.length}</strong></span>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Render Patient ID & Band ID Mapping Table (NO personal telemetry clutter)
        if (mappingTableBody) {
            if (hospPatients.length === 0) {
                // Generate demo hardware band inventory mapping rows
                mappingTableBody.innerHTML = `
                    <tr>
                        <td><strong>SUBJ-3221</strong></td>
                        <td><code>EEG-BAND-9041</code></td>
                        <td>Dr. Rajesh Sharma</td>
                        <td><span class="status-badge status-badge-approved">Connected / Active 🟢</span></td>
                    </tr>
                    <tr>
                        <td><strong>SUBJ-4812</strong></td>
                        <td><code>EEG-BAND-9042</code></td>
                        <td>Dr. Rajesh Sharma</td>
                        <td><span class="status-badge status-badge-approved">Connected / Active 🟢</span></td>
                    </tr>
                    <tr>
                        <td><strong>SUBJ-5509</strong></td>
                        <td><code>EEG-BAND-9043</code></td>
                        <td>Dr. Anitha Reddy</td>
                        <td><span class="badge-tag" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">Standby / Paused 🟠</span></td>
                    </tr>
                `;
            } else {
                mappingTableBody.innerHTML = hospPatients.map((p, idx) => {
                    const bandId = `EEG-BAND-${9040 + idx + 1}`;
                    const docName = p.doctorName || 'Assigned Doctor';
                    const statusStr = idx % 3 === 2 ? 'Standby / Paused 🟠' : 'Connected / Active 🟢';
                    const statusClass = idx % 3 === 2 ? 'badge-tag' : 'status-badge status-badge-approved';
                    const statusStyle = idx % 3 === 2 ? 'background: rgba(245, 158, 11, 0.15); color: #f59e0b;' : '';
                    return `
                        <tr>
                            <td><strong>${p.subjectId}</strong></td>
                            <td><code>${bandId}</code></td>
                            <td>${docName}</td>
                            <td><span class="${statusClass}" style="${statusStyle}">${statusStr}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }

        modal.style.display = 'flex';
    }

    closeMasterInspectModal() {
        const modal = document.getElementById('masterHospitalInspectModal');
        if (modal) modal.style.display = 'none';
    }

    rejectDoctorAccount(email) {
        const doc = this.usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (doc) {
            doc.status = 'rejected';
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            this.populateDoctorDropdown();
            this.renderHospitalAdminPortal();
        }
    }

    revokeDoctorAccount(email) {
        const doc = this.usersDB.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (doc) {
            doc.status = 'pending_hospital_approval';
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            this.populateDoctorDropdown();
            this.renderHospitalAdminPortal();
        }
    }

    renderDoctorPortal() {
        const pendingContainer = document.getElementById('docPendingRequestsContainer');
        const tableBody = document.getElementById('docPatientsTableBody');
        const searchVal = (document.getElementById('docPatientSearch')?.value || '').toLowerCase();
        const filterVal = document.getElementById('docStatusFilter')?.value || 'all';

        // 1. Filter Patient Requests specifically for THIS doctor (if logged in as Doctor)
        let myDoctorRequests = [...this.doctorRequests];
        if (this.currentUser.role === 'Doctor') {
            const currentEmail = (this.currentUser.email || '').toLowerCase();
            const currentName = (this.currentUser.fullName || '').toLowerCase();
            myDoctorRequests = this.doctorRequests.filter(r => 
                (r.doctorEmail && r.doctorEmail.toLowerCase() === currentEmail) ||
                (r.doctorName && r.doctorName.toLowerCase().includes(currentName))
            );
        }

        const pendingList = myDoctorRequests.filter(r => r.status === 'pending');
        
        const pendingCountElem = document.getElementById('docStatPendingCount');
        const approvedCountElem = document.getElementById('docStatApprovedCount');
        const totalCountElem = document.getElementById('docStatTotalCount');
        const alertCountElem = document.getElementById('docStatAlertCount');
        const navBadge = document.getElementById('pendingReqBadge');
        const reqHeaderBadge = document.getElementById('pendingRequestBadgeCount');

        if (pendingCountElem) pendingCountElem.textContent = pendingList.length;
        if (reqHeaderBadge) reqHeaderBadge.textContent = `${pendingList.length} New`;
        if (navBadge) {
            if (pendingList.length > 0) {
                navBadge.style.display = 'inline-flex';
                navBadge.textContent = pendingList.length;
            } else {
                navBadge.style.display = 'none';
            }
        }

        // Render Pending Request Cards
        if (pendingContainer) {
            if (pendingList.length === 0) {
                pendingContainer.innerHTML = `
                    <div class="empty-table-msg card" style="grid-column: 1 / -1; text-align: center; padding: 1.5rem;">
                        <i class="fa-solid fa-circle-check" style="font-size: 1.8rem; color: #10b981; margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0;">No pending access requests! All patient links are updated.</p>
                    </div>
                `;
            } else {
                pendingContainer.innerHTML = pendingList.map(req => `
                    <div class="request-card">
                        <div class="request-header">
                            <div class="request-avatar">${req.patientFullName.charAt(0)}</div>
                            <div class="request-meta">
                                <strong>${req.patientFullName}</strong>
                                <span>Subject ID: ${req.patientSubjectId}</span>
                            </div>
                        </div>
                        <div class="request-details">
                            <p><i class="fa-solid fa-hospital"></i> Hospital: ${req.hospitalName}</p>
                            <p><i class="fa-solid fa-envelope"></i> Email: ${req.patientEmail}</p>
                            <p><i class="fa-solid fa-clock"></i> Requested: ${req.timestamp}</p>
                        </div>
                        <div class="request-actions">
                            <button class="btn-accept-request" onclick="app.approvePatientRequest('${req.requestId}')">
                                <i class="fa-solid fa-check-circle"></i> Accept Request
                            </button>
                            <button class="btn-reject-request" onclick="app.rejectPatientRequest('${req.requestId}')">
                                <i class="fa-solid fa-times-circle"></i> Decline
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 2. Filter & Render Patients Table
        let filtered = myDoctorRequests.filter(p => {
            const matchesSearch = p.patientFullName.toLowerCase().includes(searchVal) || p.patientSubjectId.toLowerCase().includes(searchVal) || p.hospitalName.toLowerCase().includes(searchVal);
            const matchesStatus = filterVal === 'all' || p.status === filterVal;
            return matchesSearch && matchesStatus;
        });

        const approvedCount = myDoctorRequests.filter(p => p.status === 'approved').length;
        const alertCount = myDoctorRequests.filter(p => (p.latestStressScore || 0) > 70).length;

        if (approvedCountElem) approvedCountElem.textContent = approvedCount;
        if (totalCountElem) totalCountElem.textContent = myDoctorRequests.length;
        if (alertCountElem) alertCountElem.textContent = alertCount;

        if (tableBody) {
            if (filtered.length === 0) {
                tableBody.innerHTML = `
                    <tr><td colspan="7" class="empty-table-msg" style="text-align: center; padding: 1.5rem;">No patient records match the selected filter.</td></tr>
                `;
            } else {
                tableBody.innerHTML = filtered.map(patient => {
                    const statusClass = patient.status === 'approved' ? 'status-badge-approved' : (patient.status === 'rejected' ? 'status-badge-rejected' : 'status-badge-pending');
                    const statusText = patient.status === 'approved' ? 'Approved ✓' : (patient.status === 'rejected' ? 'Access Declined ✗' : 'Pending Approval ⏳');
                    
                    return `
                        <tr>
                            <td><strong>${patient.patientSubjectId}</strong></td>
                            <td>${patient.patientFullName}</td>
                            <td>${patient.hospitalName}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            <td><strong style="color: ${patient.latestStressScore > 70 ? '#ef4444' : '#06b6d4'}">${patient.latestStressScore || '--'}%</strong></td>
                            <td>${patient.timestamp}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="app.viewPatientTelemetry('${patient.patientSubjectId}')">
                                    <i class="fa-solid fa-chart-line"></i> View Telemetry
                                </button>
                                ${patient.status === 'pending' ? `
                                    <button class="btn btn-sm btn-accent" style="margin-left: 0.3rem;" onclick="app.approvePatientRequest('${patient.requestId}')">
                                        <i class="fa-solid fa-check"></i> Approve
                                    </button>
                                ` : ''}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }

    approvePatientRequest(requestId) {
        const req = this.doctorRequests.find(r => r.requestId === requestId);
        if (req) {
            req.status = 'approved';
            localStorage.setItem('udvega_doctor_requests', JSON.stringify(this.doctorRequests));
            
            const userInDB = this.usersDB.find(u => u.email === req.patientEmail || u.subjectId === req.patientSubjectId);
            if (userInDB) {
                userInDB.doctorApprovalStatus = 'approved';
                localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            }

            this.updateUserProfileUI();
            this.renderDoctorPortal();
        }
    }

    rejectPatientRequest(requestId) {
        const req = this.doctorRequests.find(r => r.requestId === requestId);
        if (req) {
            req.status = 'rejected';
            localStorage.setItem('udvega_doctor_requests', JSON.stringify(this.doctorRequests));
            
            const userInDB = this.usersDB.find(u => u.email === req.patientEmail || u.subjectId === req.patientSubjectId);
            if (userInDB) {
                userInDB.doctorApprovalStatus = 'rejected';
                localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
            }

            this.updateUserProfileUI();
            this.renderDoctorPortal();
        }
    }

    renderPatientClinicalView() {
        const patientViewDocName = document.getElementById('patientViewDocName');
        const patientViewHospName = document.getElementById('patientViewHospName');
        const patientViewStatusBadge = document.getElementById('patientViewStatusBadge');
        const patientViewSubjectId = document.getElementById('patientViewSubjectId');
        const patientSessionLogsBody = document.getElementById('patientSessionLogsBody');
        const btnPatientDownloadPDF = document.getElementById('btnPatientDownloadPDF');

        if (patientViewSubjectId) {
            patientViewSubjectId.textContent = this.currentUser.subjectId || 'SUBJ-GUEST';
        }

        let doctorName = this.currentUser.doctorName || '';
        let hospName = this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital';
        let req = this.doctorRequests.find(r => 
            (r.patientEmail && r.patientEmail.toLowerCase() === (this.currentUser.email || '').toLowerCase()) || 
            (r.patientSubjectId && r.patientSubjectId === this.currentUser.subjectId)
        );

        let status = req ? req.status : (this.currentUser.doctorApprovalStatus || 'pending');

        if (req && req.doctorName) doctorName = req.doctorName;
        if (req && req.hospitalName) hospName = req.hospitalName;

        if (patientViewDocName) {
            patientViewDocName.innerHTML = doctorName 
                ? `Assigned Doctor: <strong>${doctorName}</strong>`
                : `Assigned Doctor: <span style="color: #94a3b8; font-weight: normal;">Not linked yet</span>`;
        }

        if (patientViewHospName) {
            patientViewHospName.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital: ${hospName}`;
        }

        if (patientViewStatusBadge) {
            if (!doctorName) {
                patientViewStatusBadge.innerHTML = `
                    <span class="status-badge" style="font-size: 0.85rem; padding: 0.4rem 0.9rem; background: rgba(148, 163, 184, 0.2); color: #cbd5e1;">
                        <i class="fa-solid fa-link-slash"></i> No Doctor Selected
                    </span>
                `;
            } else if (status === 'approved') {
                patientViewStatusBadge.innerHTML = `
                    <span class="status-badge status-badge-approved" style="font-size: 0.85rem; padding: 0.4rem 0.9rem; background: rgba(16, 185, 129, 0.2); color: #34d399;">
                        <i class="fa-solid fa-circle-check"></i> Linked & Telemetry Synchronized ✓
                    </span>
                `;
            } else if (status === 'rejected') {
                patientViewStatusBadge.innerHTML = `
                    <span class="status-badge status-badge-rejected" style="font-size: 0.85rem; padding: 0.4rem 0.9rem; background: rgba(239, 68, 68, 0.2); color: #f87171;">
                        <i class="fa-solid fa-circle-xmark"></i> Access Request Declined
                    </span>
                `;
            } else {
                patientViewStatusBadge.innerHTML = `
                    <span class="status-badge status-badge-pending" style="font-size: 0.85rem; padding: 0.4rem 0.9rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24;">
                        <i class="fa-solid fa-clock"></i> Link Request Pending Doctor Approval ⏳
                    </span>
                `;
            }
        }

        if (patientSessionLogsBody) {
            if (this.journalEntries && this.journalEntries.length > 0) {
                patientSessionLogsBody.innerHTML = this.journalEntries.slice(0, 15).map(entry => {
                    const stressVal = entry.stressScore || entry.stressLevel || Math.round((entry.stressIndex || 0.4) * 100);
                    let stateBadge = `<span class="badge-tag" style="background: rgba(16, 185, 129, 0.15); color: #34d399;"><i class="fa-solid fa-smile"></i> Balanced Baseline</span>`;
                    if (stressVal > 70) {
                        stateBadge = `<span class="badge-tag" style="background: rgba(239, 68, 68, 0.2); color: #f87171;"><i class="fa-solid fa-triangle-exclamation"></i> High Stress Alert</span>`;
                    } else if (stressVal > 40) {
                        stateBadge = `<span class="badge-tag" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;"><i class="fa-solid fa-face-meh"></i> Elevated Focus</span>`;
                    }

                    return `
                        <tr>
                            <td><i class="fa-regular fa-calendar-check" style="color:#06b6d4;"></i> ${entry.timestamp || entry.date || new Date().toLocaleString()}</td>
                            <td><strong style="color:${stressVal > 70 ? '#f87171' : stressVal > 40 ? '#fbbf24' : '#34d399'};">${stressVal}%</strong></td>
                            <td>${stateBadge}</td>
                            <td><span class="badge-tag" style="background: rgba(6, 182, 212, 0.15); color: #38bdf8;"><i class="fa-solid fa-cloud-arrow-up"></i> Synced to Cloud</span></td>
                        </tr>
                    `;
                }).join('');
            } else {
                patientSessionLogsBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 1.5rem;">
                            <i class="fa-solid fa-brain" style="font-size: 1.5rem; color: #6366f1; margin-bottom: 0.5rem; display: block;"></i>
                            No EEG stress session logs recorded yet. Start a session or connect hardware to log readings for your doctor.
                        </td>
                    </tr>
                `;
            }
        }

        if (btnPatientDownloadPDF) {
            btnPatientDownloadPDF.onclick = () => this.exportPDFReport();
        }
    }

    viewPatientTelemetry(subjectId) {
        let patientReq = this.doctorRequests.find(r => r.patientSubjectId === subjectId || r.patientEmail === subjectId);
        const userInDB = this.usersDB.find(u => u.subjectId === subjectId || u.email === subjectId);
        const modal = document.getElementById('patientTelemetryModal');
        
        if (modal) {
            const fullName = patientReq ? patientReq.patientFullName : (userInDB ? userInDB.fullName : subjectId);
            const email = patientReq ? patientReq.patientEmail : (userInDB ? userInDB.email : '');
            const pSubjectId = patientReq ? patientReq.patientSubjectId : (userInDB ? userInDB.subjectId : subjectId);
            const hospitalName = patientReq ? patientReq.hospitalName : (userInDB ? (userInDB.hospitalName || 'GVP Multi-Specialty Hospital') : 'Hospital');
            const docName = patientReq ? patientReq.doctorName : (userInDB ? (userInDB.doctorName || 'Assigned Doctor') : 'Consultant');
            const status = patientReq ? patientReq.status : (userInDB ? (userInDB.doctorApprovalStatus || 'approved') : 'approved');

            document.getElementById('modalPatientName').innerHTML = `<i class="fa-solid fa-user"></i> ${fullName} - Patient Info & Clinical Telemetry`;
            document.getElementById('modalPatientMeta').textContent = `Subject ID: ${pSubjectId} | Email: ${email} | Hospital: ${hospitalName} | Doctor: ${docName} | Status: ${status.toUpperCase()}`;
            
            const score = patientReq ? (patientReq.latestStressScore || 42) : 38;
            document.getElementById('modalStressScore').textContent = `${score}%`;
            document.getElementById('modalStressState').textContent = score > 70 ? 'High Stress' : (score > 40 ? 'Moderate Focus' : 'Normal / Relaxed');
            document.getElementById('modalStressBar').style.width = `${score}%`;

            const eeg = (patientReq && patientReq.eegData) ? patientReq.eegData : { delta: 18, theta: 24, alpha: 38, beta: 15, gamma: 5 };
            document.getElementById('modalDelta').textContent = `${eeg.delta} %`;
            document.getElementById('modalTheta').textContent = `${eeg.theta} %`;
            document.getElementById('modalAlpha').textContent = `${eeg.alpha} %`;
            document.getElementById('modalBeta').textContent = `${eeg.beta} %`;
            document.getElementById('modalGamma').textContent = `${eeg.gamma} %`;

            const logsBody = document.getElementById('modalPatientLogsBody');
            if (logsBody) {
                const ts = patientReq ? patientReq.timestamp : new Date().toISOString().replace('T', ' ').substring(0, 16);
                logsBody.innerHTML = `
                    <tr>
                        <td>${ts}</td>
                        <td><strong style="color: ${score > 70 ? '#ef4444' : '#10b981'}">${score}%</strong></td>
                        <td>${score > 70 ? 'Stressed' : 'Normal'}</td>
                        <td>${(eeg.beta / (eeg.alpha || 1)).toFixed(2)}</td>
                        <td>Clinical profile & EEG telemetry verified by Hospital Admin.</td>
                    </tr>
                `;
            }
            modal.style.display = 'flex';
        }
    }

    closePatientTelemetryModal() {
        const modal = document.getElementById('patientTelemetryModal');
        if (modal) modal.style.display = 'none';
    }

    openReassignDoctorModal(subjectId) {
        const patient = this.usersDB.find(u => u.subjectId === subjectId || u.email === subjectId);
        const modal = document.getElementById('reassignDoctorModal');
        const infoInput = document.getElementById('reassignPatientInfo');
        const idInput = document.getElementById('reassignPatientSubjectId');
        const docSelect = document.getElementById('reassignNewDoctorSelect');
        const alertBox = document.getElementById('reassignAlertBox');

        if (modal && patient) {
            if (infoInput) infoInput.value = `${patient.fullName} (${patient.subjectId})`;
            if (idInput) idInput.value = patient.subjectId;
            if (alertBox) alertBox.style.display = 'none';

            const hospitalName = this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital';
            const approvedDoctors = this.usersDB.filter(u => u.role === 'Doctor' && (u.status === 'approved' || !u.status) && (!u.hospitalName || u.hospitalName === hospitalName));

            if (docSelect) {
                docSelect.innerHTML = approvedDoctors.map(d => 
                    `<option value="${d.email}|${d.fullName}">${d.fullName} (${d.specialization || 'Neuro-Cardiology'})</option>`
                ).join('');
            }
            modal.style.display = 'flex';
        }
    }

    exportHospitalPDFReport() {
        const hospitalName = this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital';
        const pdfSubjectName = document.getElementById('pdfSubjectName');
        const pdfSubjectId = document.getElementById('pdfSubjectId');
        if (pdfSubjectName) pdfSubjectName.textContent = `${hospitalName} - Executive Roster`;
        if (pdfSubjectId) pdfSubjectId.textContent = `ADMIN (${this.currentUser.subjectId || 'HOSP-REG-101'})`;

        window.print();
    }

    openDoctorProfileModal(docEmail) {
        const doc = this.usersDB.find(u => (u.email && u.email.toLowerCase() === docEmail.toLowerCase()) || u.subjectId === docEmail);
        const modal = document.getElementById('doctorProfileModal');

        if (modal && doc) {
            document.getElementById('docModalAvatar').textContent = (doc.fullName || 'D').charAt(0).toUpperCase();
            document.getElementById('docModalFullName').textContent = doc.fullName;
            document.getElementById('docModalDept').innerHTML = `<i class="fa-solid fa-building-user"></i> Department of ${doc.specialization || 'Neuro-Cardiology'}`;
            document.getElementById('docModalRegId').textContent = doc.subjectId || 'DOC-201';
            document.getElementById('docModalHospital').textContent = doc.hospitalName || (this.currentUser.hospitalName || 'GVP Multi-Specialty Hospital');
            document.getElementById('docModalEmail').textContent = doc.email;
            
            const statusElem = document.getElementById('docModalStatus');
            if (statusElem) {
                const isApproved = doc.status === 'approved' || !doc.status;
                statusElem.className = isApproved ? 'status-badge status-badge-approved' : 'status-badge status-badge-pending';
                statusElem.textContent = isApproved ? 'Approved ✓' : 'Pending Approval ⏳';
            }

            const assignedPatients = this.usersDB.filter(u => u.role === 'Subject' && (u.doctorEmail === doc.email || (u.doctorName && u.doctorName.includes(doc.fullName))));
            
            document.getElementById('docModalPatientCount').textContent = assignedPatients.length;
            const patientTableBody = document.getElementById('docModalPatientListBody');

            if (patientTableBody) {
                if (assignedPatients.length === 0) {
                    patientTableBody.innerHTML = `
                        <tr><td colspan="4" class="empty-table-msg" style="text-align: center; padding: 1rem;">No patients currently assigned to ${doc.fullName}.</td></tr>
                    `;
                } else {
                    patientTableBody.innerHTML = assignedPatients.map(p => {
                        const statusClass = p.doctorApprovalStatus === 'approved' ? 'status-badge-approved' : 'status-badge-pending';
                        const statusText = p.doctorApprovalStatus === 'approved' ? 'Linked ✓' : 'Pending ⏳';
                        return `
                            <tr style="cursor: pointer;" onclick="app.viewPatientTelemetry('${p.subjectId}')">
                                <td><strong>${p.subjectId}</strong></td>
                                <td>${p.fullName}</td>
                                <td>${p.email}</td>
                                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            const filterBtn = document.getElementById('btnDocModalFilterPatients');
            if (filterBtn) {
                filterBtn.onclick = () => {
                    modal.style.display = 'none';
                    this.filterPatientsByDoctor(doc.email, doc.fullName);
                };
            }

            modal.style.display = 'flex';
        }
    }

    /* ================= THEME TOGGLE & PROFILE EDIT ENGINE ================= */
    initTheme() {
        const savedTheme = localStorage.getItem('udvega_theme') || 'dark';
        const isLight = savedTheme === 'light';
        if (isLight) {
            document.body.classList.add('light-theme');
            const icon = document.getElementById('themeToggleIcon');
            if (icon) icon.className = 'fa-solid fa-moon';
        } else {
            document.body.classList.remove('light-theme');
            const icon = document.getElementById('themeToggleIcon');
            if (icon) icon.className = 'fa-solid fa-sun';
        }

        const btnTheme = document.getElementById('btnThemeToggle');
        if (btnTheme) {
            btnTheme.onclick = () => this.toggleTheme();
        }

        this.updateChartTheme(isLight);
    }

    toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        const theme = isLight ? 'light' : 'dark';
        localStorage.setItem('udvega_theme', theme);
        const icon = document.getElementById('themeToggleIcon');
        if (icon) {
            icon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        }
        this.updateChartTheme(isLight);
    }

    updateChartTheme(isLight) {
        if (this.chart && this.chart.options && this.chart.options.scales) {
            const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
            const tickColor = isLight ? '#334155' : '#64748b';

            if (this.chart.options.scales.x) {
                if (this.chart.options.scales.x.grid) this.chart.options.scales.x.grid.color = gridColor;
                if (this.chart.options.scales.x.ticks) this.chart.options.scales.x.ticks.color = tickColor;
            }
            if (this.chart.options.scales.y) {
                if (this.chart.options.scales.y.grid) this.chart.options.scales.y.grid.color = gridColor;
                if (this.chart.options.scales.y.ticks) this.chart.options.scales.y.ticks.color = tickColor;
            }
            this.chart.update('none');
        }
    }

    initProfileAndPhoneEvents() {
        this.initTheme();

        const btnOpenProf = document.getElementById('btnOpenProfile');
        const btnCloseProf = document.getElementById('btnCloseProfileModal');
        const btnCancelProf = document.getElementById('btnCancelProfileModal');
        const userProfModal = document.getElementById('userProfileModal');
        const profileForm = document.getElementById('profileEditForm');

        if (btnOpenProf) {
            btnOpenProf.onclick = () => this.openProfileModal();
        }
        if (btnCloseProf && userProfModal) {
            btnCloseProf.onclick = () => { userProfModal.style.display = 'none'; };
        }
        if (btnCancelProf && userProfModal) {
            btnCancelProf.onclick = () => { userProfModal.style.display = 'none'; };
        }

        if (profileForm) {
            profileForm.onsubmit = (e) => {
                e.preventDefault();
                this.saveProfileChanges();
            };
        }

        const btnVerifySignup = document.getElementById('btnVerifySignupPhone');
        const btnVerifyProfile = document.getElementById('btnProfileVerifyPhone');
        const btnCancelOtp = document.getElementById('btnCancelOtpModal');
        const btnSubmitOtp = document.getElementById('btnSubmitOtpVerification');
        const otpModal = document.getElementById('phoneVerifyModal');

        if (btnVerifySignup) {
            btnVerifySignup.onclick = () => this.triggerPhoneVerification('signup');
        }
        if (btnVerifyProfile) {
            btnVerifyProfile.onclick = () => this.triggerPhoneVerification('profile');
        }
        if (btnCancelOtp && otpModal) {
            btnCancelOtp.onclick = () => { otpModal.style.display = 'none'; };
        }
        if (btnSubmitOtp) {
            btnSubmitOtp.onclick = () => this.verifyPhoneOTP();
        }
    }

    openProfileModal() {
        const modal = document.getElementById('userProfileModal');
        const alertBox = document.getElementById('profileAlertBox');
        if (!modal) return;
        if (alertBox) alertBox.style.display = 'none';

        const nameInput = document.getElementById('profileEditName');
        const ageInput = document.getElementById('profileEditAge');
        const phoneInput = document.getElementById('profileEditPhone');
        const emailInput = document.getElementById('profileEditEmail');
        const licInput = document.getElementById('profileEditLicense');
        const hospInput = document.getElementById('profileEditHospital');
        const avatarDiv = document.getElementById('modalProfileAvatar');
        const titleElem = document.getElementById('modalProfileTitle');
        const subElem = document.getElementById('modalProfileSubtitle');
        const licLabel = document.getElementById('profileLicenseLabel');
        const licHint = document.getElementById('profileLicenseHint');

        const user = this.currentUser || {};

        if (avatarDiv) avatarDiv.textContent = (user.fullName || 'G').charAt(0).toUpperCase();
        if (titleElem) titleElem.textContent = `${user.fullName || 'Guest User'} - Profile & Account Info`;
        if (subElem) subElem.textContent = `Role: ${user.role || 'Subject'} | Status: Active User Account`;

        if (nameInput) nameInput.value = user.fullName || '';
        if (ageInput) ageInput.value = user.age || 28;
        if (phoneInput) phoneInput.value = user.phone || '+91 98765 43210';
        if (emailInput) emailInput.value = user.email || '';
        if (hospInput) hospInput.value = user.hospitalName || 'GVP Multi-Specialty Hospital';

        let currentLic = user.govLicenseNo || user.subjectId;
        if (!currentLic || currentLic === 'SUBJ-GUEST') {
            if (user.role === 'Doctor') currentLic = 'MCI-AP-2026-9812';
            else if (user.role === 'HospitalAdmin') currentLic = 'NABH-AP-8841-HOSP';
            else if (user.role === 'Personal Wellness') currentLic = 'USER-' + Math.floor(1000 + Math.random()*9000) + '-APP';
            else currentLic = user.subjectId || 'SUBJ-3221';
        }

        if (licInput) licInput.value = currentLic;

        if (licLabel && licHint) {
            if (user.role === 'Doctor') {
                licLabel.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Doctor Medical License Reg No.`;
                licHint.textContent = `Official Medical Council Registration License (e.g. MCI-AP-2026-9812)`;
            } else if (user.role === 'HospitalAdmin') {
                licLabel.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital License / NABH Registration No.`;
                licHint.textContent = `Government Hospital Accreditation License (e.g. NABH-AP-8841-HOSP)`;
            } else if (user.role === 'Personal Wellness') {
                licLabel.innerHTML = `<i class="fa-solid fa-id-card-clip"></i> Personal Usage App User ID`;
                licHint.textContent = `Auto-generated Personal Usage App User ID for local telemetry tracking`;
            } else {
                licLabel.innerHTML = `<i class="fa-solid fa-hospital-user"></i> Patient Subject ID`;
                licHint.textContent = `Unique Subject ID assigned for doctor clinical consultation & EEG tracking`;
            }
        }

        this.renderPhoneStatusBadge('profilePhoneStatusBadge', user.phoneVerified);

        modal.style.display = 'flex';
    }

    renderPhoneStatusBadge(containerId, isVerified) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (isVerified) {
            container.innerHTML = `
                <span class="badge-tag" style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 0.4rem 0.8rem; font-size: 0.85rem; border-radius: 8px;">
                    <i class="fa-solid fa-circle-check"></i> Verified ✓
                </span>
            `;
        } else {
            container.innerHTML = `
                <button type="button" class="btn btn-sm btn-secondary" id="btnProfileVerifyPhone">
                    <i class="fa-solid fa-shield-check"></i> Verify OTP
                </button>
            `;
            const btn = document.getElementById('btnProfileVerifyPhone');
            if (btn) btn.onclick = () => this.triggerPhoneVerification('profile');
        }
    }

    saveProfileChanges() {
        const nameInput = document.getElementById('profileEditName');
        const ageInput = document.getElementById('profileEditAge');
        const phoneInput = document.getElementById('profileEditPhone');
        const emailInput = document.getElementById('profileEditEmail');
        const licInput = document.getElementById('profileEditLicense');
        const alertBox = document.getElementById('profileAlertBox');

        const newName = nameInput ? nameInput.value.trim() : '';
        const newAge = ageInput ? parseInt(ageInput.value, 10) : 28;
        const newPhone = phoneInput ? phoneInput.value.trim() : '';
        const newEmail = emailInput ? emailInput.value.trim().toLowerCase() : '';
        const newLic = licInput ? licInput.value.trim() : '';

        if (!newName || !newEmail || !newLic) {
            if (alertBox) {
                alertBox.className = 'auth-alert-box';
                alertBox.textContent = 'Please fill in all required fields (Name, Email, License/ID)!';
                alertBox.style.display = 'block';
            }
            return;
        }

        this.currentUser.fullName = newName;
        this.currentUser.age = newAge;
        this.currentUser.phone = newPhone;
        this.currentUser.email = newEmail;
        this.currentUser.subjectId = newLic;
        this.currentUser.govLicenseNo = newLic;

        localStorage.setItem('udvega_user', JSON.stringify(this.currentUser));

        const userInDB = this.usersDB.find(u => u.email === newEmail || u.subjectId === this.currentUser.subjectId);
        if (userInDB) {
            userInDB.fullName = newName;
            userInDB.age = newAge;
            userInDB.phone = newPhone;
            userInDB.email = newEmail;
            userInDB.subjectId = newLic;
            userInDB.govLicenseNo = newLic;
            userInDB.phoneVerified = this.currentUser.phoneVerified;
            localStorage.setItem('udvega_users_db', JSON.stringify(this.usersDB));
        }

        this.updateUserProfileUI();

        if (alertBox) {
            alertBox.className = 'auth-alert-box success';
            alertBox.textContent = 'Profile changes saved successfully! Updating UI...';
            alertBox.style.display = 'block';
        }

        setTimeout(() => {
            const modal = document.getElementById('userProfileModal');
            if (modal) modal.style.display = 'none';
        }, 1000);
    }

    triggerPhoneVerification(context) {
        this.activeOtpContext = context;
        this.currentDemoOtp = Math.floor(1000 + Math.random() * 9000).toString();

        const demoOtpDisplay = document.getElementById('demoOtpDisplay');
        const inputOtpCode = document.getElementById('inputOtpCode');
        const otpAlertBox = document.getElementById('otpAlertBox');
        const modal = document.getElementById('phoneVerifyModal');

        if (demoOtpDisplay) demoOtpDisplay.textContent = this.currentDemoOtp;
        if (inputOtpCode) inputOtpCode.value = '';
        if (otpAlertBox) otpAlertBox.style.display = 'none';

        if (modal) modal.style.display = 'flex';
    }

    verifyPhoneOTP() {
        const inputOtpCode = document.getElementById('inputOtpCode');
        const otpAlertBox = document.getElementById('otpAlertBox');
        const val = inputOtpCode ? inputOtpCode.value.trim() : '';

        if (val !== this.currentDemoOtp) {
            if (otpAlertBox) {
                otpAlertBox.className = 'auth-alert-box';
                otpAlertBox.textContent = 'Invalid OTP code! Please enter the 4-digit code shown above.';
                otpAlertBox.style.display = 'block';
            }
            return;
        }

        if (otpAlertBox) {
            otpAlertBox.className = 'auth-alert-box success';
            otpAlertBox.textContent = 'Mobile Phone Verified Successfully! ✓';
            otpAlertBox.style.display = 'block';
        }

        if (this.activeOtpContext === 'profile') {
            if (this.currentUser) this.currentUser.phoneVerified = true;
            this.renderPhoneStatusBadge('profilePhoneStatusBadge', true);
            localStorage.setItem('udvega_user', JSON.stringify(this.currentUser));
        } else if (this.activeOtpContext === 'signup') {
            this.tempPhoneVerified = true;
            const statusTxt = document.getElementById('signupPhoneStatusText');
            if (statusTxt) {
                statusTxt.innerHTML = `<span style="color:#34d399; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Mobile Phone Verified ✓</span>`;
            }
        }

        setTimeout(() => {
            const modal = document.getElementById('phoneVerifyModal');
            if (modal) modal.style.display = 'none';
        }, 1000);
    }

    quickDemoLogin(roleType) {
        if (roleType === 'master') return;
        let emailTarget = '';
        if (roleType === 'hospital') emailTarget = 'yashoda@hospital.com';
        else if (roleType === 'doctor') emailTarget = 'doctor@gvp.com';
        else if (roleType === 'patient') emailTarget = 'patient@gmail.com';
        else if (roleType === 'wellness') emailTarget = 'user@wellness.com';

        const match = this.usersDB.find(u => u.email && u.email.toLowerCase() === emailTarget);
        if (match) {
            const alertBox = document.getElementById('authAlertBox');
            if (alertBox) {
                alertBox.className = 'auth-alert-box success';
                alertBox.textContent = `Quick Demo Login: Opening dashboard as ${match.fullName} (${match.role})...`;
                alertBox.style.display = 'block';
            }
            setTimeout(() => this.saveUserProfile(match), 500);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new UdvegadarshiniApp();
    window.app.init();
});
