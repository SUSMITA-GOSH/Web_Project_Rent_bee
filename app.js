import { auth, db } from './firebase.js';
import {
  doc, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const accountTypeSelect = document.getElementById('accountType');
const serviceField = document.getElementById('producerFields');
const profileForm = document.getElementById('profileForm');
const profileImageInput = document.getElementById('profileImage');

accountTypeSelect.addEventListener('change', e => {
  serviceField.style.display = e.target.value === 'producer' ? 'block' : 'none';
});

async function uploadProfileImage(file, userId) {
  const storage = getStorage();
  const storageRef = ref(storage, `profile_images/${userId}/${file.name}_${Date.now()}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', null, reject, async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      resolve(downloadURL);
    });
  });
}

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert('Please log in to save your profile.');
    return;
  }

  const name = document.getElementById('name').value.trim();
  const accountType = accountTypeSelect.value;
  const services = document.getElementById('services').value.trim();
  const portfolio = document.getElementById('portfolio').value.trim();
  const whatsapp = document.getElementById('whatsapp').value.trim();
  const gmail = document.getElementById('gmail').value.trim();
  const github = document.getElementById('github').value.trim();
  const hourlyRate = parseFloat(document.getElementById('hourlyRate')?.value) || 0;
  const dailyRate = parseFloat(document.getElementById('dailyRate')?.value) || 0;

  if (!name) {
    alert('Name is required.');
    return;
  }

  const profileData = {
    name,
    type: accountType
  };

  if (accountType === 'producer') {
    profileData.services = services ? services.toLowerCase().split(',').map(s => s.trim()) : [];
    profileData.portfolio = portfolio;
    profileData.whatsapp = whatsapp;
    profileData.gmail = gmail;
    profileData.github = github;
    profileData.hourlyRate = hourlyRate;
    profileData.dailyRate = dailyRate;

    if (profileImageInput.files.length > 0) {
      try {
        const imageUrl = await uploadProfileImage(profileImageInput.files[0], user.uid);
        profileData.profileImageURL = imageUrl;
      } catch (err) {
        alert('Profile image upload failed: ' + err.message);
        return;
      }
    }
  }

  try {
    await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
    alert('Profile saved successfully!');
  } catch (error) {
    alert('Error saving profile: ' + error.message);
  }
});

// Pre-fill form data with image and payment rates for logged-in users
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('name').value = data.name || '';
      accountTypeSelect.value = data.type || '';
      serviceField.style.display = data.type === 'producer' ? 'block' : 'none';
      document.getElementById('services').value = data.services ? data.services.join(', ') : '';
      document.getElementById('portfolio').value = data.portfolio || '';
      document.getElementById('whatsapp').value = data.whatsapp || '';
      document.getElementById('gmail').value = data.gmail || '';
      document.getElementById('github').value = data.github || '';
      document.getElementById('hourlyRate').value = data.hourlyRate || '';
      document.getElementById('dailyRate').value = data.dailyRate || '';
      // Show existing profile image preview if needed (optional)
    }
  }
});
