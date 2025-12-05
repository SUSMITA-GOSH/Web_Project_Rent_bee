import { auth, db } from './firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Create and append Complaint button
const complaintButton = document.createElement('button');
complaintButton.id = 'complaintButton';
complaintButton.innerHTML = '⚠️';
complaintButton.title = 'File a Complaint';
complaintButton.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #ffc107;
    color: #000;
    border: none;
    font-weight: bold;
    font-size: 24px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    z-index: 9999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
    transition: transform 0.2s;
`;

complaintButton.addEventListener('mouseenter', () => {
    complaintButton.style.transform = 'scale(1.1)';
});

complaintButton.addEventListener('mouseleave', () => {
    complaintButton.style.transform = 'scale(1)';
});

document.body.appendChild(complaintButton);

// Create modal for complaint form
const modalHTML = `
<div id="complaintModal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
    <div style="background-color: white; margin: 5% auto; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #333;">File a Complaint</h2>
            <button id="closeComplaintModal" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
        </div>
        
        <form id="complaintForm">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Category</label>
                <select id="complaintCategory" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
                    <option value="">Select a category</option>
                    <option value="payment">Payment Issue</option>
                    <option value="quality">Work Quality</option>
                    <option value="behavior">Unprofessional Behavior</option>
                    <option value="safety">Safety Concern</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Subject</label>
                <input type="text" id="complaintSubject" required placeholder="Brief description" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #555;">Details</label>
                <textarea id="complaintDetails" required rows="5" placeholder="Describe your complaint in detail..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; resize: vertical;"></textarea>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" id="cancelComplaint" style="padding: 10px 20px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">Cancel</button>
                <button type="submit" style="padding: 10px 20px; background-color: #ffc107; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 14px;">Submit Complaint</button>
            </div>
        </form>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', modalHTML);

const modal = document.getElementById('complaintModal');
const closeBtn = document.getElementById('closeComplaintModal');
const cancelBtn = document.getElementById('cancelComplaint');
const form = document.getElementById('complaintForm');

// Open modal
complaintButton.addEventListener('click', () => {
    modal.style.display = 'block';
});

// Close modal
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    form.reset();
});

cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    form.reset();
});

// Close on outside click
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        form.reset();
    }
});

// Submit complaint
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert('Please log in to file a complaint.');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Determine user type
        let userType = 'unknown';
        if (window.location.pathname.includes('provider')) userType = 'provider';
        if (window.location.pathname.includes('client')) userType = 'client';

        const complaintData = {
            userId: user.uid,
            userType: userType,
            category: document.getElementById('complaintCategory').value,
            subject: document.getElementById('complaintSubject').value,
            details: document.getElementById('complaintDetails').value,
            status: 'pending',
            createdAt: new Date(),
            resolvedAt: null
        };

        await addDoc(collection(db, 'complaints'), complaintData);

        alert('Complaint submitted successfully! Admin will review it soon.');
        modal.style.display = 'none';
        form.reset();
    } catch (error) {
        console.error('Error submitting complaint:', error);
        alert('Failed to submit complaint: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Complaint';
    }
});
