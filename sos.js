import { auth, db } from './firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// We need to initialize the app/database here if not already available, 
// but since we import auth from firebase.js, we can assume firebase.js initializes the app.
// However, we need the 'database' instance. 
// Let's import 'app' from firebase.js to be sure we use the same instance.


// Create and append SOS button
const sosButton = document.createElement('button');
sosButton.id = 'sosButton';
sosButton.innerHTML = 'SOS';
sosButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #dc3545;
    color: white;
    border: none;
    font-weight: bold;
    font-size: 18px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 9999;
    cursor: pointer;
    animation: pulse 2s infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
`;

// Add pulse animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
    }
`;
document.head.appendChild(styleSheet);
document.body.appendChild(sosButton);

// Send SOS Function
window.sendSOS = () => {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    const user = auth.currentUser;
    const userId = user ? user.uid : 'anonymous';

    let userType = 'unknown';
    if (window.location.pathname.includes('provider')) userType = 'provider';
    if (window.location.pathname.includes('client')) userType = 'client';

    sosButton.disabled = true;
    sosButton.textContent = '...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;

            const alertData = {
                userId: userId,
                userType: userType,
                time: new Date().toISOString(),
                lat: latitude,
                lng: longitude,
                status: 'active',
                createdAt: new Date()
            };

            try {
                await addDoc(collection(db, 'sos_alerts'), alertData);
                alert('SOS Alert Sent! Help is on the way.');
            } catch (error) {
                console.error('Error sending SOS:', error);
                alert('Failed to send SOS: ' + error.message);
            } finally {
                sosButton.textContent = 'SOS';
                sosButton.disabled = false;
            }
        },
        (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. SOS not sent.');
            sosButton.textContent = 'SOS';
            sosButton.disabled = false;
        }
    );
};

sosButton.addEventListener('click', window.sendSOS);
