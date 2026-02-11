export interface Profile {
  id: string;
  username?: string; // Added
  name: string;
  dob?: string; // Added
  age: number;
  gender: 'Male' | 'Female' | 'Non-binary' | 'Other';
  interested_in: 'Male' | 'Female' | 'Everyone';
  department?: string; // e.g. B.Tech
  major?: string; // e.g. Computer Science
  course: string; // Display string (e.g. "B.Tech - CS")
  year: string;
  bio: string;
  interests: string[];
  photos: Photo[];
  primary_photo: string;
  vibe_score?: Record<string, number>;
  created_at: string;
  is_admin_recommended?: boolean; // Frontend flag
  is_soulmate?: boolean; // Frontend flag for high priority
  is_admin?: boolean; // Admin privilege flag
}

export interface Photo {
  id: string;
  url: string;
  is_primary: boolean;
}

export interface Swipe {
  id: number;
  swiper_id: string;
  swiped_id: string;
  liked: boolean;
  created_at: string;
}

export interface Match {
  id: number;
  user1: string;
  user2: string;
  compatibility_score: number;
  created_at: string;
  profile?: Profile; // Joined profile
}

export interface Message {
  id: number;
  match_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export interface AdminRecommendation {
  id: string;
  admin_id: string;
  target_user_id: string; // The user who will see the recommendation
  recommended_user_id: string; // The user being recommended
  created_at: string;
  type?: 'standard' | 'soulmate' | 'friend';
}

export const INTERESTS_LIST = {
  Lifestyle: ['Fitness', 'Gaming', 'Partying', 'Reading', 'Traveling', 'Cooking', 'Photography'],
  Personality: ['Introvert', 'Extrovert', 'Ambivert', 'Deep thinker', 'Funny', 'Chill', 'Romantic', 'Adventurous'],
  DatingIntent: ['Serious relationship', 'Casual dating', 'Friendship first', 'See where it goes'],
  Hobbies: ['Music', 'Movies', 'Tech', 'Sports', 'Art', 'Fashion', 'Startups']
};

export const DEPARTMENTS = ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'B.Arch'];

export const MAJORS: Record<string, string[]> = {
  'B.Tech': ['Computer Science', 'Electronics & Comm', 'Electrical & Electronics', 'Mechanical', 'Civil', 'Industrial', 'Applied Electronics'],
  'M.Tech': ['Structural Eng', 'Control Systems', 'Computer Science', 'Thermal Science', 'Robotics'],
  'MCA': ['Computer Applications'],
  'MBA': ['Finance', 'Marketing', 'HR', 'Operations', 'Systems'],
  'B.Arch': ['Architecture']
};

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
