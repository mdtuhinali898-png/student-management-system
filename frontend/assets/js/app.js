/* ==========================================================================
   EduSmart Global App JavaScript - Shared across all pages
   ========================================================================== */

const API_BASE_URL = window.location.protocol === 'http:' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api' 
    : '/api';

let globalInstituteInfo = {
    name: 'EduSmart Coaching Center',
    logo: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    established: '',
    about: '',
    director: ''
};

// Load institute info globally
async function loadGlobalInstituteInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/institute/public`);
        const result = await response.json();
        
        if (result.success && result.data) {
            globalInstituteInfo = { ...globalInstituteInfo, ...result.data };
            updateAllInstituteInfo();
        }
    } catch (error) {
        console.warn('Could not load global institute info:', error);
    }
}

// Update institute info across all pages
function updateAllInstituteInfo() {
    // Update title
    if (globalInstituteInfo.name) {
        document.title = `${globalInstituteInfo.name} - EduSmart Admin`;
        
        // Update sidebar logo
        const brandName = document.getElementById('landingBrandName');
        if (brandName) brandName.textContent = globalInstituteInfo.name;
    }
    
    // Update footer
    const footerDesc = document.getElementById('landingFooterDescription');
    if (footerDesc && globalInstituteInfo.about) {
        footerDesc.textContent = globalInstituteInfo.about;
    }
    
    // Update any element with institute-name class
    document.querySelectorAll('.institute-name').forEach(el => {
        if (el.textContent && el.textContent !== 'EduSmart') {
            el.textContent = globalInstituteInfo.name;
        }
    });
}

// Get institute info
function getInstituteInfo() {
    return globalInstituteInfo;
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGlobalInstituteInfo);
} else {
    loadGlobalInstituteInfo();
}