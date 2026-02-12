import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { INTERESTS_LIST, type Profile } from '../types';
import { ChevronRight, Upload, X, Loader2, ChevronLeft, Check } from 'lucide-react';
import { uploadImage } from '../lib/cloudinary';
import { validateFace } from '../lib/faceRecognition';

const STEPS = ['Identity', 'Academic', 'Vibe', 'Photos', 'Bio'];

const DEPARTMENTS = ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'B.Arch'];
const MAJORS: Record<string, string[]> = {
  'B.Tech': ['Computer Science', 'Electronics & Comm', 'Electrical & Electronics', 'Mechanical', 'Civil', 'Industrial', 'Applied Electronics'],
  'M.Tech': ['Structural Eng', 'Control Systems', 'Computer Science', 'Thermal Science', 'Robotics'],
  'MCA': ['Computer Applications'],
  'MBA': ['Finance', 'Marketing', 'HR', 'Operations', 'Systems'],
  'B.Arch': ['Architecture']
};
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export default function Onboarding({ isEditing = false }: { isEditing?: boolean }) {
  const navigate = useNavigate();
  const { setCurrentUser } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch existing profile to pre-fill
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.name || '',
            age: profile.age?.toString() || '',
            gender: profile.gender || '',
            interested_in: profile.interested_in || '',
            department: profile.department || '',
            major: profile.major || '',
            year: profile.year || '',
            interests: profile.interests || [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            photos: profile.photos?.map((p: any) => p.url) || [],
            bio: profile.bio || ''
          }));
          
          // Smart Skip: If we have the basics, jump to Photos
          if (!isEditing && profile.name && profile.department && profile.interests && profile.interests.length > 0) {
             setCurrentStep(3);
          }
        }
      } else {
        navigate('/');
      }
      setIsLoading(false);
    };
    getUser();
  }, [navigate, isEditing]);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as Profile['gender'] | '',
    interested_in: '' as Profile['interested_in'] | '',
    department: '',
    major: '',
    year: '',
    interests: [] as string[],
    photos: [] as string[],
    bio: ''
  });

  const updateForm = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
    // Reset major if department changes
    if (key === 'department') {
      setFormData(prev => ({ ...prev, [key]: value, major: '' }));
    } else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const { isValid, error } = await validateFace(file);
        if (!isValid) {
          alert(error || 'Face validation failed.');
          setIsUploading(false);
          e.target.value = '';
          return;
        }

        const url = await uploadImage(file);
        setFormData(prev => ({ ...prev, photos: [...prev.photos, url] }));
      } catch (error) {
        console.error(error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
        e.target.value = '';
      }
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (!userId) return;

      // Complete Onboarding
      const newProfile: Profile = {
        id: userId,
        ...formData,
        course: `${formData.department} - ${formData.major}`, // Compatibility mapping
        age: parseInt(formData.age),
        photos: formData.photos.map((url, i) => ({ id: i.toString(), url, is_primary: i === 0 })),
        primary_photo: formData.photos[0] || '',
        created_at: new Date().toISOString(),
        interests: formData.interests,
        gender: formData.gender as 'Male' | 'Female' | 'Non-binary' | 'Other',
        interested_in: formData.interested_in as 'Male' | 'Female' | 'Everyone'
      };

      try {
        const { error } = await supabase.from('profiles').upsert(newProfile);
        
        if (error) {
          console.error('Error saving profile:', error);
          alert('Failed to save profile: ' + error.message);
          return;
        }

        setCurrentUser(newProfile);
        navigate(isEditing ? '/profile' : '/welcome');
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('An unexpected error occurred.');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.name && formData.age && formData.gender && formData.interested_in;
      case 1: return formData.department && formData.major && formData.year;
      case 2: return formData.interests.length >= 3;
      case 3: return formData.photos.length >= 1;
      case 4: return formData.bio.length > 10;
      default: return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Header / Progress */}
      <div className="flex items-center gap-4 mb-8">
        {(currentStep > 0 || isEditing) && (
          <button 
            onClick={currentStep > 0 ? handleBack : () => navigate('/profile')} 
            className="p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex-1 flex gap-2">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-primary' : 'bg-gray-800'
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mb-2">{STEPS[currentStep]}</h1>
        <p className="text-gray-400 mb-8">Step {currentStep + 1} of {STEPS.length}</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-4"
          >
            {/* Step 0: Identity */}
            {currentStep === 0 && (
              <>
                <Input 
                  placeholder="Full Name" 
                  value={formData.name}
                  onChange={e => updateForm('name', e.target.value)}
                />
                <Input 
                  type="number" 
                  placeholder="Age" 
                  value={formData.age}
                  onChange={e => updateForm('age', e.target.value)}
                />
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">I identify as...</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Male', 'Female', 'Non-binary', 'Other'] as const).map(g => (
                      <button
                        key={g}
                        className={`p-4 rounded-2xl border text-sm font-medium transition-all ${
                          formData.gender === g 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-gray-900 border-gray-800 text-gray-400'
                        }`}
                        onClick={() => updateForm('gender', g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 font-medium">Interested in...</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Male', 'Female', 'Everyone'] as const).map(g => (
                      <button
                        key={g}
                        className={`p-4 rounded-2xl border text-sm font-medium transition-all ${
                          formData.interested_in === g 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-gray-900 border-gray-800 text-gray-400'
                        }`}
                        onClick={() => updateForm('interested_in', g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Academic (New Native Dropdowns) */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Department */}
                <div className="space-y-3">
                  <label className="text-sm text-gray-400 font-medium">Department / Degree</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept}
                        onClick={() => updateForm('department', dept)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.department === dept
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-gray-900 border-gray-800 text-gray-400'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Major (Dependent on Department) */}
                {formData.department && MAJORS[formData.department] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <label className="text-sm text-gray-400 font-medium">Specialization / Branch</label>
                    <div className="flex flex-col gap-2">
                      {MAJORS[formData.department].map(major => (
                        <button
                          key={major}
                          onClick={() => updateForm('major', major)}
                          className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-all flex justify-between items-center ${
                            formData.major === major
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-gray-900 border-gray-800 text-gray-400'
                          }`}
                        >
                          {major}
                          {formData.major === major && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Year */}
                <div className="space-y-3">
                  <label className="text-sm text-gray-400 font-medium">Current Year</label>
                  <div className="grid grid-cols-3 gap-2">
                    {YEARS.map(y => (
                      <button
                        key={y}
                        onClick={() => updateForm('year', y)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.year === y 
                            ? 'bg-primary/20 border-primary text-primary' 
                            : 'bg-gray-900 border-gray-800 text-gray-400'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Vibe/Interests (Enhanced UI) */}
            {currentStep === 2 && (
              <div className="space-y-8">
                {Object.entries(INTERESTS_LIST).map(([category, interests]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map(interest => {
                        const selected = formData.interests.includes(interest);
                        return (
                          <button
                            key={interest}
                            onClick={() => {
                              const newInterests = selected 
                                ? formData.interests.filter(i => i !== interest)
                                : [...formData.interests, interest];
                              updateForm('interests', newInterests);
                            }}
                            className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                              selected
                                ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                                : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Photos */}
            {currentStep === 3 && (
              <div className="grid grid-cols-2 gap-4">
                {formData.photos.map((url, i) => (
                  <div key={i} className="aspect-[3/4] relative rounded-2xl overflow-hidden group shadow-lg border border-white/5">
                    <img src={url} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, idx) => idx !== i) }))}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary/90 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                {formData.photos.length < 6 && (
                  <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-800 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all bg-gray-900/30">
                    {isUploading ? (
                      <Loader2 className="animate-spin mb-2 text-primary" />
                    ) : (
                      <Upload className="mb-2" />
                    )}
                    <span className="text-xs font-medium">{isUploading ? 'Uploading...' : 'Add Photo'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploading} />
                  </label>
                )}
              </div>
            )}

            {/* Step 4: Bio */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="relative">
                  <textarea 
                    placeholder="Write a short bio about yourself... What makes you tick?" 
                    className="w-full h-48 bg-gray-900 border border-gray-800 rounded-3xl p-6 text-white text-lg placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
                    value={formData.bio}
                    onChange={e => updateForm('bio', e.target.value)}
                    maxLength={300}
                  />
                  <div className="absolute bottom-4 right-6 text-xs font-medium text-gray-500">
                    {formData.bio.length} / 300
                  </div>
                </div>
                <p className="text-sm text-gray-500 px-2">
                  💡 Tip: Mention your favorite spot on campus or your go-to canteen order!
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-2xl"
            onClick={handleNext}
            disabled={!isStepValid() || isUploading}
          >
            {currentStep === STEPS.length - 1 ? (isEditing ? 'Save Changes' : 'Finish Profile') : 'Continue'}
            {currentStep < STEPS.length - 1 && <ChevronRight className="ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
