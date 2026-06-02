// Phase 2: Meal Plans & Workouts Page Logic
import {
  initializeGenerators,
  calculateCalories,
  calculateMacros,
  generateMealPlan,
  generateWorkoutPlan,
  saveMealPlan,
  saveWorkoutPlan
} from './generators.js';

import { getCurrentUser, getUserProfile } from './auth.js';

let currentUser = null;
let userProfile = null;

// Initialize Phase 2 when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
  await initializeGenerators();
  setupPhase2Listeners();
});

// Setup event listeners for Phase 2
function setupPhase2Listeners() {
  // Generate meal plan button
  const generateMealBtn = document.getElementById('generate-meal-plan');
  if (generateMealBtn) {
    generateMealBtn.addEventListener('click', handleGenerateMealPlan);
  }

  // Generate workout plan button
  const generateWorkoutBtn = document.getElementById('generate-workout-plan');
  if (generateWorkoutBtn) {
    generateWorkoutBtn.addEventListener('click', handleGenerateWorkoutPlan);
  }
}

// Handle generate meal plan
async function handleGenerateMealPlan() {
  currentUser = await getCurrentUser();
  if (!currentUser) {
    showPhase2Error('meals', 'Please log in first');
    return;
  }

  const profileResult = await getUserProfile(currentUser.uid);
  if (!profileResult.success) {
    showPhase2Error('meals', 'Please complete your profile first');
    return;
  }

  const profile = profileResult.data;
  
  // Calculate nutrition
  const calories = calculateCalories(profile.age, profile.weight, profile.height, profile.gender, profile.activityLevel);
  const macros = calculateMacros(calories);
  const mealPlan = generateMealPlan(profile.dietaryPreference, 7);

  // Display meal plan
  displayMealPlan(mealPlan, calories, macros, profile);

  // Store for saving
  window.pendingMealPlan = { mealPlan, calories, macros };
}

// Handle generate workout plan
async function handleGenerateWorkoutPlan() {
  currentUser = await getCurrentUser();
  if (!currentUser) {
    showPhase2Error('workouts', 'Please log in first');
    return;
  }

  const profileResult = await getUserProfile(currentUser.uid);
  if (!profileResult.success) {
    showPhase2Error('workouts', 'Please complete your profile first');
    return;
  }

  const profile = profileResult.data;
  const workoutPlan = generateWorkoutPlan(profile.fitnessGoal, 7);

  // Display workout plan
  displayWorkoutPlan(workoutPlan);

  // Store for saving
  window.pendingWorkoutPlan = { workoutPlan, profile };
}

// Handle save meal plan
async function handleSaveMealPlan() {
  if (!window.pendingMealPlan) {
    showPhase2Error('meals', 'Generate a meal plan first');
    return;
  }

  currentUser = await getCurrentUser();
  if (!currentUser) {
    showPhase2Error('meals', 'Please log in first');
    return;
  }

  const result = await saveMealPlan(
    currentUser.uid,
    window.pendingMealPlan.mealPlan,
    window.pendingMealPlan.calories,
    window.pendingMealPlan.macros
  );
  
  if (result.success) {
    showPhase2Success('meals', 'Meal plan saved successfully!');
  } else {
    showPhase2Error('meals', 'Failed to save meal plan');
  }
}

// Handle save workout plan
async function handleSaveWorkoutPlan() {
  if (!window.pendingWorkoutPlan) {
    showPhase2Error('workouts', 'Generate a workout plan first');
    return;
  }

  currentUser = await getCurrentUser();
  if (!currentUser) {
    showPhase2Error('workouts', 'Please log in first');
    return;
  }

  const result = await saveWorkoutPlan(
    currentUser.uid,
    window.pendingWorkoutPlan.workoutPlan
  );
  
  if (result.success) {
    showPhase2Success('workouts', 'Workout plan saved successfully!');
  } else {
    showPhase2Error('workouts', 'Failed to save workout plan');
  }
}

// Display meal plan
function displayMealPlan(mealPlan, calories, macros, profile) {
  const mealsContent = document.getElementById('meals-content');
  if (!mealsContent) return;

  let html = `
    <div class="card">
      <h3>Your Personalized 7-Day Meal Plan</h3>
      <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.75rem; color: var(--primary);">Daily Nutrition Goals</h4>
        <p style="margin: 0.5rem 0;"><strong>Calories:</strong> ${calories} kcal</p>
        <p style="margin: 0.5rem 0;"><strong>Protein:</strong> ${macros.protein}g</p>
        <p style="margin: 0.5rem 0;"><strong>Carbohydrates:</strong> ${macros.carbs}g</p>
        <p style="margin: 0.5rem 0;"><strong>Fat:</strong> ${macros.fat}g</p>
      </div>
  `;

  mealPlan.forEach((day, index) => {
    html += `
      <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; background: white;">
        <h4 style="color: var(--primary); margin-bottom: 0.75rem;">Day ${index + 1}</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>🌅 Breakfast</strong></p>
            <p style="margin: 0.25rem 0;">${day.breakfast.name}</p>
            <p style="font-size: 0.75rem; color: var(--gray-500);">${day.breakfast.calories} cal</p>
          </div>
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>🥗 Lunch</strong></p>
            <p style="margin: 0.25rem 0;">${day.lunch.name}</p>
            <p style="font-size: 0.75rem; color: var(--gray-500);">${day.lunch.calories} cal</p>
          </div>
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>🍽️ Dinner</strong></p>
            <p style="margin: 0.25rem 0;">${day.dinner.name}</p>
            <p style="font-size: 0.75rem; color: var(--gray-500);">${day.dinner.calories} cal</p>
          </div>
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>🍎 Snack</strong></p>
            <p style="margin: 0.25rem 0;">${day.snack.name}</p>
            <p style="font-size: 0.75rem; color: var(--gray-500);">${day.snack.calories} cal</p>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    <button class="btn btn-primary" id="save-meal-plan" onclick="window.handleSaveMealPlan()">Save This Meal Plan</button>
  `;

  mealsContent.innerHTML = html;
}

// Display workout plan
function displayWorkoutPlan(workoutPlan) {
  const workoutsContent = document.getElementById('workouts-content');
  if (!workoutsContent) return;

  let html = `
    <div class="card">
      <h3>Your Personalized 7-Day Workout Plan</h3>
  `;

  workoutPlan.forEach((workout, index) => {
    const duration = workout.duration ? `${workout.duration} min` : `${workout.sets}×${workout.reps}`;
    const intensity = workout.intensity ? workout.intensity.charAt(0).toUpperCase() + workout.intensity.slice(1) : 'Moderate';
    
    html += `
      <div style="margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; background: white;">
        <h4 style="color: var(--primary); margin-bottom: 0.75rem;">Day ${index + 1} - ${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>Exercise</strong></p>
            <p style="margin: 0.25rem 0;">${workout.name}</p>
          </div>
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>Duration/Sets</strong></p>
            <p style="margin: 0.25rem 0;">${duration}</p>
          </div>
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>Intensity</strong></p>
            <p style="margin: 0.25rem 0;">${intensity}</p>
          </div>
          <div>
            <p style="font-size: 0.875rem; color: var(--gray-600);"><strong>Rest</strong></p>
            <p style="margin: 0.25rem 0;">${workout.rest || 'As needed'} sec</p>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    <button class="btn btn-primary" id="save-workout-plan" onclick="window.handleSaveWorkoutPlan()">Save This Workout Plan</button>
  `;

  workoutsContent.innerHTML = html;
}

// Show Error Message
function showPhase2Error(pageId, message) {
  const content = document.getElementById(`${pageId}-content`);
  if (!content) return;

  let errorDiv = content.querySelector('.error');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    content.insertBefore(errorDiv, content.firstChild);
  }

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Show Success Message
function showPhase2Success(pageId, message) {
  const content = document.getElementById(`${pageId}-content`);
  if (!content) return;

  let successDiv = content.querySelector('.success');
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'success';
    content.insertBefore(successDiv, content.firstChild);
  }

  successDiv.textContent = message;
  successDiv.style.display = 'block';
}

// Export for global use
window.handleGenerateMealPlan = handleGenerateMealPlan;
window.handleGenerateWorkoutPlan = handleGenerateWorkoutPlan;
window.handleSaveMealPlan = handleSaveMealPlan;
window.handleSaveWorkoutPlan = handleSaveWorkoutPlan;
