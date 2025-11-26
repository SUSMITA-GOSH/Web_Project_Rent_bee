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
const loginLink = document.getElementById('loginLink');
const profileLink = document.getElementById('profileLink');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');

// Auth State Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (loginLink) loginLink.style.display = 'none';
    if (profileLink) profileLink.style.display = 'inline-block';
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block';
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
        if (accountTypeSelect && userRole) {
          accountTypeSelect.value = userRole;
          serviceField.style.display = (userRole === 'provider' || userRole === 'producer') ? 'block' : 'none';

          // Hide the selector if role is already set to prevent changing it
          // accountTypeSelect.disabled = true; // Optional: disable instead of hide
          // Or hide the parent label to make it cleaner
          accountTypeSelect.parentElement.style.display = 'none';
        }
        if (document.getElementById('services')) document.getElementById('services').value = data.services ? data.services.join(', ') : '';
        if (document.getElementById('portfolio')) document.getElementById('portfolio').value = data.portfolio || '';
        if (document.getElementById('whatsapp')) document.getElementById('whatsapp').value = data.whatsapp || '';
        if (document.getElementById('gmail')) document.getElementById('gmail').value = data.gmail || data.email || user.email || '';
        if (document.getElementById('facebook')) document.getElementById('facebook').value = data.facebook || '';
        if (document.getElementById('twitter')) document.getElementById('twitter').value = data.twitter || '';
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
    if (loginLink) loginLink.style.display = 'inline-block';
    if (profileLink) profileLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
});

// Profile Form Handling
if (accountTypeSelect) {
  accountTypeSelect.addEventListener('change', e => {
    serviceField.style.display = e.target.value === 'provider' ? 'block' : 'none';
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
    // Get type from select, or if hidden/disabled, try to find it from existing data or hidden input
    // Since we might hide the select, we should ensure we still capture the value.
    // The value of a hidden select might still be readable.
    let accountType = accountTypeSelect.value;

    // If accountType is empty (e.g. if we hid it and didn't set it properly, though we did set it above),
    // we should rely on what was loaded. But for safety, let's assume the value is there.

    const services = document.getElementById('services').value.trim();
    const portfolio = document.getElementById('portfolio').value.trim();
    const whatsapp = document.getElementById('whatsapp').value.trim();
    const gmail = document.getElementById('gmail').value.trim();
    const facebook = document.getElementById('facebook').value.trim();
    const github = document.getElementById('github').value.trim();
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
      twitter: document.getElementById('twitter').value.trim()
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

    try {
      saveBtn.textContent = 'Saving Data...'; // Progress update
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      alert('Profile saved successfully!');
      window.location.reload(); // Reload to switch to read-only mode
    } catch (error) {
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
  const div = document.createElement('div');
  div.className = 'provider-card';
  const imgUrl = data.profileImageURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  div.innerHTML = `
        <div class="provider-header">
            <img src="${imgUrl}" alt="${data.name}" class="provider-img">
            <div class="provider-info">
                <h3>${data.name}</h3>
                <div class="badges">
                    <span class="badge verified">Verified</span>
                    <span class="badge">4.8 ★</span>
                </div>
            </div>
        </div>
        <div class="provider-stats">
            <span>Rate: $${data.hourlyRate || 0}/hr</span>
            <span>Jobs: 12</span>
        </div>
        <p>${data.services ? data.services.slice(0, 3).join(', ') : ''}</p>
        <button class="book-btn" onclick="window.location.href='booking.html?providerId=${id}'">Book Now</button>
    `;
  return div;
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

        // Services
        const serviceList = document.getElementById('serviceList');
        if (data.services) {
          data.services.forEach(s => {
            const li = document.createElement('li');
            li.textContent = `• ${s}`;
            serviceList.appendChild(li);
          });
        }

        // Socials
        // Socials
        const socialLinks = document.getElementById('socialLinks');
        socialLinks.innerHTML = ''; // Clear previous

        if (data.whatsapp) {
          socialLinks.innerHTML += `
                <a href="https://wa.me/${data.whatsapp}" target="_blank" title="WhatsApp">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-circle" style="color: #25D366;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                </a>`;
        }
        if (data.gmail) {
          socialLinks.innerHTML += `
                <a href="mailto:${data.gmail}" title="Email">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-mail" style="color: #EA4335;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </a>`;
        }
        if (data.facebook) {
          socialLinks.innerHTML += `
                <a href="${data.facebook}" target="_blank" title="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-facebook" style="color: #1877F2;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>`;
        }
        if (data.twitter) {
          socialLinks.innerHTML += `
                <a href="${data.twitter}" target="_blank" title="Twitter/X">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-twitter" style="color: #1DA1F2;"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </a>`;
        }
        if (data.github) {
          socialLinks.innerHTML += `
                <a href="${data.github}" target="_blank" title="GitHub">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-github" style="color: #333;"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>`;
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
