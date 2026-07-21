// Phase 3: Progress Tracking Page Logic
import {
  initializeFirebase,
  getCurrentUser,
  getUserProfile
} from './auth.js';

let currentUser = null;
let userProfile = null;
let weightChart = null;

// Initialize Phase 3 when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  await initializeFirebase();
  setupPhase3Listeners();
  loadProgressData();
});

// Setup event listeners for Phase 3
function setupPhase3Listeners() {
  // Weight form submission
  const weightForm = document.getElementById('weight-form');
  if (weightForm) {
    weightForm.addEventListener('submit', handleLogWeight);
  }

  // Workout form submission
  const workoutForm = document.getElementById('workout-form');
  if (workoutForm) {
    workoutForm.addEventListener('submit', handleLogWorkout);
  }

  // Set today's date as default
  const weightDate = document.getElementById('weight-date');
  const workoutDate = document.getElementById('workout-date');
  const today = new Date().toISOString().split('T')[0];
  if (weightDate) weightDate.value = today;
  if (workoutDate) workoutDate.value = today;
}

// Load progress data
async function loadProgressData() {
  currentUser = await getCurrentUser();
  if (!currentUser) {
    console.log('No user logged in');
    return;
  }

  const profileResult = await getUserProfile(currentUser.uid);
  if (profileResult.success) {
    userProfile = profileResult.data;
  }

  // Load weight entries
  loadWeightProgress();
  // Load workout entries
  loadWorkoutHistory();
}

// Handle log weight
async function handleLogWeight(e) {
  e.preventDefault();

  const weight = parseFloat(document.getElementById('log-weight').value);
  const date = document.getElementById('weight-date').value;

  if (!weight || !date) {
    showPhase3Error('Please fill in all weight fields');
    return;
  }

  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');

    const db = getFirestore();
    const user = await getCurrentUser();

    await setDoc(doc(db, 'users', user.uid, 'weightLogs', `${date}-${Date.now()}`), {
      weight,
      date,
      timestamp: new Date(),
      unit: 'lbs'
    });

    showPhase3Success('Weight logged successfully!');
    document.getElementById('weight-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('weight-date').value = today;
    
    // Reload progress
    loadProgressData();
  } catch (error) {
    console.error('Error logging weight:', error);
    showPhase3Error('Failed to log weight');
  }
}

// Handle log workout
async function handleLogWorkout(e) {
  e.preventDefault();

  const name = document.getElementById('workout-name').value;
  const duration = parseInt(document.getElementById('workout-duration').value);
  const date = document.getElementById('workout-date').value;

  if (!name || !duration || !date) {
    showPhase3Error('Please fill in all workout fields');
    return;
  }

  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');

    const db = getFirestore();
    const user = await getCurrentUser();

    await setDoc(doc(db, 'users', user.uid, 'workoutLogs', `${date}-${Date.now()}`), {
      name,
      duration,
      date,
      timestamp: new Date(),
      completed: true
    });

    showPhase3Success('Workout logged successfully!');
    document.getElementById('workout-form').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('workout-date').value = today;
    
    // Reload progress
    loadProgressData();
  } catch (error) {
    console.error('Error logging workout:', error);
    showPhase3Error('Failed to log workout');
  }
}

// Load weight progress
async function loadWeightProgress() {
  try {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');

    const db = getFirestore();

    const weightSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'weightLogs'));
    const weights = [];

    weightSnapshot.forEach(doc => {
      weights.push({
        date: doc.data().date,
        weight: doc.data().weight,
        timestamp: doc.data().timestamp
      });
    });

    // Sort by date
    weights.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Update stats
    if (weights.length > 0) {
      const currentWeight = weights[weights.length - 1].weight;
      const startWeight = userProfile?.weight || weights[0].weight;
      const weightChange = (currentWeight - startWeight).toFixed(1);

      document.getElementById('current-weight').textContent = currentWeight.toFixed(1);
      document.getElementById('weight-change').textContent = weightChange > 0 ? `+${weightChange}` : weightChange;

      // Update chart
      updateWeightChart(weights);

      // Update activity
      updateRecentActivity(weights, 'weight');
    }
  } catch (error) {
    console.error('Error loading weight progress:', error);
  }
}

// Load workout history
async function loadWorkoutHistory() {
  try {
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');

    const db = getFirestore();

    const workoutSnapshot = await getDocs(collection(db, 'users', currentUser.uid, 'workoutLogs'));
    const workouts = [];

    workoutSnapshot.forEach(doc => {
      workouts.push({
        name: doc.data().name,
        duration: doc.data().duration,
        date: doc.data().date,
        timestamp: doc.data().timestamp,
        completed: doc.data().completed
      });
    });

    // Sort by date (newest first)
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update total workouts
    document.getElementById('total-workouts').textContent = workouts.length;

    // Update consistency score (workouts this week)
    const consistency = calculateConsistency(workouts);
    document.getElementById('consistency-score').textContent = `${consistency}%`;

    // Update workout history display
    displayWorkoutHistory(workouts);

    // Update activity
    updateRecentActivity(workouts, 'workout');
  } catch (error) {
    console.error('Error loading workout history:', error);
  }
}

// Calculate consistency score
function calculateConsistency(workouts) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const thisWeek = workouts.filter(w => new Date(w.date) >= weekAgo);
  
  // Target: 5 workouts per week, show percentage
  const percentage = Math.min(100, Math.round((thisWeek.length / 5) * 100));
  return percentage;
}

// Display workout history
function displayWorkoutHistory(workouts) {
  const container = document.getElementById('workout-history');
  if (!container) return;

  if (workouts.length === 0) {
    container.innerHTML = '<p style="color: var(--gray-600); font-style: italic;">No workouts logged yet. Start tracking to see your progress!</p>';
    return;
  }

  let html = '';
  workouts.slice(0, 10).forEach(workout => {
    const dateObj = new Date(workout.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    html += `
      <div class="workout-item">
        <div class="workout-item-info">
          <h4>${workout.name}</h4>
          <p>${dateStr}</p>
        </div>
        <div class="workout-item-duration">
          ${workout.duration} min
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Update weight chart
function updateWeightChart(weights) {
  const ctx = document.getElementById('weight-chart');
  if (!ctx) return;

  const labels = weights.map(w => {
    const date = new Date(w.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const data = weights.map(w => w.weight);

  // Destroy existing chart if it exists
  if (weightChart) {
    weightChart.destroy();
  }

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Weight (lbs)',
        data: data,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: function(value) {
              return value + ' lbs';
            }
          }
        }
      }
    }
  });
}

// Update recent activity
function updateRecentActivity(data, type) {
  const container = document.getElementById('recent-activity');
  if (!container) return;

  // Combine all activities
  let activities = [];

  if (type === 'weight') {
    activities = data.map(item => ({
      type: 'weight',
      text: `Weight: ${item.weight} lbs`,
      date: item.date,
      timestamp: item.timestamp
    }));
  } else if (type === 'workout') {
    activities = data.map(item => ({
      type: 'workout',
      text: `${item.name} (${item.duration} min)`,
      date: item.date,
      timestamp: item.timestamp
    }));
  }

  // Sort by date (newest first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (activities.length === 0) {
    container.innerHTML = '<p style="color: var(--gray-600); font-style: italic;">No activity yet. Start logging to see your progress here!</p>';
    return;
  }

  let html = '';
  activities.slice(0, 15).forEach(activity => {
    const dateObj = new Date(activity.date);
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    html += `
      <div class="activity-item">
        <div class="activity-date">${dateStr}</div>
        <div class="activity-text">${activity.text}</div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Show Error Message
function showPhase3Error(message) {
  console.error('Phase 3 Error:', message);
  alert('Error: ' + message);
}

// Show Success Message
function showPhase3Success(message) {
  console.log('Phase 3 Success:', message);
  alert('✓ ' + message);
}

// Export for global use
window.handleLogWeight = handleLogWeight;
window.handleLogWorkout = handleLogWorkout;
