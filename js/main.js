// Nutrift Main App Logic
import { 
  initializeFirebase,
  signUp, 
  signIn, 
  signOut, 
  resetPassword,
  saveUserProfile,
  getCurrentUser,
  getUserProfile
} from './auth.js';

let currentUser = null;

// Initialize app on load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeFirebase();
  checkAuthStatus();
  setupEventListeners();
});

// Check if user is logged in
async function checkAuthStatus() {
  currentUser = await getCurrentUser();
  
  if (currentUser) {
    showPage('dashboard');
    updateNavigation(true);
    loadUserProfile();
  } else {
    showPage('landing');
    updateNavigation(false);
  }
}

// Update navigation based on auth status
function updateNavigation(isLoggedIn) {
  const navLinks = document.getElementById('nav-links');
  const navUser = document.getElementById('nav-user');
  
  if (isLoggedIn) {
    navLinks.innerHTML = `
      <a onclick="window.showPage('dashboard')">Dashboard</a>
      <a onclick="window.showPage('onboarding')">Profile</a>
      <a onclick="window.showPage('meals')">Meals</a>
      <a onclick="window.showPage('workouts')">Workouts</a>
      <a onclick="window.showPage('progress')">Progress</a>
    `;
    navUser.innerHTML = `
      <span style="font-size: 0.875rem; color: var(--gray-600);">${currentUser.email}</span>
      <button class="btn-logout" onclick="window.logout()">Logout</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a onclick="window.showPage('landing')">Home</a>
    `;
    navUser.innerHTML = `
      <button class="btn btn-primary" onclick="window.showPage('login')">Login</button>
      <button class="btn btn-secondary" onclick="window.showPage('signup')">Sign Up</button>
    `;
  }
}

// Show/Hide Pages
function showPage(pageName) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  
  const page = document.getElementById(pageName);
  if (page) {
    page.classList.add('active');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignUp);
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', handleForgotPassword);
  }

  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
  }
}

// Handle Sign Up
async function handleSignUp(e) {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;

  if (password !== confirmPassword) {
    showError('signup', 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showError('signup', 'Password must be at least 6 characters');
    return;
  }

  const result = await signUp(email, password);
  
  if (result.success) {
    currentUser = { uid: result.uid, email };
    showSuccess('signup', 'Sign up successful! Setting up your profile...');
    setTimeout(() => window.showPage('onboarding'), 1500);
  } else {
    showError('signup', result.error);
  }
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const result = await signIn(email, password);
  
  if (result.success) {
    currentUser = await getCurrentUser();
    showSuccess('login', 'Login successful!');
    setTimeout(() => checkAuthStatus(), 1500);
  } else {
    showError('login', result.error);
  }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
  e.preventDefault();
  
  const email = document.getElementById('forgot-email').value;

  const result = await resetPassword(email);
  
  if (result.success) {
    showSuccess('forgot', 'Password reset email sent! Check your inbox.');
    setTimeout(() => window.showPage('login'), 2000);
  } else {
    showError('forgot', result.error);
  }
}

// Handle Profile Submit
async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const profileData = {
    age: parseInt(document.getElementById('age').value),
    weight: parseFloat(document.getElementById('weight').value),
    height: parseFloat(document.getElementById('height').value),
    gender: document.getElementById('gender').value,
    activityLevel: document.getElementById('activity-level').value,
    fitnessGoal: document.getElementById('fitness-goal').value,
    dietaryPreference: document.getElementById('dietary-preference').value,
    email: currentUser.email
  };

  const result = await saveUserProfile(currentUser.uid, profileData);
  
  if (result.success) {
    showSuccess('profile', 'Profile saved successfully!');
    setTimeout(() => window.showPage('dashboard'), 1500);
  } else {
    showError('profile', result.error);
  }
}

// Logout
async function logout() {
  await signOut();
  currentUser = null;
  checkAuthStatus();
}

// Load User Profile
async function loadUserProfile() {
  if (!currentUser) return;
  
  const result = await getUserProfile(currentUser.uid);
  
  if (result.success) {
    const profile = result.data;
    const dashboardContent = document.getElementById('dashboard-content');
    
    if (dashboardContent) {
      dashboardContent.innerHTML = `
        <div class="card">
          <h2>Welcome, ${profile.email}!</h2>
          <div style="margin: 1rem 0;">
            <p><strong>Age:</strong> ${profile.age || 'Not set'}</p>
            <p><strong>Weight:</strong> ${profile.weight || 'Not set'} lbs</p>
            <p><strong>Height:</strong> ${profile.height || 'Not set'} inches</p>
            <p><strong>Gender:</strong> ${profile.gender || 'Not set'}</p>
            <p><strong>Fitness Goal:</strong> ${profile.fitnessGoal || 'Not set'}</p>
            <p><strong>Activity Level:</strong> ${profile.activityLevel || 'Not set'}</p>
            <p><strong>Dietary Preference:</strong> ${profile.dietaryPreference || 'Not set'}</p>
          </div>
          <button class="btn btn-primary" onclick="window.showPage('onboarding')">Edit Profile</button>
        </div>
      `;
    }
  }
}

// Show Error Message
function showError(formId, message) {
  const form = document.getElementById(formId);
  if (!form) return;

  let errorDiv = form.querySelector('.error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    form.insertBefore(errorDiv, form.firstChild);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Show Success Message
function showSuccess(formId, message) {
  const form = document.getElementById(formId);
  if (!form) return;

  let successDiv = form.querySelector('.success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'success';
    form.insertBefore(successDiv, form.firstChild);
  }

  successDiv.textContent = message;
  successDiv.style.display = 'block';
}

// Export functions for global use
window.showPage = showPage;
window.logout = logout;
