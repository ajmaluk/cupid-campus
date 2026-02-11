import { INTERESTS_LIST, type Profile } from '../types';

// Weights for different categories
const WEIGHTS = {
  INTEREST: 5,
  INTENT_MATCH: 30,
  INTENT_MISMATCH_PENALTY: -30,
  PERSONALITY_COMPATIBLE: 15,
  PERSONALITY_MATCH: 10,
  DEPARTMENT_MATCH: 10, // Same dept?
  MAJOR_MATCH: 15, // Same major? (Study buddy potential)
  YEAR_GAP_PENALTY: -5, // Too big age gap?
  FRIENDSHIP_BONUS: 20, // Boost for "Friendship first" intent
};

// Define compatible personality pairs (Opposites attract or similar vibes)
const PERSONALITY_PAIRS: Record<string, string[]> = {
  'Introvert': ['Extrovert', 'Ambivert', 'Deep thinker'],
  'Extrovert': ['Introvert', 'Ambivert', 'Funny'],
  'Deep thinker': ['Deep thinker', 'Introvert', 'Romantic'],
  'Adventurous': ['Adventurous', 'Funny', 'Chill'],
  'Chill': ['Chill', 'Adventurous', 'Ambivert'],
  'Romantic': ['Romantic', 'Deep thinker'],
  'Funny': ['Funny', 'Extrovert', 'Adventurous'],
};

// Define Department Compatibility (e.g., Tech + Tech, or Art + Tech)
const DEPT_COMPATIBILITY: Record<string, string[]> = {
  'B.Tech': ['B.Tech', 'M.Tech', 'MCA'],
  'M.Tech': ['B.Tech', 'M.Tech', 'PhD'],
  'MCA': ['B.Tech', 'MCA', 'B.Sc'],
  'MBA': ['MBA', 'BBA', 'B.Tech'], // Business + Tech is a power couple
  'B.Arch': ['B.Arch', 'B.Des', 'Fine Arts']
};

export interface MatchAnalysis {
  score: number;
  percentage: number;
  commonInterests: string[];
  vibeTags: string[]; // Reasons for high score
  academicSynergy?: string; // e.g., "Tech Duo", "Creative Minds"
  matchType?: 'Soul Mate' | 'Bestie' | 'Study Buddy' | 'Standard';
}

export function analyzeCompatibility(user1: Profile, user2: Profile): MatchAnalysis {
  let rawScore = 0;
  const commonInterests: string[] = [];
  const vibeTags: string[] = [];
  let academicSynergy = undefined;
  let matchType: MatchAnalysis['matchType'] = 'Standard';

  // 1. Academic Compatibility
  if (user1.department && user2.department) {
    if (user1.department === user2.department) {
      rawScore += WEIGHTS.DEPARTMENT_MATCH;
      if (user1.major === user2.major) {
        rawScore += WEIGHTS.MAJOR_MATCH;
        academicSynergy = "Study Buddies 📚";
        matchType = 'Study Buddy';
      } else {
        academicSynergy = `${user1.department} Squad`;
      }
    } else if (DEPT_COMPATIBILITY[user1.department]?.includes(user2.department)) {
      rawScore += 5; // Slight boost for compatible fields
      academicSynergy = "Power Couple 🚀";
    }
  }

  // 2. Shared Interests
  const user1Interests = new Set(user1.interests);
  user2.interests.forEach(interest => {
    if (user1Interests.has(interest)) {
      commonInterests.push(interest);
      rawScore += WEIGHTS.INTEREST;
    }
  });

  // 3. Dating Intent (Critical) & Friendship Logic
  const intentCategories = INTERESTS_LIST.DatingIntent;
  const user1Intent = user1.interests.find(i => intentCategories.includes(i));
  const user2Intent = user2.interests.find(i => intentCategories.includes(i));

  const isFriendship = user1Intent === 'Friendship first' || user2Intent === 'Friendship first';

  if (user1Intent && user2Intent) {
    if (user1Intent === user2Intent) {
      rawScore += WEIGHTS.INTENT_MATCH;
      vibeTags.push('Looking for the same thing');
      
      if (user1Intent === 'Friendship first') {
        rawScore += WEIGHTS.FRIENDSHIP_BONUS;
        matchType = 'Bestie';
        vibeTags.push('Potential BFF 👯‍♀️');
      }
    } else {
      // Check for hard mismatches
      const isSeriousMismatch = 
        (user1Intent === 'Serious relationship' && user2Intent === 'Casual dating') ||
        (user1Intent === 'Casual dating' && user2Intent === 'Serious relationship');
      
      if (isSeriousMismatch) {
        rawScore += WEIGHTS.INTENT_MISMATCH_PENALTY;
      }
    }
  }

  // 4. Personality Compatibility
  const personalityCategories = INTERESTS_LIST.Personality;
  const user1Personality = user1.interests.filter(i => personalityCategories.includes(i));
  const user2Personality = user2.interests.filter(i => personalityCategories.includes(i));

  let personalityScore = 0;
  
  user1Personality.forEach(p1 => {
    user2Personality.forEach(p2 => {
      if (p1 === p2) {
        personalityScore += WEIGHTS.PERSONALITY_MATCH;
        // Similar personalities are good for friendship
        if (isFriendship) personalityScore += 5; 
      } else if (PERSONALITY_PAIRS[p1]?.includes(p2)) {
        personalityScore += WEIGHTS.PERSONALITY_COMPATIBLE;
        if (!vibeTags.includes('Vibe Check Passed')) vibeTags.push('Vibe Check Passed');
      }
    });
  });

  // Cap personality score
  rawScore += Math.min(personalityScore, 40);

  // Normalize to 0-100%
  const normalizedPercentage = Math.min(Math.max(Math.round((rawScore / 100) * 100), 0), 100);

  // Determine Final Match Type
  if (normalizedPercentage >= 90) {
    matchType = 'Soul Mate';
  } else if (isFriendship && normalizedPercentage >= 70) {
    matchType = 'Bestie';
  }

  return {
    score: rawScore,
    percentage: normalizedPercentage,
    commonInterests,
    vibeTags,
    academicSynergy,
    matchType
  };
}

export function calculateCompatibility(user1: Profile, user2: Profile): number {
  return analyzeCompatibility(user1, user2).score;
}

export function sortProfilesByCompatibility(currentUser: Profile, profiles: Profile[]): Profile[] {
  return [...profiles].sort((a, b) => {
    const analysisA = analyzeCompatibility(currentUser, a);
    const analysisB = analyzeCompatibility(currentUser, b);
    return analysisB.score - analysisA.score; // Descending
  });
}
