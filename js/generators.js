// Meal Plan & Workout Generator Logic
import { initializeFirebase, getCurrentUser } from './auth.js';

let db;

export async function initializeGenerators() {
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
  await initializeFirebase();
  db = getFirestore();
}

// Calculate daily caloric needs (Harris-Benedict formula)
export function calculateCalories(age, weight, height, gender, activityLevel) {
  let bmr;
  
  if (gender === 'Male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  const activityMultiplier = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9
  };
  
  const tdee = bmr * (activityMultiplier[activityLevel] || 1.55);
  
  // Adjust for fitness goal
  const goalAdjustment = {
    'weight loss': -500,
    'muscle gain': 300,
    'maintenance': 0
  };
  
  return Math.round(tdee + (goalAdjustment['weight loss'] || 0));
}

// Calculate macros (40% carbs, 30% protein, 30% fat)
export function calculateMacros(calories) {
  return {
    protein: Math.round((calories * 0.30) / 4), // 4 cal per gram
    carbs: Math.round((calories * 0.40) / 4),   // 4 cal per gram
    fat: Math.round((calories * 0.30) / 9)      // 9 cal per gram
  };
}

// Meal database
const mealDatabase = {
  'breakfast': [
    { name: 'Oatmeal with berries', calories: 350, protein: 10, carbs: 60, fat: 5 },
    { name: 'Greek yogurt with granola', calories: 320, protein: 20, carbs: 40, fat: 8 },
    { name: 'Scrambled eggs & toast', calories: 380, protein: 18, carbs: 35, fat: 15 },
    { name: 'Protein smoothie', calories: 300, protein: 25, carbs: 35, fat: 5 },
    { name: 'Pancakes with fruit', calories: 420, protein: 12, carbs: 70, fat: 10 }
  ],
  'lunch': [
    { name: 'Grilled chicken & rice', calories: 550, protein: 45, carbs: 60, fat: 8 },
    { name: 'Turkey sandwich', calories: 480, protein: 35, carbs: 50, fat: 12 },
    { name: 'Tuna salad', calories: 420, protein: 40, carbs: 30, fat: 15 },
    { name: 'Salmon & vegetables', calories: 520, protein: 50, carbs: 35, fat: 18 },
    { name: 'Chickpea pasta', calories: 480, protein: 20, carbs: 65, fat: 10 }
  ],
  'dinner': [
    { name: 'Lean beef & potatoes', calories: 620, protein: 50, carbs: 55, fat: 15 },
    { name: 'Baked chicken & broccoli', calories: 480, protein: 55, carbs: 35, fat: 10 },
    { name: 'Fish & sweet potato', calories: 520, protein: 45, carbs: 50, fat: 12 },
    { name: 'Pork chops & vegetables', calories: 550, protein: 48, carbs: 40, fat: 18 },
    { name: 'Lentil curry', calories: 520, protein: 18, carbs: 75, fat: 12 }
  ],
  'snack': [
    { name: 'Protein bar', calories: 200, protein: 20, carbs: 20, fat: 6 },
    { name: 'Apple with almond butter', calories: 250, protein: 8, carbs: 30, fat: 12 },
    { name: 'Greek yogurt', calories: 150, protein: 15, carbs: 12, fat: 4 },
    { name: 'Nuts & dried fruit', calories: 220, protein: 7, carbs: 25, fat: 12 },
    { name: 'Protein shake', calories: 180, protein: 25, carbs: 10, fat: 3 }
  ]
};

// Workout database
const workoutDatabase = {
  'strength': [
    { name: 'Push-ups', sets: 3, reps: 12, rest: 60, difficulty: 'beginner' },
    { name: 'Squats', sets: 4, reps: 10, rest: 90, difficulty: 'beginner' },
    { name: 'Bench press', sets: 4, reps: 8, rest: 120, difficulty: 'intermediate' },
    { name: 'Deadlifts', sets: 3, reps: 5, rest: 120, difficulty: 'intermediate' },
    { name: 'Pull-ups', sets: 3, reps: 8, rest: 90, difficulty: 'advanced' }
  ],
  'cardio': [
    { name: 'Running (30 min)', duration: 30, intensity: 'moderate', difficulty: 'beginner' },
    { name: 'Cycling (45 min)', duration: 45, intensity: 'moderate', difficulty: 'beginner' },
    { name: 'HIIT (20 min)', duration: 20, intensity: 'high', difficulty: 'intermediate' },
    { name: 'Swimming (40 min)', duration: 40, intensity: 'moderate', difficulty: 'beginner' },
    { name: 'Jump rope (15 min)', duration: 15, intensity: 'high', difficulty: 'intermediate' }
  ],
  'flexibility': [
    { name: 'Yoga (30 min)', duration: 30, intensity: 'low', difficulty: 'beginner' },
    { name: 'Stretching (15 min)', duration: 15, intensity: 'low', difficulty: 'beginner' },
    { name: 'Pilates (45 min)', duration: 45, intensity: 'moderate', difficulty: 'intermediate' },
    { name: 'Tai Chi (30 min)', duration: 30, intensity: 'low', difficulty: 'beginner' }
  ]
};

// Generate personalized meal plan
export function generateMealPlan(dietaryPref, daysCount = 7) {
  const plan = [];
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  for (let day = 1; day <= daysCount; day++) {
    const dayPlan = {};
    meals.forEach(meal => {
      const mealOptions = mealDatabase[meal] || [];
      dayPlan[meal] = mealOptions[Math.floor(Math.random() * mealOptions.length)];
    });
    plan.push(dayPlan);
  }
  
  return plan;
}

// Generate personalized workout plan
export function generateWorkoutPlan(fitnessGoal, daysCount = 7) {
  const types = Object.keys(workoutDatabase);
  const plan = [];
  
  for (let day = 1; day <= daysCount; day++) {
    const workoutType = types[Math.floor(Math.random() * types.length)];
    const workouts = workoutDatabase[workoutType] || [];
    const workout = workouts[Math.floor(Math.random() * workouts.length)];
    plan.push({ day, type: workoutType, ...workout });
  }
  
  return plan;
}

// Save meal plan to Firestore
export async function saveMealPlan(userId, mealPlan, calories, macros) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId, 'mealPlans', new Date().toISOString()), {
      mealPlan,
      calories,
      macros,
      createdAt: new Date(),
      status: 'active'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return { success: false, error: error.message };
  }
}

// Save workout plan to Firestore
export async function saveWorkoutPlan(userId, workoutPlan) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId, 'workoutPlans', new Date().toISOString()), {
      workoutPlan,
      createdAt: new Date(),
      status: 'active'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error saving workout plan:', error);
    return { success: false, error: error.message };
  }
}

// Log meal to Firestore
export async function logMeal(userId, meal, date) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId, 'mealLogs', `${date}-${Date.now()}`), {
      meal,
      date,
      timestamp: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging meal:', error);
    return { success: false, error: error.message };
  }
}

// Log workout to Firestore
export async function logWorkout(userId, workout, date) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId, 'workoutLogs', `${date}-${Date.now()}`), {
      workout,
      date,
      completed: true,
      timestamp: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error logging workout:', error);
    return { success: false, error: error.message };
  }
}
