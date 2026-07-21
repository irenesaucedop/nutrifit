// Meal Plan & Workout Generator Logic
import { initializeFirebase, getCurrentUser } from './auth.js';

let db;

export async function initializeGenerators() {
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
  await initializeFirebase();
  db = getFirestore();
}

// Calculate daily caloric needs (Harris-Benedict formula)
export function calculateCalories(age, weight, height, gender, activityLevel, fitnessGoal) {
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
  
  return Math.round(tdee + (goalAdjustment[fitnessGoal] || 0));
}

// Calculate macros based on fitness goal
export function calculateMacros(calories, fitnessGoal) {
  let macroRatios;
  
  // Different macro ratios for different goals
  if (fitnessGoal === 'muscle gain') {
    // Higher protein for muscle building
    macroRatios = { protein: 0.35, carbs: 0.45, fat: 0.20 };
  } else if (fitnessGoal === 'weight loss') {
    // Moderate protein, lower carbs
    macroRatios = { protein: 0.35, carbs: 0.35, fat: 0.30 };
  } else {
    // Maintenance - balanced
    macroRatios = { protein: 0.30, carbs: 0.40, fat: 0.30 };
  }
  
  return {
    protein: Math.round((calories * macroRatios.protein) / 4), // 4 cal per gram
    carbs: Math.round((calories * macroRatios.carbs) / 4),     // 4 cal per gram
    fat: Math.round((calories * macroRatios.fat) / 9)          // 9 cal per gram
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

// Comprehensive Gym Workout Database - Organized by Goal
const gymWorkoutDatabase = {
  'muscle gain': {
    'chest': [
      { name: 'Barbell Bench Press', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'chest' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 8, rest: 90, equipment: 'dumbbell', focus: 'chest' },
      { name: 'Chest Fly Machine', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'chest' },
      { name: 'Dips', sets: 3, reps: 8, rest: 90, equipment: 'bodyweight', focus: 'chest' }
    ],
    'back': [
      { name: 'Deadlifts', sets: 4, reps: 5, rest: 120, equipment: 'barbell', focus: 'back' },
      { name: 'Barbell Rows', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'back' },
      { name: 'Pull-ups', sets: 3, reps: 8, rest: 90, equipment: 'bodyweight', focus: 'back' },
      { name: 'Lat Pulldown', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'back' }
    ],
    'legs': [
      { name: 'Barbell Squats', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'legs' },
      { name: 'Leg Press', sets: 3, reps: 8, rest: 100, equipment: 'machine', focus: 'legs' },
      { name: 'Romanian Deadlifts', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'legs' },
      { name: 'Leg Curls', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'legs' }
    ],
    'shoulders': [
      { name: 'Overhead Press', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'shoulders' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: 8, rest: 90, equipment: 'dumbbell', focus: 'shoulders' },
      { name: 'Lateral Raises', sets: 3, reps: 12, rest: 60, equipment: 'dumbbell', focus: 'shoulders' },
      { name: 'Machine Shoulder Press', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'shoulders' }
    ],
    'arms': [
      { name: 'Barbell Curls', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'biceps' },
      { name: 'Tricep Dips', sets: 3, reps: 8, rest: 90, equipment: 'bodyweight', focus: 'triceps' },
      { name: 'Hammer Curls', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', focus: 'biceps' },
      { name: 'Cable Tricep Pushdown', sets: 3, reps: 12, rest: 60, equipment: 'cable', focus: 'triceps' }
    ]
  },
  'weight loss': {
    'full body cardio': [
      { name: 'Treadmill Running (HIIT)', duration: 25, intensity: 'high', equipment: 'machine', focus: 'cardio' },
      { name: 'Rowing Machine (Steady State)', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio' },
      { name: 'Stair Climber', duration: 20, intensity: 'high', equipment: 'machine', focus: 'cardio' },
      { name: 'Stationary Bike (HIIT)', duration: 20, intensity: 'high', equipment: 'machine', focus: 'cardio' }
    ],
    'circuit training': [
      { name: 'Kettlebell Swings', sets: 3, reps: 15, rest: 45, equipment: 'kettlebell', focus: 'full-body' },
      { name: 'Burpees', sets: 3, reps: 12, rest: 45, equipment: 'bodyweight', focus: 'full-body' },
      { name: 'Battle Ropes', sets: 3, duration: 30, rest: 45, equipment: 'ropes', focus: 'cardio' },
      { name: 'Box Jumps', sets: 3, reps: 10, rest: 60, equipment: 'box', focus: 'legs' },
      { name: 'Medicine Ball Slams', sets: 3, reps: 12, rest: 45, equipment: 'medicine-ball', focus: 'full-body' }
    ],
    'metabolic training': [
      { name: 'Dumbbell Complex', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', focus: 'full-body' },
      { name: 'Jump Rope (HIIT)', duration: 15, intensity: 'high', equipment: 'rope', focus: 'cardio' },
      { name: 'Mountain Climbers', sets: 3, reps: 20, rest: 45, equipment: 'bodyweight', focus: 'core' },
      { name: 'Assault Bike', duration: 20, intensity: 'high', equipment: 'machine', focus: 'cardio' }
    ]
  },
  'maintenance': {
    'balanced strength': [
      { name: 'Barbell Bench Press', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'chest' },
      { name: 'Barbell Rows', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'back' },
      { name: 'Barbell Squats', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'legs' },
      { name: 'Overhead Press', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'shoulders' }
    ],
    'moderate cardio': [
      { name: 'Treadmill Running (Steady)', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio' },
      { name: 'Elliptical Machine', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio' },
      { name: 'Rowing Machine', duration: 25, intensity: 'moderate', equipment: 'machine', focus: 'cardio' },
      { name: 'Stationary Bike', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio' }
    ],
    'functional training': [
      { name: 'Functional Movement Complex', sets: 3, reps: 12, rest: 60, equipment: 'mixed', focus: 'full-body' },
      { name: 'Farmer Carries', sets: 3, duration: 40, rest: 60, equipment: 'dumbbell', focus: 'core' },
      { name: 'Sled Push', sets: 3, duration: 40, rest: 60, equipment: 'sled', focus: 'legs' },
      { name: 'TRX Suspension Training', sets: 3, reps: 12, rest: 60, equipment: 'suspension', focus: 'full-body' }
    ]
  }
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

// Generate personalized workout plan based on goal
export function generateWorkoutPlan(fitnessGoal, daysCount = 7, fitnessLevel = 'intermediate') {
  const plan = [];
  const workoutsByGoal = gymWorkoutDatabase[fitnessGoal];
  
  if (!workoutsByGoal) {
    console.warn(`No workouts found for goal: ${fitnessGoal}`);
    return plan;
  }
  
  const categories = Object.keys(workoutsByGoal);
  
  for (let day = 1; day <= daysCount; day++) {
    // Cycle through different categories for variety
    const categoryIndex = (day - 1) % categories.length;
    const category = categories[categoryIndex];
    const categoryWorkouts = workoutsByGoal[category];
    
    if (categoryWorkouts && categoryWorkouts.length > 0) {
      const workout = categoryWorkouts[Math.floor(Math.random() * categoryWorkouts.length)];
      plan.push({
        day,
        category,
        goal: fitnessGoal,
        ...workout
      });
    }
  }
  
  return plan;
}

// Get workout recommendations based on user profile
export function getWorkoutRecommendations(fitnessGoal) {
  const recommendations = {
    'muscle gain': {
      frequency: '5-6 days per week',
      focus: 'Progressive overload with compound movements',
      tip: 'Focus on heavy weights with 6-10 reps. Rest 2-3 minutes between sets.',
      splits: 'Push/Pull/Legs (PPL) or Upper/Lower splits recommended',
      recovery: 'Ensure 7-9 hours of sleep daily for muscle recovery'
    },
    'weight loss': {
      frequency: '4-5 days per week',
      focus: 'High-intensity interval training (HIIT) and circuit training',
      tip: 'Keep rest periods short (30-60 seconds) to maintain elevated heart rate.',
      splits: 'Full-body circuits or metabolic conditioning',
      recovery: 'Active recovery days are important; light walking or yoga OK'
    },
    'maintenance': {
      frequency: '3-4 days per week',
      focus: 'Balanced mix of strength and cardio',
      tip: 'Maintain current fitness levels with consistent training.',
      splits: 'Full-body or upper/lower splits',
      recovery: 'Regular rest days for sustainability'
    }
  };
  
  return recommendations[fitnessGoal] || recommendations['maintenance'];
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
export async function saveWorkoutPlan(userId, workoutPlan, fitnessGoal) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId, 'workoutPlans', new Date().toISOString()), {
      workoutPlan,
      fitnessGoal,
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
