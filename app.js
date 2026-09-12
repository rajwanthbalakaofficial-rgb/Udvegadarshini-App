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
        try { if (typeof i18n !== 'undefined') i18n.applyTranslations(); } catch(e) { console.error("i18n error:", e); }
        try { if (typeof soundEngine !== 'undefined') soundEngine.bindCanvas('audioVisualizerCanvas'); } catch(e) { console.error("SoundEngine error:", e); }
        try { if (typeof aptaAI !== 'undefined') aptaAI.init(); } catch(e) { console.error("AptaAI error:", e); }
        try { if (typeof stressGames !== 'undefined') stressGames.init(); } catch(e) { console.error("Games error:", e); }
        try { this.bindSoundTherapyPresets(); } catch(e) { console.error("Presets error:", e); }
        try { this.initDoctorPortalEvents(); } catch(e) { console.error("Doctor portal error:", e); }
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
        try {
            const db = localStorage.getItem('udvega_users_db');
            if (db) {
                this.usersDB = JSON.parse(db);
            }
        } catch (e) {
            console.error("Corrupted users database reset:", e);
            this.usersDB = [];
        }

        if (!this.usersDB || !Array.isArray(this.usersDB)) {
            this.usersDB = [];
        }

        // Guarantee default seed users (Hospital Admin, Doctors & Patients) are always present
        const defaultAdmin = {
            email: 'admin@gvp.com',
            password: '1234',
            fullName: 'GVP Hospital Admin',
            subjectId: 'HOSP-REG-101',
            role: 'HospitalAdmin',
            hospitalName: 'GVP Multi-Specialty Hospital',
            status: 'approved',
            lang: 'teluglish'
        };

        const defaultDoc1 = {
            email: 'dr.rajesh@hospital.com',
            password: '1234',
            fullName: 'Dr. Rajesh Sharma',
            subjectId: 'DOC-701',
            role: 'Doctor',
            hospitalName: 'GVP Multi-Specialty Hospital',
            status: 'approved',
            lang: 'teluglish'
        };

        const defaultDoc2 = {
            email: 'dr.anitha@apollo.com',
            password: '1234',
            fullName: 'Dr. Anitha Reddy',
            subjectId: 'DOC-802',
            role: 'Doctor',
            hospitalName: 'Apollo Hospitals',
            status: 'approved',
            lang: 'en'
        };

        const defaultPatient = {
            email: 'patient@example.com',
            password: '1234',
            fullName: 'Santhosh Kumar',
            subjectId: 'SUBJ-3221',
            role: 'Subject',
            hospitalName: 'GVP Multi-Specialty Hospital',
            doctorEmail: 'dr.rajesh@hospital.com',
            doctorName: 'Dr. Rajesh Sharma (Cardiology)',
            doctorApprovalStatus: 'pending',
            status: 'approved',
            lang: 'teluglish'
        };

        if (!this.usersDB.some(u => (u.email && u.email.toLowerCase() === defaultAdmin.email.toLowerCase()) || (u.subjectId && u.subjectId.toLowerCase() === defaultAdmin.subjectId.toLowerCase()))) {
            this.usersDB.push(defaultAdmin);
        }
        if (!this.usersDB.some(u => u.email && u.email.toLowerCase() === defaultDoc1.email.toLowerCase())) {
            this.usersDB.push(defaultDoc1);
        }
        if (!this.usersDB.some(u => u.email && u.email.toLowerCase() === defaultDoc2.email.toLowerCase())) {
            this.usersDB.push(defaultDoc2);
        }
        if (!this.usersDB.some(u => u.email && u.email.toLowerCase() === defaultPatient.email.toLowerCase())) {
            this.usersDB.push(defaultPatient);
        }

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
                this.currentUser = JSON.parse(saved);
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
        const hospAdminView = document.getElementById('hospitalAdminView');
        const docPortalView = document.getElementById('doctorPortalView');
        const bannerBadge = document.getElementById('portalBannerBadge');
        const docTitle = document.getElementById('docPortalTitle');
        const docSub = document.getElementById('docPortalSubtitle');

        if (this.currentUser.role === 'HospitalAdmin') {
            // HIDE ALL CONSUMER TABS & CONTROLS FOR HOSPITAL ADMIN
            allNavTabs.forEach(tab => {
                if (tab !== docTab) tab.style.display = 'none';
            });
            if (modeToggleBox) modeToggleBox.style.display = 'none';
            connControls.forEach(ctrl => ctrl.style.display = 'none');

            if (docTab) {
                docTab.style.display = 'inline-flex';
                docTab.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital Admin Portal <span class="badge-unread" id="pendingReqBadge" style="display:none;">0</span>`;
            }

            if (hospAdminView) hospAdminView.style.display = 'block';
            if (docPortalView) docPortalView.style.display = 'none';

            if (bannerBadge) bannerBadge.innerHTML = `<i class="fa-solid fa-hospital"></i> Hospital Executive Admin Portal`;
            if (docTitle) docTitle.textContent = `Welcome, ${this.currentUser.fullName}`;
            if (docSub) docSub.textContent = `${this.currentUser.hospitalName || 'Clinical Health Center'} | Doctor Verification & Hospital Staff Management`;
            this.renderHospitalAdminPortal();

            // Auto-switch to Hospital Admin Portal tab
            if (docTab) docTab.click();

        } else if (this.currentUser.role === 'Doctor') {
            // HIDE ALL CONSUMER TABS & CONTROLS FOR DOCTOR
            allNavTabs.forEach(tab => {
                if (tab !== docTab) tab.style.display = 'none';
            });
            if (modeToggleBox) modeToggleBox.style.display = 'none';
            connControls.forEach(ctrl => ctrl.style.display = 'none');

            if (docTab) {
                docTab.style.display = 'inline-flex';
                docTab.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Doctor Portal <span class="badge-unread" id="pendingReqBadge" style="display:none;">0</span>`;
            }

            if (hospAdminView) hospAdminView.style.display = 'none';
            if (docPortalView) docPortalView.style.display = 'block';

            if (bannerBadge) bannerBadge.innerHTML = `<i class="fa-solid fa-user-doctor"></i> Doctor Clinical Telemetry Portal`;
            if (docTitle) docTitle.textContent = `Welcome, ${this.currentUser.fullName}`;
            if (docSub) docSub.textContent = `${this.currentUser.hospitalName || 'Clinical Hospital Center'} | Department of Neuro-Cardiology`;
            this.renderDoctorPortal();

            // Auto-switch to Doctor Portal tab
            if (docTab) docTab.click();

        } else {
            // SHOW CONSUMER TABS & CONTROLS FOR PATIENTS / WELLNESS USERS
            allNavTabs.forEach(tab => tab.style.display = 'inline-flex');
            if (modeToggleBox) modeToggleBox.style.display = 'inline-flex';
            connControls.forEach(ctrl => ctrl.style.display = 'inline-flex');

            if (docTab) {
                docTab.style.display = 'inline-flex';
                docTab.innerHTML = `<i class="fa-solid fa-hospital-user"></i> Hospital & Doctor Portal <span class="badge-unread" id="pendingReqBadge" style="display:none;">0</span>`;
            }

            if (hospAdminView) hospAdminView.style.display = 'none';
            if (docPortalView) docPortalView.style.display = 'block';
            this.renderDoctorPortal();
        }
    }

    saveUserProfile(userObj) {
        this.currentUser = {
            subjectId: userObj.subjectId,
            fullName: userObj.fullName,
            email: userObj.email || '',
            role: userObj.role,
            hospitalName: userObj.hospitalName || 'GVP Multi-Specialty Hospital',
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

        if (role === 'HospitalAdmin') {
            if (fullNameLabel) fullNameLabel.innerHTML = `<i class="fa-solid fa-user-tie"></i> Hospital Admin / Contact Person Name`;
            if (emailLabel) emailLabel.innerHTML = `<i class="fa-solid fa-envelope"></i> Official Hospital Email Address`;
            if (idLabel) idLabel.innerHTML = `<i class="fa-solid fa-id-card"></i> Hospital License / Reg ID`;
            if (idInput) {
                idInput.placeholder = 'e.g. HOSP-REG-101';
                if (!idInput.value || idInput.value === 'SUBJ-3221' || idInput.value === 'DOC-701' || idInput.value === 'USER-101') idInput.value = 'HOSP-REG-101';
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
                if (!idInput.value || idInput.value === 'SUBJ-3221' || idInput.value === 'HOSP-REG-101' || idInput.value === 'USER-101') idInput.value = 'DOC-701';
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
                if (!idInput.value || idInput.value === 'DOC-701' || idInput.value === 'HOSP-REG-101' || idInput.value === 'USER-101') idInput.value = 'SUBJ-3221';
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
                if (!idInput.value || idInput.value === 'DOC-701' || idInput.value === 'HOSP-REG-101' || idInput.value === 'SUBJ-3221') idInput.value = 'USER-101';
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
                if (role === 'HospitalAdmin') {
                    const customInput = document.getElementById('signupCustomHospital');
                    const customVal = customInput ? customInput.value.trim() : '';
                    if (!customVal) {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.textContent = 'Please type the official name of the New Hospital / Medical Center!';
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

                // Check if user already exists
                const existing = this.usersDB.find(u => u.email === email || u.subjectId === subjectId);
                if (existing) {
                    if (alertBox) {
                        alertBox.className = 'auth-alert-box';
                        alertBox.textContent = 'User already registered! Please click Log In tab.';
                        alertBox.style.display = 'block';
                    }
                    return;
                }

                // Register New Account
                const newUser = { 
                    fullName, email, password, subjectId, role, lang,
                    hospitalName: role === 'Doctor' || role === 'Subject' || role === 'HospitalAdmin' ? hospitalName : '',
                    doctorEmail: role === 'Subject' ? doctorEmail : '',
                    doctorName: role === 'Subject' ? doctorName : '',
                    doctorApprovalStatus: role === 'Subject' ? 'pending' : 'approved',
                    status: role === 'Doctor' ? 'pending_hospital_approval' : 'approved'
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
                        alertBox.textContent = `Doctor Account Registered! ⏳ Pending approval from Hospital Admin (${hospitalName}). You can log in once approved.`;
                    } else if (role === 'HospitalAdmin') {
                        alertBox.textContent = `Hospital Admin Account registered successfully! Opening Hospital Admin Portal...`;
                    } else {
                        alertBox.textContent = `Account created & Link Request sent! You can start using app & device right away...`;
                    }
                    alertBox.style.display = 'block';
                }

                if (role !== 'Doctor') {
                    setTimeout(() => this.saveUserProfile(newUser), 1000);
                }
            };
        }

        // Handle Log In Form Submission
        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                const loginInput = document.getElementById('loginEmail').value.trim().toLowerCase();
                const password = document.getElementById('loginPassword').value;

                const match = this.usersDB.find(u => 
                    ((u.email && u.email.toLowerCase() === loginInput) || 
                     (u.subjectId && u.subjectId.toLowerCase() === loginInput) ||
                     (u.fullName && u.fullName.toLowerCase() === loginInput)) &&
                    u.password === password
                );

                if (match) {
                    if (match.role === 'Doctor' && match.status === 'pending_hospital_approval') {
                        if (alertBox) {
                            alertBox.className = 'auth-alert-box';
                            alertBox.textContent = `Login Pending ⏳: Your Doctor registration is waiting for approval from your Hospital Admin (${match.hospitalName || 'Hospital'}).`;
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
            });
        });

        document.getElementById('btnConnectSerial').onclick = () => this.connectWebSerial();
        document.getElementById('btnConnectBLE').onclick = () => this.connectWebBLE();
        document.getElementById('btnToggleSim').onclick = () => this.toggleSimulator();

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
                        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
                        y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } }
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
            alert('Web Bluetooth API is not supported in this browser.');
            return;
        }

        try {
            const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true });
            this.updateConnectionBadge(true, `BLE Connected: ${device.name || 'ESP32-EEG'}`);
        } catch (err) {
            console.error('BLE connection error:', err);
        }
    }

    toggleSimulator() {
        const btnText = document.getElementById('simBtnText');

        if (this.isSimulating) {
            clearInterval(this.simInterval);
            this.isSimulating = false;
            btnText.textContent = i18n.t('startSim');
            this.updateConnectionBadge(false, 'Device Disconnected');
        } else {
            this.isSimulating = true;
            btnText.textContent = i18n.t('stopSim');
            this.updateConnectionBadge(true, 'Hardware Simulator Running');

            let simStep = 0;
            this.simInterval = setInterval(() => {
                simStep++;
                const baseVal = 30 + Math.sin(simStep * 0.15) * 20 + (Math.random() * 10 - 5);
                const stressVal = Math.min(95, Math.max(8, baseVal));

                const delta = 0.015 + Math.random() * 0.005;
                const theta = 0.010 + Math.random() * 0.004;
                const alpha = (100 - stressVal) * 0.0001 + 0.001;
                const beta = stressVal * 0.00008 + 0.0002;
                const gamma = 0.0001 + Math.random() * 0.0001;

                const ratio = beta / (alpha || 0.0001);

                this.processMetricsUpdate({
                    stressScore: stressVal,
                    delta: delta, theta: theta, alpha: alpha, beta: beta, gamma: gamma,
                    betaAlphaRatio: ratio,
                    hjorthAct: 0.06 + Math.random() * 0.01,
                    hjorthMob: 0.09 + Math.random() * 0.01,
                    hjorthComp: 2.9 + Math.random() * 0.1,
                    entropy: -6.5 + Math.random() * 0.2,
                    katzFD: 1.0
                });
            }, 1000);
        }
    }

    parseESP32SerialLine(line) {
        if (!line) return;

        const deltaMatch = line.match(/Δ:\s*([\d.]+)/);
        const thetaMatch = line.match(/Θ:\s*([\d.]+)/);
        const alphaMatch = line.match(/α:\s*([\d.]+)/);
        const betaMatch = line.match(/β:\s*([\d.]+)/);
        const gammaMatch = line.match(/γ:\s*([\d.]+)/);
        const ratioMatch = line.match(/ratio:\s*([\d.]+)/);
        const stressMatch = line.match(/(\d+\.\d+)\s*%/);

        const delta = deltaMatch ? parseFloat(deltaMatch[1]) : 0.018;
        const theta = thetaMatch ? parseFloat(thetaMatch[1]) : 0.012;
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 0.0016;
        const beta = betaMatch ? parseFloat(betaMatch[1]) : 0.0005;
        const gamma = gammaMatch ? parseFloat(gammaMatch[1]) : 0.0;
        const ratio = ratioMatch ? parseFloat(ratioMatch[1]) : (beta / (alpha || 0.001));

        const stressScore = stressMatch ? parseFloat(stressMatch[1]) : Math.min(90, Math.max(10, ratio * 100));

        this.processMetricsUpdate({
            stressScore: stressScore,
            delta: delta, theta: theta, alpha: alpha, beta: beta, gamma: gamma,
            betaAlphaRatio: ratio,
            hjorthAct: 0.0604, hjorthMob: 0.0990, hjorthComp: 2.9688,
            entropy: -6.665, katzFD: 1.000
        });
    }

    processMetricsUpdate(data) {
        const score = Math.round(data.stressScore);
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

    initDoctorPortalEvents() {
        const btnCloseModal = document.getElementById('btnClosePatientTelemetryModal');
        const btnCloseFooter = document.getElementById('btnClosePatientTelemetryModalFooter');
        if (btnCloseModal) btnCloseModal.onclick = () => this.closePatientTelemetryModal();
        if (btnCloseFooter) btnCloseFooter.onclick = () => this.closePatientTelemetryModal();

        const searchInput = document.getElementById('docPatientSearch');
        if (searchInput) {
            searchInput.oninput = () => this.renderDoctorPortal();
        }

        const filterSelect = document.getElementById('docStatusFilter');
        if (filterSelect) {
            filterSelect.onchange = () => this.renderDoctorPortal();
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
                            <p><i class="fa-solid fa-user-gear"></i> Status: Pending Admin Verification</p>
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

        // Render Approved Doctors Table
        if (doctorsTableBody) {
            if (approvedDoctors.length === 0) {
                doctorsTableBody.innerHTML = `
                    <tr><td colspan="6" class="empty-table-msg" style="text-align: center; padding: 1.5rem;">No active approved doctors registered under ${hospitalName}.</td></tr>
                `;
            } else {
                doctorsTableBody.innerHTML = approvedDoctors.map(doc => `
                    <tr>
                        <td><strong>${doc.subjectId}</strong></td>
                        <td>${doc.fullName}</td>
                        <td>${doc.email}</td>
                        <td>${doc.hospitalName || hospitalName}</td>
                        <td><span class="status-badge status-badge-approved">Approved ✓</span></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="app.revokeDoctorAccount('${doc.email}')">
                                <i class="fa-solid fa-ban"></i> Revoke Access
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Render Hospital Registered Patients Directory
        const patientsTableBody = document.getElementById('hospPatientsTableBody');
        const hospitalPatients = this.usersDB.filter(u => u.role === 'Subject' && (!u.hospitalName || u.hospitalName === hospitalName));

        if (patientsTableBody) {
            if (hospitalPatients.length === 0) {
                patientsTableBody.innerHTML = `
                    <tr><td colspan="5" class="empty-table-msg" style="text-align: center; padding: 1.5rem;">No patient records registered under ${hospitalName}.</td></tr>
                `;
            } else {
                patientsTableBody.innerHTML = hospitalPatients.map(p => {
                    const docInfo = p.doctorName || 'Unassigned';
                    const statusClass = p.doctorApprovalStatus === 'approved' ? 'status-badge-approved' : 'status-badge-pending';
                    const statusText = p.doctorApprovalStatus === 'approved' ? 'Doctor Linked ✓' : 'Pending Doctor Approval ⏳';
                    return `
                        <tr>
                            <td><strong>${p.subjectId}</strong></td>
                            <td>${p.fullName}</td>
                            <td>${p.email}</td>
                            <td>${docInfo}</td>
                            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
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

    viewPatientTelemetry(subjectId) {
        const patient = this.doctorRequests.find(r => r.patientSubjectId === subjectId || r.patientEmail === subjectId);
        const modal = document.getElementById('patientTelemetryModal');
        
        if (modal) {
            if (patient) {
                document.getElementById('modalPatientName').innerHTML = `<i class="fa-solid fa-user-doctor"></i> ${patient.patientFullName} - Telemetry`;
                document.getElementById('modalPatientMeta').textContent = `Subject ID: ${patient.patientSubjectId} | Hospital: ${patient.hospitalName} | Link Status: ${patient.status.toUpperCase()}`;
                
                const score = patient.latestStressScore || 42;
                document.getElementById('modalStressScore').textContent = `${score}%`;
                document.getElementById('modalStressState').textContent = score > 70 ? 'High Stress' : (score > 40 ? 'Moderate Focus' : 'Normal / Relaxed');
                document.getElementById('modalStressBar').style.width = `${score}%`;

                const eeg = patient.eegData || { delta: 18, theta: 24, alpha: 38, beta: 15, gamma: 5 };
                document.getElementById('modalDelta').textContent = `${eeg.delta} %`;
                document.getElementById('modalTheta').textContent = `${eeg.theta} %`;
                document.getElementById('modalAlpha').textContent = `${eeg.alpha} %`;
                document.getElementById('modalBeta').textContent = `${eeg.beta} %`;
                document.getElementById('modalGamma').textContent = `${eeg.gamma} %`;

                const logsBody = document.getElementById('modalPatientLogsBody');
                if (logsBody) {
                    logsBody.innerHTML = `
                        <tr>
                            <td>${patient.timestamp}</td>
                            <td><strong style="color: ${score > 70 ? '#ef4444' : '#10b981'}">${score}%</strong></td>
                            <td>${score > 70 ? 'Stressed' : 'Normal'}</td>
                            <td>${(eeg.beta / (eeg.alpha || 1)).toFixed(2)}</td>
                            <td>Initial baseline telemetry logged upon registration.</td>
                        </tr>
                    `;
                }
            } else {
                document.getElementById('modalPatientName').textContent = 'Patient Telemetry Details';
                document.getElementById('modalPatientMeta').textContent = `Subject ID: ${subjectId}`;
            }
            modal.style.display = 'flex';
        }
    }

    closePatientTelemetryModal() {
        const modal = document.getElementById('patientTelemetryModal');
        if (modal) modal.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new UdvegadarshiniApp();
    window.app.init();
});
