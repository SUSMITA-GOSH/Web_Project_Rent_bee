import { auth, db, storage } from './firebase.js';
import {
  doc, setDoc, getDoc, collection, query, where, getDocs, addDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ref, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// DOM Elements
const accountTypeSelect = document.getElementById('accountType');
const serviceField = document.getElementById('producerFields');
const profileForm = document.getElementById('profileForm');
const profileImageInput = document.getElementById('profileImage');

// Navbar Elements
const navLoginItem = document.getElementById('navLoginItem');
const navSignupItem = document.getElementById('navSignupItem');
const navProfileItem = document.getElementById('navProfileItem');
const navLogoutItem = document.getElementById('navLogoutItem');
const navLogoutBtn = document.getElementById('navLogoutBtn');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');

// Auth State Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Logged In
    if (navLoginItem) navLoginItem.style.display = 'none';
    if (navSignupItem) navSignupItem.style.display = 'none';

    if (navProfileItem) {
      navProfileItem.style.display = 'list-item';

      // Load Profile Image for Navbar
      const navImg = document.getElementById('navProfileImg');
      if (navImg) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profileImageURL) {
            navImg.src = data.profileImageURL;
          }
        }
      }
    }

    // Show Logout Button
    if (navLogoutItem) {
      navLogoutItem.style.display = 'list-item';
    }

    // Logout Logic
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => signOut(auth).then(() => window.location.reload());
    }

    // Pre-fill profile form if on profile page
    if (profileForm) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const saveBtn = document.getElementById('saveProfileBtn');
      const editBtn = document.getElementById('editProfileBtn');
      const inputs = profileForm.querySelectorAll('input, select, textarea');

      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('name').value = data.name || '';

        // Auto-detect role/type
        const userRole = data.role || data.type;
        console.log('User role:', userRole); // DEBUG
        console.log('serviceField element:', serviceField); // DEBUG

        // Store the user role globally so we can access it when saving
        window.currentUserRole = userRole || 'provider'; // Default to provider if undefined

        if (accountTypeSelect && userRole) {
          accountTypeSelect.value = userRole;
          accountTypeSelect.parentElement.style.display = 'none';
        }

        // Show provider fields unless explicitly a receiver
        if (serviceField) {
          serviceField.style.display = (userRole === 'receiver') ? 'none' : 'block';
          console.log('Set serviceField display to:', serviceField.style.display); // DEBUG
        }
        if (document.getElementById('services')) document.getElementById('services').value = data.services ? data.services.join(', ') : '';
        if (document.getElementById('portfolio')) document.getElementById('portfolio').value = data.portfolio || '';
        if (document.getElementById('whatsapp')) document.getElementById('whatsapp').value = data.whatsapp || '';
        if (document.getElementById('gmail')) document.getElementById('gmail').value = data.gmail || data.email || user.email || '';
        if (document.getElementById('facebook')) document.getElementById('facebook').value = data.facebook || '';
        if (document.getElementById('twitter')) document.getElementById('twitter').value = data.twitter || '';
        if (document.getElementById('address')) document.getElementById('address').value = data.address || '';
        if (document.getElementById('github')) document.getElementById('github').value = data.github || '';
        if (document.getElementById('hourlyRate')) document.getElementById('hourlyRate').value = data.hourlyRate || '';
        if (document.getElementById('dailyRate')) document.getElementById('dailyRate').value = data.dailyRate || '';

        // Show existing image or default
        const preview = document.getElementById('imagePreview');
        if (preview) {
          preview.src = data.profileImageURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
          preview.style.display = 'block';
        }

        // Disable inputs and hide save button
        inputs.forEach(input => input.disabled = true);
        saveBtn.style.display = 'none';
        editBtn.style.display = 'block';
      }

      // Edit Button Logic
      editBtn.addEventListener('click', () => {
        inputs.forEach(input => input.disabled = false);
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';
      });
    }
  } else {
    // Logged Out
    if (navLoginItem) navLoginItem.style.display = 'list-item';
    if (navSignupItem) navSignupItem.style.display = 'list-item';
    if (navProfileItem) navProfileItem.style.display = 'none';
    if (navLogoutItem) navLogoutItem.style.display = 'none';
  }
});

// Profile Form Handling
if (accountTypeSelect) {
  accountTypeSelect.addEventListener('change', (e) => {
    serviceField.style.display = (e.target.value === 'provider' || e.target.value === 'producer') ? 'block' : 'none';
  });
}

async function uploadProfileImage(base64String, userId) {
  try {
    // alert('Starting upload...'); // Debug
    // Create a reference with a timestamp
    const storageRef = ref(storage, `profile_images/${userId}/profile_${Date.now()}.jpg`);

    // alert('Uploading string...'); // Debug
    const snapshot = await uploadString(storageRef, base64String, 'data_url');

    // alert('Getting download URL...'); // Debug
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("Upload failed:", error);
    alert('Upload Error Details: ' + error.message); // Show actual error to user
    throw error;
  }
}

// Image Preview Logic
if (profileImageInput) {
  profileImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to save your profile.');
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      return;
    }

    const name = document.getElementById('name').value.trim();
    // Get type from global variable (set when profile loaded) or from select
    let accountType = window.currentUserRole || accountTypeSelect.value || 'provider';
    console.log('Account type for save:', accountType); // DEBUG

    // If accountType is empty (e.g. if we hid it and didn't set it properly, though we did set it above),
    // we should rely on what was loaded. But for safety, let's assume the value is there.

    const services = document.getElementById('services')?.value.trim() || '';
    const portfolio = document.getElementById('portfolio')?.value.trim() || '';
    const whatsapp = document.getElementById('whatsapp')?.value.trim() || '';
    const gmail = document.getElementById('gmail')?.value.trim() || '';
    const facebook = document.getElementById('facebook')?.value.trim() || '';
    const github = document.getElementById('github')?.value.trim() || '';
    const hourlyRate = parseFloat(document.getElementById('hourlyRate')?.value) || 0;
    const dailyRate = parseFloat(document.getElementById('dailyRate')?.value) || 0;

    if (!name) {
      alert('Name is required.');
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
      return;
    }

    const profileData = {
      name,
      type: accountType,
      portfolio: portfolio,
      whatsapp: whatsapp,
      gmail: gmail,
      facebook: facebook,
      twitter: document.getElementById('twitter').value.trim(),
      address: document.getElementById('address')?.value.trim() || ''
    };

    // Handle Image Upload for Everyone
    if (profileImageInput.files.length > 0) {
      try {
        saveBtn.textContent = 'Uploading Image...';

        const file = profileImageInput.files[0];
        const reader = new FileReader();

        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        const base64String = await base64Promise;
        const uploadPromise = uploadProfileImage(base64String, user.uid);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timed out (30s). Check connection.')), 30000)
        );

        const imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
        profileData.profileImageURL = imageUrl;
      } catch (err) {
        console.error(err);
        alert('Profile image upload failed: ' + err.message);
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        return;
      }
    }

    // Provider Specific Data
    if (accountType === 'provider' || accountType === 'producer') {
      profileData.services = services ? services.toLowerCase().split(',').map(s => s.trim()) : [];
      profileData.github = github;
      profileData.hourlyRate = hourlyRate;
      profileData.dailyRate = dailyRate;
    }

    console.log('Profile data to save:', profileData); // DEBUG

    try {
      saveBtn.textContent = 'Saving Data...'; // Progress update
      console.log('Attempting to save to Firestore...'); // DEBUG
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      console.log('Save successful!'); // DEBUG
      alert('Profile saved successfully!');
      // Small delay to ensure Firestore commits before reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Save error:', error); // DEBUG
      alert('Error saving profile: ' + error.message);
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  });
}

const viewProfileBtn = document.getElementById('viewProfileBtn');
if (viewProfileBtn) {
  viewProfileBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
      window.location.href = `profile-view.html?id=${user.uid}`;
    } else {
      alert('Please log in first.');
    }
  });
}

// Search Functionality
if (searchBtn) {
  searchBtn.addEventListener('click', async () => {
    const queryText = searchInput.value.toLowerCase().trim();
    if (!queryText) return;

    resultsSection.style.display = 'block';
    resultsGrid.innerHTML = '<p>Searching...</p>';

    try {
      // Fetch all producers first (avoids complex index requirements)
      const q = query(collection(db, "users"), where("type", "==", "provider"));
      const querySnapshot = await getDocs(q);

      resultsGrid.innerHTML = '';
      let found = false;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Client-side filter for partial matches (better than Firestore array-contains which needs exact match)
        if (data.services && data.services.some(s => s.toLowerCase().includes(queryText))) {
          const card = createProviderCard(doc.id, data);
          resultsGrid.appendChild(card);
          found = true;
        }
      });

      if (!found) {
        resultsGrid.innerHTML = '<p>No providers found for this skill.</p>';
      }

    } catch (error) {
      console.error("Error searching: ", error);
      resultsGrid.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  });
}

window.searchByTag = (tag) => {
  if (searchInput) {
    searchInput.value = tag;
    searchBtn.click();
  }
};

function createProviderCard(id, data) {
  const col = document.createElement('div');
  col.className = 'col-md-4 col-sm-6';

  const imgUrl = data.profileImageURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  col.innerHTML = `
    <div class="card h-100 shadow-sm">
      <div class="card-body text-center">
        <img src="${imgUrl}" alt="${data.name}" class="rounded-circle mb-3" style="width: 100px; height: 100px; object-fit: cover;">
        <h5 class="card-title fw-bold">${data.name}</h5>
        <div class="mb-2">
            <span class="badge bg-success">Verified</span>
            <span class="badge bg-warning text-dark">4.8 ★</span>
        </div>
        <p class="card-text text-muted small">${data.services ? data.services.slice(0, 3).join(', ') : ''}</p>
        <div class="d-flex justify-content-center gap-3 mb-3">
            <small>Rate: $${data.hourlyRate || 0}/hr</small>
        </div>
        <button class="btn btn-warning w-100" onclick="window.location.href='profile-view.html?id=${id}'">View Profile</button>
      </div>
    </div>
  `;
  return col;
}

// ... (existing code)

// Booking Page Logic
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('providerId');
  const providerNameSpan = document.getElementById('providerName');
  const providerRateSpan = document.getElementById('providerRate');
  const totalPriceSpan = document.getElementById('totalPrice');
  const hoursInput = document.getElementById('hours');
  let hourlyRate = 0;

  if (!providerId) {
    alert('No provider selected.');
    window.location.href = 'index.html';
  }

  // Fetch provider details
  getDoc(doc(db, 'users', providerId)).then(docSnap => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      providerNameSpan.textContent = data.name;
      hourlyRate = data.hourlyRate || 0;
      providerRateSpan.textContent = hourlyRate;
      updateTotal();
    } else {
      alert('Provider not found.');
    }
  });

  function updateTotal() {
    const hours = parseInt(hoursInput.value) || 0;
    totalPriceSpan.textContent = hours * hourlyRate;
  }

  hoursInput.addEventListener('input', updateTotal);

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert('Please log in to book.');
      window.location.href = 'login.html';
      return;
    }

    const bookingData = {
      requesterId: user.uid,
      providerId: providerId,
      date: document.getElementById('date').value,
      time: document.getElementById('time').value,
      hours: document.getElementById('hours').value,
      taskDetails: document.getElementById('taskDetails').value,
      paymentMethod: document.querySelector('input[name="payment"]:checked').value,
      totalPrice: parseFloat(totalPriceSpan.textContent),
      status: 'pending', // pending, confirmed, completed
      createdAt: new Date()
    };

    try {
      await addDoc(collection(db, 'bookings'), bookingData);
      alert('Booking confirmed! Payment held in escrow.');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error booking:', error);
      alert('Booking failed: ' + error.message);
    }
  });
}

// Profile View Logic
const profileName = document.getElementById('profileName');
if (profileName && window.location.pathname.includes('profile-view.html')) { // Simple check to run only on profile-view
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');

  if (providerId) {
    getDoc(doc(db, 'users', providerId)).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('profileName').textContent = data.name;
        document.getElementById('profileImg').src = data.profileImageURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        document.getElementById('hourlyRate').textContent = data.hourlyRate || 0;
        document.getElementById('dailyRate').textContent = data.dailyRate || 0;
        document.getElementById('portfolioText').textContent = data.portfolio || 'No portfolio items.';

        // Address
        if (data.address) {
          const addressSection = document.getElementById('addressSection');
          const addressText = document.getElementById('addressText');
          if (addressSection && addressText) {
            addressText.textContent = data.address;
            addressSection.style.display = 'block';
          }
        }

        // Services
        const serviceList = document.getElementById('serviceList');
        if (data.services) {
          data.services.forEach(s => {
            const li = document.createElement('li');
            li.textContent = `• ${s}`;
            serviceList.appendChild(li);
          });
        }

        // Socials - Display as prominent buttons
        const socialLinks = document.getElementById('socialLinks');
        socialLinks.innerHTML = ''; // Clear previous

        if (data.whatsapp) {
          socialLinks.innerHTML += `
                <a href="https://wa.me/${data.whatsapp}" target="_blank" class="social-btn social-btn-whatsapp">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                </a>`;
        }
        if (data.gmail || data.email) {
          const emailAddr = data.gmail || data.email;
          socialLinks.innerHTML += `
                <a href="mailto:${emailAddr}" class="social-btn social-btn-email">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Email
                </a>`;
        }
        if (data.facebook) {
          socialLinks.innerHTML += `
                <a href="${data.facebook}" target="_blank" title="Facebook" class="btn btn-outline-primary rounded-pill px-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    Facebook
                </a>`;
        }
        if (data.github) {
          socialLinks.innerHTML += `
                <a href="${data.github}" target="_blank" title="GitHub" class="btn btn-outline-dark rounded-pill px-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                    GitHub
                </a>`;
        }

        // If no contact info available
        if (!data.whatsapp && !data.gmail && !data.email && !data.facebook && !data.github) {
          socialLinks.innerHTML = '<p class="text-muted small text-center w-100">No contact information available</p>';
        }

        // Check role and adjust view
        const isProvider = data.type === 'provider' || data.type === 'producer' || (data.role === 'provider');

        // Hide/Show Provider Specifics
        const ratesDiv = document.querySelector('.rates');
        const serviceSection = document.querySelector('.profile-section h3').parentElement; // Services section
        const bookBtn = document.getElementById('bookNowBtn');

        if (!isProvider) {
          if (ratesDiv) ratesDiv.style.display = 'none';
          if (serviceSection) serviceSection.style.display = 'none';
          if (bookBtn) bookBtn.style.display = 'none';
          document.title = 'User Profile - RentBee';
        } else {
          if (ratesDiv) ratesDiv.style.display = 'block';
          if (serviceSection) serviceSection.style.display = 'block';
          if (bookBtn) bookBtn.style.display = 'block';
          document.title = 'Provider Profile - RentBee';
        }
        // Browse Page Logic
        const providersList = document.getElementById('providersList');
        if (providersList) {
          const urlParams = new URLSearchParams(window.location.search);
          const initialCategory = urlParams.get('category');

          // Set initial filter if present
          if (initialCategory) {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = initialCategory;
          }

          loadProviders();

          document.getElementById('applyFiltersBtn').addEventListener('click', loadProviders);
        }

        async function loadProviders() {
          if (!providersList) return;

          providersList.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-warning" role="status"></div></div>';

          try {
            const category = document.getElementById('categoryFilter').value;
            const minRate = parseFloat(document.getElementById('minRate').value) || 0;
            const maxRate = parseFloat(document.getElementById('maxRate').value) || 10000;

            // Base query
            let q = query(collection(db, "users"), where("type", "==", "provider"));

            const querySnapshot = await getDocs(q);
            const providers = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();
              let matches = true;

              // Filter by Category (Service)
              if (category) {
                const hasService = data.services && data.services.some(s => s.toLowerCase().includes(category.toLowerCase()));
                if (!hasService) matches = false;
              }

              // Filter by Rate
              const rate = data.hourlyRate || 0;
              if (rate < minRate || rate > maxRate) matches = false;

              if (matches) {
                providers.push({ id: doc.id, ...data });
              }
            });

            renderProviders(providers);

          } catch (error) {
            console.error("Error loading providers:", error);
            providersList.innerHTML = `<p class="text-danger text-center">Error loading providers: ${error.message}</p>`;
          }
        }

        function renderProviders(providers) {
          const countEl = document.getElementById('resultsCount');
          if (countEl) countEl.textContent = `${providers.length} Providers Found`;

          if (providers.length === 0) {
            providersList.innerHTML = '';
            document.getElementById('empty-message').classList.remove('hidden');
            return;
          }

          document.getElementById('empty-message').classList.add('hidden');
          providersList.innerHTML = providers.map(p => createUpworkStyleCard(p)).join('');
        }

        function createUpworkStyleCard(data) {
          const imgUrl = data.profileImageURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
          const servicesHtml = data.services ? data.services.map(s => `<span class="skill-tag">${s}</span>`).join('') : '';

          return `
    <div class="card provider-card p-4">
      <div class="row g-0">
        <div class="col-md-9">
          <div class="d-flex justify-content-between">
            <h5 class="fw-bold mb-1 text-primary" style="cursor:pointer;" onclick="window.location.href='profile-view.html?id=${data.id}'">${data.name}</h5>
          </div>
          <div class="mb-2">
            <span class="fw-bold text-dark">${data.services ? data.services[0] : 'Service Provider'}</span>
          </div>
          <div class="mb-3">
             <span class="verified-badge">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-primary"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
               Payment verified
             </span>
             <span class="text-muted ms-3">
               <span class="text-warning">★★★★★</span> 5.0
             </span>
             <span class="text-muted ms-3">
               📍 ${data.division || 'Dhaka, Bangladesh'}
             </span>
          </div>
          
          <p class="text-muted mb-3" style="font-size: 0.95rem; line-height: 1.6;">
            ${data.portfolio || 'Experienced professional ready to help with your tasks. Click to view full profile and portfolio.'}
          </p>
          
          <div class="d-flex flex-wrap">
            ${servicesHtml}
          </div>
        </div>
        
        <div class="col-md-3 border-start ps-md-4 d-flex flex-column justify-content-center align-items-center mt-3 mt-md-0">
          <img src="${imgUrl}" class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;">
          <h4 class="fw-bold mb-1">$${data.hourlyRate || 0}</h4>
          <span class="text-muted small mb-3">per hour</span>
          <button class="btn btn-warning fw-bold w-100 rounded-pill" onclick="window.location.href='profile-view.html?id=${data.id}'">View Profile</button>
        </div>
      </div>
    </div>
  `;
        }
        // Book Button Logic (Only if provider)
        if (isProvider) {
          document.getElementById('bookNowBtn').onclick = () => {
            window.location.href = `booking.html?providerId=${providerId}`;
          };
        }

        // Edit Button Logic (If owner)
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === providerId) {
          const editBtn = document.getElementById('editPublicProfileBtn');
          if (editBtn) {
            editBtn.style.display = 'inline-block';
            // Hide book button for owner
            if (bookBtn) bookBtn.style.display = 'none';

            editBtn.onclick = () => {
              window.location.href = 'profile.html?edit=true';
            };
          }
        }
      }
    });
  }
}
// ... (existing code)

// SOS Button Logic moved to sos.js
