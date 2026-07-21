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

// Nutrition timing database
const nutritionTimingMeals = {
  'pre-workout': [
    { name: 'Banana with peanut butter', calories: 200, protein: 8, carbs: 25, fat: 8, timing: '30-60 min before' },
    { name: 'Oatmeal with honey', calories: 250, protein: 6, carbs: 45, fat: 3, timing: '45-60 min before' },
    { name: 'Rice cakes with jam', calories: 200, protein: 2, carbs: 45, fat: 1, timing: '30-45 min before' },
    { name: 'Energy bar (low fiber)', calories: 200, protein: 10, carbs: 30, fat: 5, timing: '30 min before' },
    { name: 'Apple with almond butter', calories: 220, protein: 7, carbs: 28, fat: 9, timing: '45 min before' }
  ],
  'post-workout': [
    { name: 'Protein shake + banana', calories: 300, protein: 30, carbs: 40, fat: 5, timing: 'within 30 min' },
    { name: 'Chicken & rice bowl', calories: 450, protein: 40, carbs: 50, fat: 8, timing: 'within 60 min' },
    { name: 'Greek yogurt with granola', calories: 350, protein: 25, carbs: 45, fat: 8, timing: 'within 45 min' },
    { name: 'Tuna sandwich', calories: 380, protein: 35, carbs: 42, fat: 10, timing: 'within 60 min' },
    { name: 'Chocolate milk + protein bar', calories: 320, protein: 28, carbs: 38, fat: 6, timing: 'within 30 min' }
  ]
};

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

// Comprehensive Gym Workout Database - Organized by Goal, Equipment, and Difficulty
const gymWorkoutDatabase = {
  'muscle gain': {
    'chest': [
      { name: 'Barbell Bench Press', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'chest', difficulty: 'intermediate', variant: 'A', targetArea: 'chest' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 8, rest: 90, equipment: 'dumbbell', focus: 'chest', difficulty: 'beginner', variant: 'B', targetArea: 'upper-chest' },
      { name: 'Chest Fly Machine', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'chest', difficulty: 'beginner', variant: 'A', targetArea: 'chest' },
      { name: 'Dips', sets: 3, reps: 8, rest: 90, equipment: 'bodyweight', focus: 'chest', difficulty: 'intermediate', variant: 'B', targetArea: 'lower-chest' }
    ],
    'back': [
      { name: 'Deadlifts', sets: 4, reps: 5, rest: 120, equipment: 'barbell', focus: 'back', difficulty: 'intermediate', variant: 'A', targetArea: 'back-full' },
      { name: 'Barbell Rows', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'back', difficulty: 'intermediate', variant: 'A', targetArea: 'back-mid' },
      { name: 'Pull-ups', sets: 3, reps: 8, rest: 90, equipment: 'bodyweight', focus: 'back', difficulty: 'advanced', variant: 'B', targetArea: 'lats' },
      { name: 'Lat Pulldown', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'back', difficulty: 'beginner', variant: 'B', targetArea: 'lats' }
    ],
    'legs': [
      { name: 'Barbell Squats', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'legs', difficulty: 'intermediate', variant: 'A', targetArea: 'quads' },
      { name: 'Leg Press', sets: 3, reps: 8, rest: 100, equipment: 'machine', focus: 'legs', difficulty: 'beginner', variant: 'B', targetArea: 'quads' },
      { name: 'Romanian Deadlifts', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'legs', difficulty: 'intermediate', variant: 'A', targetArea: 'hamstring' },
      { name: 'Leg Curls', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'legs', difficulty: 'beginner', variant: 'B', targetArea: 'hamstring' }
    ],
    'shoulders': [
      { name: 'Overhead Press', sets: 4, reps: 6, rest: 120, equipment: 'barbell', focus: 'shoulders', difficulty: 'intermediate', variant: 'A', targetArea: 'shoulders' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: 8, rest: 90, equipment: 'dumbbell', focus: 'shoulders', difficulty: 'beginner', variant: 'B', targetArea: 'shoulders' },
      { name: 'Lateral Raises', sets: 3, reps: 12, rest: 60, equipment: 'dumbbell', focus: 'shoulders', difficulty: 'beginner', variant: 'A', targetArea: 'side-delts' },
      { name: 'Machine Shoulder Press', sets: 3, reps: 10, rest: 60, equipment: 'machine', focus: 'shoulders', difficulty: 'beginner', variant: 'B', targetArea: 'shoulders' }
    ],
    'arms': [
      { name: 'Barbell Curls', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'biceps', difficulty: 'beginner', variant: 'A', targetArea: 'biceps' },
      { name: 'Tricep Dips', sets: 3, reps: 8, rest: 90, equipment: 'bodyweight', focus: 'triceps', difficulty: 'intermediate', variant: 'B', targetArea: 'triceps' },
      { name: 'Hammer Curls', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', focus: 'biceps', difficulty: 'beginner', variant: 'A', targetArea: 'biceps' },
      { name: 'Cable Tricep Pushdown', sets: 3, reps: 12, rest: 60, equipment: 'cable', focus: 'triceps', difficulty: 'beginner', variant: 'B', targetArea: 'triceps' }
    ]
  },
  'weight loss': {
    'full body cardio': [
      { name: 'Treadmill Running (HIIT)', duration: 25, intensity: 'high', equipment: 'machine', focus: 'cardio', difficulty: 'intermediate', variant: 'A', targetArea: 'full-body' },
      { name: 'Rowing Machine (Steady State)', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio', difficulty: 'beginner', variant: 'B', targetArea: 'full-body' },
      { name: 'Stair Climber', duration: 20, intensity: 'high', equipment: 'machine', focus: 'cardio', difficulty: 'intermediate', variant: 'A', targetArea: 'legs' },
      { name: 'Stationary Bike (HIIT)', duration: 20, intensity: 'high', equipment: 'machine', focus: 'cardio', difficulty: 'intermediate', variant: 'B', targetArea: 'legs' }
    ],
    'circuit training': [
      { name: 'Kettlebell Swings', sets: 3, reps: 15, rest: 45, equipment: 'kettlebell', focus: 'full-body', difficulty: 'intermediate', variant: 'A', targetArea: 'full-body' },
      { name: 'Burpees', sets: 3, reps: 12, rest: 45, equipment: 'bodyweight', focus: 'full-body', difficulty: 'advanced', variant: 'B', targetArea: 'full-body' },
      { name: 'Battle Ropes', sets: 3, duration: 30, rest: 45, equipment: 'ropes', focus: 'cardio', difficulty: 'intermediate', variant: 'A', targetArea: 'arms-shoulders' },
      { name: 'Box Jumps', sets: 3, reps: 10, rest: 60, equipment: 'box', focus: 'legs', difficulty: 'advanced', variant: 'B', targetArea: 'legs' },
      { name: 'Medicine Ball Slams', sets: 3, reps: 12, rest: 45, equipment: 'medicine-ball', focus: 'full-body', difficulty: 'intermediate', variant: 'A', targetArea: 'core' }
    ],
    'metabolic training': [
      { name: 'Dumbbell Complex', sets: 3, reps: 10, rest: 60, equipment: 'dumbbell', focus: 'full-body', difficulty: 'intermediate', variant: 'A', targetArea: 'full-body' },
      { name: 'Jump Rope (HIIT)', duration: 15, intensity: 'high', equipment: 'rope', focus: 'cardio', difficulty: 'beginner', variant: 'B', targetArea: 'cardio' },
      { name: 'Mountain Climbers', sets: 3, reps: 20, rest: 45, equipment: 'bodyweight', focus: 'core', difficulty: 'intermediate', variant: 'A', targetArea: 'core' },
      { name: 'Assault Bike', duration: 20, intensity: 'high', equipment: 'machine', focus: 'cardio', difficulty: 'intermediate', variant: 'B', targetArea: 'full-body' }
    ]
  },
  'maintenance': {
    'balanced strength': [
      { name: 'Barbell Bench Press', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'chest', difficulty: 'intermediate', variant: 'A', targetArea: 'chest' },
      { name: 'Barbell Rows', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'back', difficulty: 'intermediate', variant: 'A', targetArea: 'back-mid' },
      { name: 'Barbell Squats', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'legs', difficulty: 'intermediate', variant: 'A', targetArea: 'quads' },
      { name: 'Overhead Press', sets: 3, reps: 8, rest: 90, equipment: 'barbell', focus: 'shoulders', difficulty: 'intermediate', variant: 'A', targetArea: 'shoulders' }
    ],
    'moderate cardio': [
      { name: 'Treadmill Running (Steady)', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio', difficulty: 'beginner', variant: 'B', targetArea: 'cardio' },
      { name: 'Elliptical Machine', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio', difficulty: 'beginner', variant: 'B', targetArea: 'cardio' },
      { name: 'Rowing Machine', duration: 25, intensity: 'moderate', equipment: 'machine', focus: 'cardio', difficulty: 'beginner', variant: 'A', targetArea: 'full-body' },
      { name: 'Stationary Bike', duration: 30, intensity: 'moderate', equipment: 'machine', focus: 'cardio', difficulty: 'beginner', variant: 'B', targetArea: 'legs' }
    ],
    'functional training': [
      { name: 'Functional Movement Complex', sets: 3, reps: 12, rest: 60, equipment: 'mixed', focus: 'full-body', difficulty: 'intermediate', variant: 'A', targetArea: 'full-body' },
      { name: 'Farmer Carries', sets: 3, duration: 40, rest: 60, equipment: 'dumbbell', focus: 'core', difficulty: 'beginner', variant: 'B', targetArea: 'grip-core' },
      { name: 'Sled Push', sets: 3, duration: 40, rest: 60, equipment: 'sled', focus: 'legs', difficulty: 'intermediate', variant: 'A', targetArea: 'legs' },
      { name: 'TRX Suspension Training', sets: 3, reps: 12, rest: 60, equipment: 'suspension', focus: 'full-body', difficulty: 'intermediate', variant: 'B', targetArea: 'full-body' }
    ]
  }
};

// Home workout modifications
const homeWorkoutDatabase = {
  'muscle gain': {
    'chest': [
      { name: 'Push-ups (Standard)', sets: 3, reps: 15, rest: 90, equipment: 'bodyweight', focus: 'chest', difficulty: 'beginner', variant: 'A', targetArea: 'chest' },
      { name: 'Incline Push-ups', sets: 3, reps: 12, rest: 90, equipment: 'bodyweight', focus: 'chest', difficulty: 'beginner', variant: 'B', targetArea: 'upper-chest' },
      { name: 'Diamond Push-ups', sets: 3, reps: 10, rest: 90, equipment: 'bodyweight', focus: 'chest', difficulty: 'intermediate', variant: 'A', targetArea: 'chest' }
    ],
    'back': [
      { name: 'Pull-ups (Assisted)', sets: 3, reps: 8, rest: 90, equipment: 'bar', focus: 'back', difficulty: 'intermediate', variant: 'A', targetArea: 'back' },
      { name: 'Resistance Band Rows', sets: 3, reps: 12, rest: 60, equipment: 'band', focus: 'back', difficulty: 'beginner', variant: 'B', targetArea: 'back-mid' },
      { name: 'Dumbbell Rows', sets: 3, reps: 10, rest: 90, equipment: 'dumbbell', focus: 'back', difficulty: 'intermediate', variant: 'A', targetArea: 'back' }
    ],
    'legs': [
      { name: 'Bodyweight Squats', sets: 3, reps: 15, rest: 90, equipment: 'bodyweight', focus: 'legs', difficulty: 'beginner', variant: 'A', targetArea: 'quads' },
      { name: 'Bulgarian Split Squats', sets: 3, reps: 12, rest: 90, equipment: 'chair', focus: 'legs', difficulty: 'intermediate', variant: 'B', targetArea: 'quads' },
      { name: 'Single Leg Deadlifts', sets: 3, reps: 10, rest: 90, equipment: 'dumbbell', focus: 'legs', difficulty: 'intermediate', variant: 'A', targetArea: 'hamstring' }
    ]
  },
  'weight loss': {
    'cardio': [
      { name: 'Jump Rope (HIIT)', duration: 15, intensity: 'high', equipment: 'rope', focus: 'cardio', difficulty: 'beginner', variant: 'A', targetArea: 'cardio' },
      { name: 'Burpees', sets: 3, reps: 12, rest: 45, equipment: 'bodyweight', focus: 'full-body', difficulty: 'advanced', variant: 'B', targetArea: 'full-body' },
      { name: 'Mountain Climbers', sets: 3, reps: 20, rest: 45, equipment: 'bodyweight', focus: 'core', difficulty: 'intermediate', variant: 'A', targetArea: 'core' }
    ]
  }
};

// Generate personalized meal plan with nutrition timing
export function generateMealPlan(dietaryPref, daysCount = 7, includeNutritionTiming = true) {
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
  
  if (includeNutritionTiming) {
    plan.preWorkout = nutritionTimingMeals['pre-workout'][Math.floor(Math.random() * nutritionTimingMeals['pre-workout'].length)];
    plan.postWorkout = nutritionTimingMeals['post-workout'][Math.floor(Math.random() * nutritionTimingMeals['post-workout'].length)];
  }
  
  return plan;
}

// Generate personalized workout plan based on goal, equipment, and difficulty
export function generateWorkoutPlan(fitnessGoal, daysCount = 7, equipment = 'gym', fitnessLevel = 'intermediate') {
  const plan = [];
  
  // Select appropriate database
  let workoutsByGoal;
  if (equipment === 'home') {
    workoutsByGoal = homeWorkoutDatabase[fitnessGoal];
  } else {
    workoutsByGoal = gymWorkoutDatabase[fitnessGoal];
  }
  
  if (!workoutsByGoal) {
    console.warn(`No workouts found for goal: ${fitnessGoal}, equipment: ${equipment}`);
    return plan;
  }
  
  const categories = Object.keys(workoutsByGoal);
  let variant = 'A';
  
  for (let day = 1; day <= daysCount; day++) {
    // Cycle through different categories for variety
    const categoryIndex = (day - 1) % categories.length;
    const category = categories[categoryIndex];
    const categoryWorkouts = workoutsByGoal[category];
    
    if (categoryWorkouts && categoryWorkouts.length > 0) {
      // Filter by difficulty and variant
      let filteredWorkouts = categoryWorkouts.filter(w => 
        w.difficulty === fitnessLevel && w.variant === variant
      );
      
      // Fallback if specific combo not found
      if (filteredWorkouts.length === 0) {
        filteredWorkouts = categoryWorkouts.filter(w => w.variant === variant);
      }
      if (filteredWorkouts.length === 0) {
        filteredWorkouts = categoryWorkouts;
      }
      
      const workout = filteredWorkouts[Math.floor(Math.random() * filteredWorkouts.length)];
      plan.push({
        day,
        category,
        goal: fitnessGoal,
        equipment,
        ...workout
      });
      
      // Alternate between A and B variants for progression
      variant = variant === 'A' ? 'B' : 'A';
    }
  }
  
  return plan;
}

// Get workout recommendations based on user profile
export function getWorkoutRecommendations(fitnessGoal, equipment = 'gym') {
  const recommendations = {
    'muscle gain': {
      frequency: '5-6 days per week',
      focus: 'Progressive overload with compound movements',
      tip: 'Focus on heavy weights with 5-8 reps. Rest 2-3 minutes between sets.',
      splits: 'Push/Pull/Legs (PPL) or Upper/Lower splits recommended',
      recovery: 'Ensure 7-9 hours of sleep daily for muscle recovery',
      progressionStrategy: 'Week 1-3: Build volume (3x8) → Week 4-6: Heavy strength (4x5) → Deload and repeat',
      nutrition: 'Pre: Carbs + protein 30-60 min before | Post: Protein + carbs within 30 min',
      equipment: equipment === 'home' ? 'Dumbbells, pull-up bar, resistance bands' : 'Barbells, dumbbells, machines'
    },
    'weight loss': {
      frequency: '4-5 days per week',
      focus: 'High-intensity interval training (HIIT) and circuit training',
      tip: 'Keep rest periods short (30-60 seconds) to maintain elevated heart rate.',
      splits: 'Full-body circuits or metabolic conditioning',
      recovery: 'Active recovery days are important; light walking or yoga OK',
      progressionStrategy: 'Increase duration or intensity by 5-10% weekly | Track calorie burn',
      nutrition: 'Pre: Light carbs 15-30 min before | Post: Protein + carbs within 30 min | Stay hydrated',
      equipment: equipment === 'home' ? 'Jump rope, bodyweight, resistance bands' : 'Cardio machines, kettlebells, medicine balls'
    },
    'maintenance': {
      frequency: '3-4 days per week',
      focus: 'Balanced mix of strength and cardio',
      tip: 'Maintain current fitness levels with consistent training.',
      splits: 'Full-body or upper/lower splits',
      recovery: 'Regular rest days for sustainability',
      progressionStrategy: 'Maintain current weights and cardio duration | Focus on consistency',
      nutrition: 'Pre: Balanced meal 2 hours before | Post: Normal meal within 1-2 hours',
      equipment: equipment === 'home' ? 'Mix of bodyweight and light resistance' : 'Mix of strength and cardio machines'
    }
  };
  
  return recommendations[fitnessGoal] || recommendations['maintenance'];
}

// Get nutrition timing recommendations
export function getNutritionTimingPlan(fitnessGoal, workoutTime) {
  const timingPlans = {
    'muscle gain': {
      'pre-workout': {
        timing: '30-60 minutes before',
        purpose: 'Provide energy and prevent muscle breakdown',
        recommendation: 'Complex carbs + protein (40g carbs + 20g protein)',
        examples: ['Banana with peanut butter', 'Oatmeal with protein']
      },
      'post-workout': {
        timing: 'Within 30 minutes after',
        purpose: 'Maximize muscle protein synthesis and glycogen replenishment',
        recommendation: 'Fast carbs + protein (40-60g carbs + 30-40g protein)',
        examples: ['Protein shake with banana', 'Chicken & rice bowl']
      },
      'during-workout': {
        timing: 'During long sessions (>60 min)',
        purpose: 'Maintain energy and performance',
        recommendation: 'Simple carbs + electrolytes (10-20g carbs)',
        examples: ['Sports drink', 'Dextrose powder']
      }
    },
    'weight loss': {
      'pre-workout': {
        timing: '15-30 minutes before',
        purpose: 'Fuel without adding excess calories',
        recommendation: 'Light carbs (15-20g) - keep it minimal',
        examples: ['Apple', 'Banana']
      },
      'post-workout': {
        timing: 'Within 30-60 minutes after',
        purpose: 'Protein for recovery without high calories',
        recommendation: 'High protein, moderate carbs (30-40g protein + 20g carbs)',
        examples: ['Protein shake', 'Chicken breast with rice']
      },
      'during-workout': {
        timing: 'During long sessions (>45 min)',
        purpose: 'Maintain energy for intensity',
        recommendation: 'Water with electrolytes - no calories',
        examples: ['Electrolyte water']
      }
    }
  };
  
  return timingPlans[fitnessGoal] || timingPlans['maintenance'];
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
export async function saveWorkoutPlan(userId, workoutPlan, fitnessGoal, equipment) {
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js');
    
    await setDoc(doc(db, 'users', userId, 'workoutPlans', new Date().toISOString()), {
      workoutPlan,
      fitnessGoal,
      equipment,
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
