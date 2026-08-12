// assets/js/settings.js

document.addEventListener('DOMContentLoaded', () => {
    
// ============================================
// 1. CONFIG & STATE
// ============================================
// Use relative URL if accessed through server, otherwise use localhost
const API_BASE_URL = window.location.protocol === 'http:' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : '/api';
    
    let settings = {};
    let studentsData = [];
    let paymentsData = [];
    let batchesData = [];

    // ============================================
    // 2. DATA LOADING
    // ============================================
    async function loadData() {
        settings = getDefaultSettings();
        try {
            const response = await fetch(`${API_BASE_URL}/settings`);
            const result = await response.json();
            if (result.success && result.data) settings = { ...getDefaultSettings(), ...result.data };
        } catch (error) {
            console.warn('Settings database is unavailable.', error);
        }
        try {
            const [studentsResponse, paymentsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/students?limit=1000`), fetch(`${API_BASE_URL}/payments?limit=1000`)
            ]);
            const studentsResult = await studentsResponse.json();
            const paymentsResult = await paymentsResponse.json();
            studentsData = studentsResult.students || [];
            paymentsData = paymentsResult.payments || [];
        } catch (error) {
            console.warn('Student/payment database is unavailable.', error);
        }
        
        // Fetch batches from database
        try {
            const batchesResponse = await fetch(`${API_BASE_URL}/batches`);
            const batchesResult = await batchesResponse.json();
            if (batchesResult.success) {
                batchesData = batchesResult.data;
            }
        } catch (error) {
            console.error('Error loading batches:', error);
        }

        // Public landing content is shared through the database after deployment.
        try {
            const response = await fetch(`${API_BASE_URL}/landing-settings`);
            const result = await response.json();
            if (result.success && result.data) {
                settings.landing = result.data;
                saveSettings();
            }
        } catch (error) {
            console.warn('Landing settings server unavailable; using this browser\'s saved settings.', error);
        }
    }

    async function saveSettings() {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Settings save failed');
        } catch (error) {
            console.error('Could not save settings to database.', error);
        }
    }

    function getDefaultSettings() {
        return {
            institute: {
                name: 'ABC Coaching Center',
                director: 'Md. Tuhin Ali',
                phone: '017XXXXXXXX',
                email: 'info@abc.com',
                website: '',
                established: '2020',
                address: 'Rajshahi, Bangladesh',
                about: '',
                logo: ''
            },
            academic: {
                year: '2026-2027',
                sessionStart: 'July',
                defaultFee: 1500,
                lateFeeFine: 100,
                feeDueDate: 10,
                maxDiscount: 20
            },
            profile: {
                name: 'Administrator',
                username: 'admin',
                email: 'admin@abc.com',
                phone: '',
                role: 'Super Admin',
                designation: 'System Administrator',
                photo: 'https://i.pravatar.cc/150?img=1'
            },
            system: {
                theme: 'light',
                primaryColor: '#4e73df',
                sidebarPosition: 'left',
                emailNotifications: true,
                paymentReminders: true,
                systemAlerts: true,
                language: 'en',
                currency: 'BDT',
                dateFormat: 'DD/MM/YYYY',
                timezone: 'Asia/Dhaka'
            },
            batches: []
            ,landing: {
                brandName: 'EduSmart',
                heroTitle: 'Smart Way to Manage Your Coaching Center',
                heroDescription: 'Empower your educational institute with an all-in-one smart management platform.',
                heroImage: '',
                footerDescription: 'EduSmart is the most trusted end-to-end coaching management system in Bangladesh.',
                officeHours: 'Sat - Thu: 8:00 AM - 8:00 PM',
                programs: [
                    { title: 'Medical Admission Program', price: '৳ 18,500 / course', description: 'Comprehensive preparation for Medical & Dental Colleges with focus on Biology, Chemistry, & GK.', icon: 'fas fa-stethoscope', category: 'medical', className: 'admission', type: 'regular' },
                    { title: 'Engineering Admission Program', price: '৳ 20,000 / course', description: 'Rigorous problem solving in Higher Math, Physics, and Organic Chemistry for BUET, CKRUET & MIST.', icon: 'fas fa-laptop-code', category: 'engineering', className: 'admission', type: 'regular' },
                    { title: 'Varsity A Unit Program', price: '৳ 15,000 / course', description: 'Targeted preparation for Dhaka University A Unit, JU, and GST Science Alliance entrance exams.', icon: 'fas fa-atom', category: 'varsity', className: 'admission', type: 'crash' },
                    { title: 'Varsity B Unit Program', price: '৳ 14,000 / course', description: 'Comprehensive syllabus covering English Grammar, Literature, General Knowledge & Bangla.', icon: 'fas fa-landmark', category: 'varsity', className: 'admission', type: 'regular' },
                    { title: 'HSC Academic Care', price: '৳ 2,500 / month', description: 'Mastering Board exam syllabus for 1st & 2nd year students. Creative CQ & MCQ mastery.', icon: 'fas fa-book-reader', category: 'academic', className: 'hsc', type: 'regular' },
                    { title: 'SSC Academic Care', price: '৳ 2,000 / month', description: 'Strong core building for Grade 9 & 10 students ensuring Golden A+ results in SSC board exams.', icon: 'fas fa-shapes', category: 'academic', className: 'ssc', type: 'regular' }
                ]
            }
        };
    }

    // ============================================
    // 3. TAB SWITCHING
    // ============================================
    window.switchTab = (tabName) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}Tab`).classList.add('active');
    };

    // ============================================
    // 4. INSTITUTE FORM
    // ============================================
    function loadInstituteForm() {
        const inst = settings.institute;
        document.getElementById('instituteName').value = inst.name || '';
        document.getElementById('directorName').value = inst.director || '';
        document.getElementById('institutePhone').value = inst.phone || '';
        document.getElementById('instituteEmail').value = inst.email || '';
        document.getElementById('instituteWebsite').value = inst.website || '';
        document.getElementById('establishedYear').value = inst.established || '';
        document.getElementById('instituteAddress').value = inst.address || '';
        document.getElementById('instituteAbout').value = inst.about || '';
        
        if (inst.logo) {
            document.getElementById('logoPreview').innerHTML = `<img src="${inst.logo}" alt="Logo">`;
        }
    }

    document.getElementById('instituteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const instituteData = {
            name: document.getElementById('instituteName').value,
            director: document.getElementById('directorName').value,
            phone: document.getElementById('institutePhone').value,
            email: document.getElementById('instituteEmail').value,
            website: document.getElementById('instituteWebsite').value,
            established: document.getElementById('establishedYear').value,
            address: document.getElementById('instituteAddress').value,
            about: document.getElementById('instituteAbout').value,
            logo: settings.institute.logo || ''
        };
        
        settings.institute = instituteData;
        saveSettings();
        
        // Also save to global institute API for all pages
        try {
            await fetch(`${API_BASE_URL}/institute`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institute: instituteData })
            });
        } catch (error) {
            console.warn('Could not sync institute info to global API:', error);
        }
        
        alert('✅ Institute information saved successfully!');
    });

    // Logo Upload
    document.getElementById('logoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            settings.institute.logo = event.target.result;
            document.getElementById('logoPreview').innerHTML = `<img src="${event.target.result}" alt="Logo">`;
        };
        reader.readAsDataURL(file);
    });

    // ============================================
    // 5. ACADEMIC FORM
    // ============================================
    function loadAcademicForm() {
        const acad = settings.academic;
        document.getElementById('academicYear').value = acad.year || '2026-2027';
        document.getElementById('sessionStart').value = acad.sessionStart || 'July';
        document.getElementById('defaultFee').value = acad.defaultFee || 1500;
        document.getElementById('lateFeeFine').value = acad.lateFeeFine || 100;
        document.getElementById('feeDueDate').value = acad.feeDueDate || 10;
        document.getElementById('maxDiscount').value = acad.maxDiscount || 20;
        
        loadBatchTable();
    }

    document.getElementById('academicForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        settings.academic = {
            year: document.getElementById('academicYear').value,
            sessionStart: document.getElementById('sessionStart').value,
            defaultFee: parseFloat(document.getElementById('defaultFee').value) || 1500,
            lateFeeFine: parseFloat(document.getElementById('lateFeeFine').value) || 100,
            feeDueDate: parseInt(document.getElementById('feeDueDate').value) || 10,
            maxDiscount: parseInt(document.getElementById('maxDiscount').value) || 20
        };
        
        saveSettings();
        alert('✅ Academic settings saved successfully!');
    });

    function loadBatchTable() {
        const tbody = document.getElementById('batchTableBody');
        
        // Use batches from database if available, otherwise use settings
        const batchesToDisplay = batchesData.length > 0 ? batchesData : settings.batches;
        
        if (batchesToDisplay.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#888;">No batches found. Please add batches from Batch Management page.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = batchesToDisplay.map((batch, index) => {
            const studentCount = studentsData.filter(s => s.batch === batch.name).length;
            const prefix = batch.prefix || generatePrefixFromBatchName(batch.name);
            return `
                <tr>
                    <td><strong>${batch.name}</strong></td>
                    <td>${batch.year}</td>
                    <td>
                        <div class="prefix-cell">
                            <strong>${prefix}</strong>
                            <button class="btn-edit-prefix" onclick="editBatchPrefix('${batch._id}')" title="Edit Prefix" style="background:none;border:none;color:#4e73df;cursor:pointer;margin-left:6px;font-size:12px;">
                                <i class="fas fa-pen"></i>
                            </button>
                        </div>
                    </td>
                    <td>${studentCount}</td>
                    <td><span class="status-badge status-${(batch.status || 'Active').toLowerCase()}">${batch.status || 'Active'}</span></td>
                    <td>
                        <button class="btn-edit" onclick="editBatch(${index})" title="Edit" style="background:none;border:none;color:#f6c23e;cursor:pointer;font-size:14px;padding:4px 8px;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteBatch(${index})" title="Delete" style="background:none;border:none;color:#e74a3b;cursor:pointer;font-size:14px;padding:4px 8px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function generatePrefixFromBatchName(batchName) {
        const words = batchName.split(' ');
        if (words.length >= 2) {
            const firstPart = words[0].substring(0, Math.min(2, words[0].length)).toUpperCase();
            const lastPart = words[words.length - 1].substring(2);
            return firstPart + lastPart;
        }
        return batchName.substring(0, 3).toUpperCase();
    }

    window.addBatch = async () => {
        const name = prompt('Enter batch name:');
        if (!name) return;
        
        const year = prompt('Enter batch year:', '2026');
        if (!year) return;

        const prefix = prompt('Enter Student ID Prefix (e.g., A for A001):', '');
        if (prefix === null) return;
        if (!prefix.trim()) {
            alert('❌ Prefix is required! Student ID will use auto-generated prefix.');
        }

        const fee = prompt('Enter monthly fee:', '1500');
        if (!fee) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/batches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    year: parseInt(year),
                    prefix: (prefix || '').trim().toUpperCase(),
                    fee: parseFloat(fee),
                    status: 'Active'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                batchesData.push(result.data);
                loadBatchTable();
                alert('✅ Batch added successfully!');
            } else {
                alert('❌ Failed to add batch: ' + result.message);
            }
        } catch (error) {
            console.error('Error adding batch:', error);
            alert('❌ Failed to add batch. Please ensure the backend server is running.');
        }
    };

    window.editBatch = async (index) => {
        const batch = batchesData[index] || settings.batches[index];
        if (!batch) return;
        
        const newName = prompt('Edit batch name:', batch.name);
        if (!newName) return;

        const newYear = prompt('Edit batch year:', batch.year);
        if (!newYear) return;
        
        const batchId = batch._id || index;
        
        try {
            const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    year: parseInt(newYear)
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (batchesData[index]) {
                    batchesData[index] = result.data;
                }
                loadBatchTable();
                alert('✅ Batch updated successfully!');
            } else {
                alert('❌ Failed to update batch: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating batch:', error);
            alert('❌ Failed to update batch. Please ensure the backend server is running.');
        }
    };

    window.deleteBatch = async (index) => {
        const batch = batchesData[index] || settings.batches[index];
        if (!batch) return;
        
        const studentCount = studentsData.filter(s => s.batch === batch.name).length;
        
        if (studentCount > 0) {
            alert(`❌ Cannot delete batch "${batch.name}" because it has ${studentCount} students. Please reassign or remove students first.`);
            return;
        }
        
        if (!confirm(`Are you sure you want to delete batch "${batch.name}"?`)) {
            return;
        }
        
        const batchId = batch._id || index;
        
        try {
            const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (batchesData[index]) {
                    batchesData.splice(index, 1);
                } else {
                    settings.batches.splice(index, 1);
                    saveSettings();
                }
                loadBatchTable();
                alert('✅ Batch deleted successfully!');
            } else {
                alert('❌ Failed to delete batch: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting batch:', error);
            alert('❌ Failed to delete batch. Please ensure the backend server is running.');
        }
    };

    window.editBatchPrefix = async (batchId) => {
        const batch = batchesData.find(b => b._id === batchId);
        if (!batch) return;
        
        const newPrefix = prompt('Edit Student ID Prefix:', batch.prefix || '');
        if (newPrefix === null) return;
        if (!newPrefix.trim()) {
            alert('❌ Prefix cannot be empty!');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/batches/${batchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: batch.name,
                    year: batch.year,
                    fee: batch.fee,
                    description: batch.description || '',
                    status: batch.status,
                    prefix: newPrefix.trim().toUpperCase()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Update local data
                const index = batchesData.findIndex(b => b._id === batchId);
                if (index !== -1) {
                    batchesData[index] = result.data;
                }
                loadBatchTable();
                alert('✅ Prefix updated successfully!');
            } else {
                alert('❌ Failed to update prefix: ' + result.message);
            }
        } catch (error) {
            console.error('Error updating prefix:', error);
            alert('❌ Failed to update prefix. Please ensure the backend server is running.');
        }
    };

    // ============================================
    // 6. PROFILE FORM
    // ============================================
    function loadProfileForm() {
        const prof = settings.profile;
        document.getElementById('adminName').value = prof.name || '';
        document.getElementById('adminUsername').value = prof.username || '';
        document.getElementById('adminEmail').value = prof.email || '';
        document.getElementById('adminPhone').value = prof.phone || '';
        document.getElementById('adminRole').value = prof.role || 'Super Admin';
        document.getElementById('adminDesignation').value = prof.designation || '';
        
        if (prof.photo) {
            document.getElementById('profilePhotoPreview').innerHTML = `<img src="${prof.photo}" alt="Admin">`;
        }
    }

    document.getElementById('profileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        settings.profile = {
            name: document.getElementById('adminName').value,
            username: document.getElementById('adminUsername').value,
            email: document.getElementById('adminEmail').value,
            phone: document.getElementById('adminPhone').value,
            role: document.getElementById('adminRole').value,
            designation: document.getElementById('adminDesignation').value,
            photo: settings.profile.photo || 'https://i.pravatar.cc/150?img=1'
        };
        
        saveSettings();
        alert('✅ Profile updated successfully!');
    });

    // Profile Photo Upload
    document.getElementById('profilePhotoInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File size must be less than 2MB!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            settings.profile.photo = event.target.result;
            document.getElementById('profilePhotoPreview').innerHTML = `<img src="${event.target.result}" alt="Admin">`;
        };
        reader.readAsDataURL(file);
    });

    // Password Form
    document.getElementById('passwordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const current = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        
        if (newPass !== confirm) {
            alert('❌ New password and confirm password do not match!');
            return;
        }
        
        if (newPass.length < 6) {
            alert('❌ Password must be at least 6 characters long!');
            return;
        }
        
        // In real app, verify current password from backend
        alert('✅ Password changed successfully!');
        document.getElementById('passwordForm').reset();
    });

    // ============================================
    // 7. SYSTEM SETTINGS
    // ============================================
    function loadSystemSettings() {
        const sys = settings.system;
        document.getElementById('themeToggle').checked = sys.theme === 'dark';
        document.getElementById('themeLabel').innerText = sys.theme === 'dark' ? 'Dark Mode' : 'Light Mode';
        document.getElementById('primaryColor').value = sys.primaryColor || '#4e73df';
        document.getElementById('sidebarPosition').value = sys.sidebarPosition || 'left';
        document.getElementById('emailNotifications').checked = sys.emailNotifications !== false;
        document.getElementById('paymentReminders').checked = sys.paymentReminders !== false;
        document.getElementById('systemAlerts').checked = sys.systemAlerts !== false;
        document.getElementById('language').value = sys.language || 'en';
        document.getElementById('currency').value = sys.currency || 'BDT';
        document.getElementById('dateFormat').value = sys.dateFormat || 'DD/MM/YYYY';
        document.getElementById('timezone').value = sys.timezone || 'Asia/Dhaka';
    }

    document.getElementById('themeToggle').addEventListener('change', (e) => {
        settings.system.theme = e.target.checked ? 'dark' : 'light';
        document.getElementById('themeLabel').innerText = e.target.checked ? 'Dark Mode' : 'Light Mode';
        saveSettings();
    });

    window.saveSystemSettings = () => {
        settings.system = {
            theme: document.getElementById('themeToggle').checked ? 'dark' : 'light',
            primaryColor: document.getElementById('primaryColor').value,
            sidebarPosition: document.getElementById('sidebarPosition').value,
            emailNotifications: document.getElementById('emailNotifications').checked,
            paymentReminders: document.getElementById('paymentReminders').checked,
            systemAlerts: document.getElementById('systemAlerts').checked,
            language: document.getElementById('language').value,
            currency: document.getElementById('currency').value,
            dateFormat: document.getElementById('dateFormat').value,
            timezone: document.getElementById('timezone').value
        };
        
        saveSettings();
        alert('✅ System settings saved successfully!');
    };

    // ============================================
    // 8. LANDING PAGE CONTENT
    // ============================================
    function ensureLandingSettings() {
        if (!settings.landing) settings.landing = getDefaultSettings().landing;
        if (!Array.isArray(settings.landing.programs)) settings.landing.programs = [];
    }

    function loadLandingForm() {
        ensureLandingSettings();
        const landing = settings.landing;
        document.getElementById('landingBrandName').value = landing.brandName || '';
        document.getElementById('landingHeroTitle').value = landing.heroTitle || '';
        document.getElementById('landingHeroDescription').value = landing.heroDescription || '';
        document.getElementById('landingFooterDescription').value = landing.footerDescription || '';
        document.getElementById('landingOfficeHours').value = landing.officeHours || '';
        const preview = document.getElementById('heroImagePreview');
        preview.src = landing.heroImage || 'assets/images/hero-student.jpg';
        renderLandingPrograms();
    }

    document.getElementById('landingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ensureLandingSettings();
        Object.assign(settings.landing, {
            brandName: document.getElementById('landingBrandName').value.trim(),
            heroTitle: document.getElementById('landingHeroTitle').value.trim(),
            heroDescription: document.getElementById('landingHeroDescription').value.trim(),
            footerDescription: document.getElementById('landingFooterDescription').value.trim(),
            officeHours: document.getElementById('landingOfficeHours').value.trim()
        });
        saveSettings();
        await saveLandingSettingsToServer();
    });

    document.getElementById('heroImageInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return alert('Image must be smaller than 2MB.');
        const reader = new FileReader();
        reader.onload = async (event) => {
            ensureLandingSettings();
            settings.landing.heroImage = event.target.result;
            document.getElementById('heroImagePreview').src = event.target.result;
            saveSettings();
            await saveLandingSettingsToServer();
        };
        reader.readAsDataURL(file);
    });

    function renderLandingPrograms() {
        const list = document.getElementById('landingProgramsList');
        const cards = settings.landing.programs;
        if (!cards.length) {
            list.innerHTML = '<p class="content-help">No custom cards yet. The existing landing page cards will remain visible. Click “Add Card” to create your own.</p>';
            return;
        }
        list.innerHTML = cards.map((card, index) => `<div class="landing-program-row"><div><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.price || 'No price')} · ${escapeHtml(card.category || 'general')}</p></div><div class="landing-row-actions"><button type="button" onclick="editProgramCard(${index})"><i class="fas fa-pen"></i></button><button type="button" class="delete-card" onclick="deleteProgramCard(${index})"><i class="fas fa-trash"></i></button></div></div>`).join('');
    }

    const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
    window.openProgramEditor = () => { document.getElementById('programEditorForm').reset(); document.getElementById('programEditIndex').value = ''; document.getElementById('programIcon').value = 'fas fa-book'; document.getElementById('programCategory').value = 'academic'; document.getElementById('programClass').value = 'all'; document.getElementById('programType').value = 'regular'; document.getElementById('programEditorTitle').textContent = 'Add Program Card'; document.getElementById('programEditorModal').classList.add('open'); };
    window.closeProgramEditor = () => document.getElementById('programEditorModal').classList.remove('open');
    window.editProgramCard = (index) => { const card = settings.landing.programs[index]; Object.entries({ programEditIndex:index, programTitle:card.title, programPrice:card.price, programDescription:card.description, programIcon:card.icon, programCategory:card.category, programClass:card.className, programType:card.type }).forEach(([id, value]) => document.getElementById(id).value = value || ''); document.getElementById('programEditorTitle').textContent = 'Edit Program Card'; document.getElementById('programEditorModal').classList.add('open'); };
    window.deleteProgramCard = async (index) => { if (!confirm('Delete this program card?')) return; settings.landing.programs.splice(index, 1); saveSettings(); await saveLandingSettingsToServer(); renderLandingPrograms(); };
    document.getElementById('programEditorForm').addEventListener('submit', async (e) => { e.preventDefault(); ensureLandingSettings(); const card = { title:document.getElementById('programTitle').value.trim(), price:document.getElementById('programPrice').value.trim(), description:document.getElementById('programDescription').value.trim(), icon:document.getElementById('programIcon').value.trim() || 'fas fa-book', category:document.getElementById('programCategory').value.trim() || 'general', className:document.getElementById('programClass').value.trim() || 'all', type:document.getElementById('programType').value.trim() || 'regular' }; const index = document.getElementById('programEditIndex').value; if (index === '') settings.landing.programs.push(card); else settings.landing.programs[Number(index)] = card; saveSettings(); await saveLandingSettingsToServer(); renderLandingPrograms(); closeProgramEditor(); });

    async function saveLandingSettingsToServer() {
        try {
            const response = await fetch(`${API_BASE_URL}/landing-settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings.landing) });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Save failed');
            alert('Landing page content saved successfully.');
        } catch (error) {
            console.warn('Could not save landing settings to server.', error);
            alert('Saved in this browser. Start the server/database to make it visible to all visitors.');
        }
    }

    // ============================================
    // 9. BACKUP & RESTORE
    // ============================================
    function updateBackupStats() {
        document.getElementById('backupStudents').innerText = studentsData.length;
        document.getElementById('backupPayments').innerText = paymentsData.length;
        
        const dataSize = new Blob([JSON.stringify(settings), JSON.stringify(studentsData), JSON.stringify(paymentsData)]).size;
        document.getElementById('backupSize').innerText = (dataSize / 1024).toFixed(2) + ' KB';
    }

    window.createBackup = () => {
        const backup = {
            settings: settings,
            students: studentsData,
            payments: paymentsData,
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        alert('✅ Backup created successfully!');
    };

    document.getElementById('restoreInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!confirm('⚠️ This will replace all current data. Are you sure?')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                if (backup.settings) {
                    settings = backup.settings;
                    saveSettings();
                }
                
                if (backup.students) {
                    studentsData = backup.students;
                }
                
                if (backup.payments) {
                    paymentsData = backup.payments;
                }
                
                alert('✅ Data restored successfully! Reloading...');
                setTimeout(() => location.reload(), 1000);
            } catch (error) {
                alert('❌ Invalid backup file!');
            }
        };
        reader.readAsText(file);
    });

    window.clearAllData = () => {
        if (confirm('⚠️ This will permanently delete ALL data. This cannot be undone! Type "DELETE" to confirm:')) {
            const confirmation = prompt('Type DELETE to confirm:');
            if (confirmation === 'DELETE') {
                localStorage.removeItem(STUDENTS_KEY);
                localStorage.removeItem(PAYMENTS_KEY);
                localStorage.removeItem(SETTINGS_KEY);
                alert('✅ All data cleared! Reloading...');
                setTimeout(() => location.reload(), 1000);
            }
        }
    };

    window.resetToDefault = () => {
        if (confirm('⚠️ This will reset all settings to default. Student and payment data will remain. Continue?')) {
            settings = getDefaultSettings();
            saveSettings();
            alert('✅ Settings reset to default! Reloading...');
            setTimeout(() => location.reload(), 1000);
        }
    };

    // ============================================
    // 9. SIDEBAR TOGGLE
    // ============================================
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

    // ============================================
    // 10. NOTICE MANAGEMENT
    // ============================================
    async function loadNotices() {
        const tbody = document.getElementById('noticesTableBody');
        if (!tbody) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/notices`);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                tbody.innerHTML = result.data.map((notice, index) => `
                    <tr>
                        <td><strong>${escapeHtml(notice.title)}</strong></td>
                        <td><span class="badge badge-${notice.badgeColor || 'primary'}">${escapeHtml(notice.badge || 'Notice')}</span></td>
                        <td><span class="status-badge status-${notice.isActive ? 'active' : 'inactive'}">${notice.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>${notice.sortOrder || 0}</td>
                        <td>
                            <button class="btn-edit" onclick="editNotice('${notice._id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-delete" onclick="deleteNotice('${notice._id}')"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No notices found. Click "Add Notice" to create one.</td></tr>';
            }
        } catch (error) {
            console.error('Error loading notices:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">Error loading notices. Please refresh.</td></tr>';
        }
    }

    let selectedPdfBase64 = null;
    let selectedPdfName = null;

    window.openNoticeEditor = () => {
        document.getElementById('noticeEditorForm').reset();
        document.getElementById('noticeEditId').value = '';
        document.getElementById('noticeEditorTitle').textContent = 'Add Notice';
        document.getElementById('noticePdfPreview').innerHTML = '';
        selectedPdfBase64 = null;
        selectedPdfName = null;
        document.getElementById('noticeEditorModal').classList.add('open');
    };

    document.getElementById('noticePdfInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('PDF file size must be less than 5MB!');
            e.target.value = '';
            return;
        }
        
        if (file.type !== 'application/pdf') {
            alert('Please select a PDF file!');
            e.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result.split(',')[1];
            selectedPdfBase64 = base64;
            selectedPdfName = file.name;
            document.getElementById('noticePdfPreview').innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> Selected: <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        };
        reader.readAsDataURL(file);
    });

    window.closeNoticeEditor = () => {
        document.getElementById('noticeEditorModal').classList.remove('open');
    };

    window.removeExistingPdf = async () => {
        const id = document.getElementById('noticeEditId').value;
        if (!id) return;
        
        if (!confirm('Remove existing PDF attachment?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfUrl: '' })
            });
            
            const result = await response.json();
            if (result.success) {
                document.getElementById('noticePdfPreview').innerHTML = '';
                selectedPdfBase64 = null;
                selectedPdfName = null;
                alert('PDF removed successfully!');
            }
        } catch (error) {
            console.error('Error removing PDF:', error);
            alert('Failed to remove PDF.');
        }
    };

    window.editNotice = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/notices/${id}`);
            const result = await response.json();
            
            if (result.success) {
                const notice = result.data;
                document.getElementById('noticeEditId').value = notice._id;
                document.getElementById('noticeTitle').value = notice.title || '';
                document.getElementById('noticeDescription').value = notice.description || '';
                document.getElementById('noticeBadge').value = notice.badge || 'Notice';
                document.getElementById('noticeBadgeColor').value = notice.badgeColor || 'primary';
                document.getElementById('noticeButtonText').value = notice.buttonText || 'Learn More';
                document.getElementById('noticeButtonLink').value = notice.buttonLink || '#';
                document.getElementById('noticeIcon').value = notice.icon || 'fas fa-bullhorn';
                document.getElementById('noticeSortOrder').value = notice.sortOrder || 0;
                document.getElementById('noticeStatus').value = notice.isActive ? 'true' : 'false';
                document.getElementById('noticeEditorTitle').textContent = 'Edit Notice';
                document.getElementById('noticeEditorModal').classList.add('open');
            }
        } catch (error) {
            console.error('Error loading notice:', error);
            alert('Failed to load notice details.');
        }
    };

    window.deleteNotice = async (id) => {
        if (!confirm('Are you sure you want to delete this notice?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Notice deleted successfully!');
                loadNotices();
            } else {
                alert('Failed to delete notice: ' + result.message);
            }
        } catch (error) {
            console.error('Error deleting notice:', error);
            alert('Failed to delete notice. Please ensure the backend server is running.');
        }
    };

    document.getElementById('noticeEditorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('noticeEditId').value;
        const noticeData = {
            title: document.getElementById('noticeTitle').value.trim(),
            description: document.getElementById('noticeDescription').value.trim(),
            badge: document.getElementById('noticeBadge').value.trim() || 'Notice',
            badgeColor: document.getElementById('noticeBadgeColor').value,
            buttonText: document.getElementById('noticeButtonText').value.trim() || 'Learn More',
            buttonLink: document.getElementById('noticeButtonLink').value.trim() || '#',
            icon: document.getElementById('noticeIcon').value.trim() || 'fas fa-bullhorn',
            sortOrder: parseInt(document.getElementById('noticeSortOrder').value) || 0,
            isActive: document.getElementById('noticeStatus').value === 'true'
        };
        
        try {
            let noticeId = id;
            
            // First save/update the notice
            const url = id ? `${API_BASE_URL}/notices/${id}` : `${API_BASE_URL}/notices`;
            const method = id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noticeData)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                alert('Failed to save notice: ' + result.message);
                return;
            }
            
            // Get the notice ID (for new notices)
            noticeId = result.data._id;
            
            // Upload PDF if selected
            if (selectedPdfBase64 && noticeId) {
                const pdfResponse = await fetch(`${API_BASE_URL}/notices/${noticeId}/upload-pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pdfData: selectedPdfBase64,
                        fileName: selectedPdfName
                    })
                });
                
                const pdfResult = await pdfResponse.json();
                if (!pdfResult.success) {
                    console.warn('Failed to upload PDF:', pdfResult.message);
                }
            }
            
            alert(id ? 'Notice updated successfully!' : 'Notice created successfully!');
            closeNoticeEditor();
            loadNotices();
            selectedPdfBase64 = null;
            selectedPdfName = null;
        } catch (error) {
            console.error('Error saving notice:', error);
            alert('Failed to save notice. Please ensure the backend server is running.');
        }
    });

    // ============================================
    // 11. INITIALIZE
    // ============================================
    async function init() {
        await loadData();
        loadInstituteForm();
        loadAcademicForm();
        loadProfileForm();
        loadSystemSettings();
        loadLandingForm();
        loadNotices();
        updateBackupStats();
    }

    init();
});
