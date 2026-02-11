import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStore } from '../store/useStore';
import { INTERESTS_LIST, DEPARTMENTS, MAJORS, YEARS, type Profile } from '../types';
import { ChevronRight, ChevronLeft, Loader2, Check, Lock, Edit2, Play, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Lottie from 'lottie-react';
import welcomeAnim from '../assets/lottie/welcome.json';

const STEPS = ['Personal Details', 'Account', 'Verification', 'Interests', 'Welcome'];

export default function Signup() {
  const navigate = useNavigate();
  const { setCurrentUser } = useStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '' as Profile['gender'] | '',
    interested_in: '' as Profile['interested_in'] | '',
    department: '',
    major: '',
    year: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    interests: [] as string[],
    photos: [] as string[],
    bio: ''
  });

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateForm = (key: keyof typeof formData, value: any) => {
    if (key === 'department') {
      setFormData(prev => ({ ...prev, [key]: value, major: '' }));
    } else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
    setError('');
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0: // Personal Details
        if (!formData.name) return "Name is required";
        if (!formData.dob) return "Date of Birth is required";
        if (!formData.gender) return "Please select your gender";
        if (!formData.interested_in) return "Please select who you're interested in";
        if (!formData.department) return "Department is required";
        if (!formData.major) return "Major is required";
        if (!formData.year) return "Year is required";
        return null;
      case 1: // Account
        if (!formData.username) return "Username is required";
        if (!formData.email) return "Email is required";
        if (!formData.email.endsWith('@cet.ac.in')) return "Must be a @cet.ac.in email";
        if (!formData.password) return "Password is required";
        if (formData.password.length < 6) return "Password must be at least 6 characters";
        if (formData.password !== formData.confirmPassword) return "Passwords do not match";
        return null;
      case 3: // Interests
        if (formData.interests.length < 3) return "Select at least 3 interests";
        return null;
      default:
        return null;
    }
  };

  const handleNext = async () => {
    // 1. Client-side Validation
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep === 1) { // Account Step Logic
      setLoading(true);
      try {
        // Check Username
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
          throw new Error('Username already taken');
        }

        // SignUp with Supabase (Sends Email OTP)
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              username: formData.username,
            }
          }
        });

        if (signUpError) throw signUpError;

        setResendTimer(60);
        setCurrentStep(prev => prev + 1);
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Signup Error:', err);
        const message = err?.message || err?.error_description || JSON.stringify(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 2) { // Verification Step Logic
      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        return;
      }
      setLoading(true);
      try {
        // Verify OTP (Signup Type)
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email: formData.email,
          token: otp,
          type: 'signup'
        });

        if (verifyError) throw verifyError;

        const userId = verifyData.user?.id;
        if (userId) {
          // Create Profile
          const profile: Profile = {
            id: userId,
            name: formData.name,
            username: formData.username,
            dob: formData.dob,
            age: calculateAge(formData.dob),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            gender: formData.gender as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            interested_in: formData.interested_in as any,
            department: formData.department,
            major: formData.major,
            course: `${formData.department} - ${formData.major}`,
            year: formData.year,
            bio: '',
            interests: formData.interests,
            photos: [],
            primary_photo: `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
            created_at: new Date().toISOString()
          };

          const { error: upsertError } = await supabase.from('profiles').upsert(profile);
          if (upsertError) throw upsertError;
          setCurrentUser(profile);
          setCurrentStep(prev => prev + 1);
        }
      } catch (err: any) {
        console.error('Verification Error:', err);
        const message = err?.message || 'Verification failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    } else {
      // Just move to next step for 0 and 3
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate('/');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      });
      
      if (error) throw error;

      setResendTimer(60);
    } catch (err: any) {
      console.error('Resend Error:', err);
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="min-h-screen w-full flex bg-background overflow-hidden">
      
      {/* Left Side - Brand & Visuals (Desktop Only) */}
      <div className="hidden md:flex w-1/2 relative bg-black/40 items-center justify-center overflow-hidden border-r border-white/5">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-40" 
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -45, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-purple-500/20 rounded-full blur-[120px] opacity-40" 
        />

        <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-xl">
           <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-tr from-primary to-purple-600 rounded-[40px] flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto transform rotate-12">
              <Play className="text-white w-16 h-16 fill-current" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl font-bold text-white mb-6 tracking-tight"
          >
            Join the Club
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-gray-300 leading-relaxed"
          >
            Create your profile, find your vibe, <br/>
            and connect with your campus.
          </motion.p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full md:w-1/2 relative flex flex-col items-center justify-center p-0 md:p-6 bg-background h-screen md:h-auto">
        {/* Mobile Background Blobs */}
        <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] opacity-60" 
          />
        </div>

        {/* Desktop Background Subtle Glow */}
        <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]" />
        </div>

        {/* Glass Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 w-full md:max-w-md h-full md:h-auto bg-black/40 md:bg-white/5 backdrop-blur-3xl md:backdrop-blur-2xl border-none md:border md:border-white/10 md:rounded-[40px] p-6 md:p-8 md:shadow-2xl relative overflow-hidden flex flex-col"
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

          {/* Header */}
          <div className="flex items-center gap-4 mb-8 mt-4 md:mt-0 z-10 shrink-0">
            <button onClick={handleBack} className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors active:scale-95 touch-manipulation">
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 flex gap-2">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i <= currentStep ? 'bg-primary shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10'
                  }`} 
                />
              ))}
            </div>
          </div>

          <div className="text-left md:text-center mb-8 px-2 shrink-0">
             <motion.h2 
               key={STEPS[currentStep]}
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="text-3xl md:text-2xl font-bold text-white tracking-tight"
             >
               {STEPS[currentStep]}
             </motion.h2>
             <p className="text-gray-400 mt-1">Step {currentStep + 1} of {STEPS.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 space-y-5 overflow-y-auto no-scrollbar pb-4"
            >
              {/* Step 1: Personal Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    value={formData.name}
                    onChange={e => updateForm('name', e.target.value)}
                    className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg"
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
                    <div className="relative">
                      <Input 
                        type="date" 
                        value={formData.dob}
                        onChange={e => updateForm('dob', e.target.value)}
                        className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg appearance-none"
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Male', 'Female', 'Non-binary', 'Other'].map(g => (
                        <button
                          key={g}
                          className={`p-4 rounded-2xl border text-sm font-bold transition-all touch-manipulation ${
                            formData.gender === g 
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                              : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 active:scale-95'
                          }`}
                          onClick={() => updateForm('gender', g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Interested in</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Male', 'Female', 'Everyone'].map(g => (
                        <button
                          key={g}
                          className={`p-4 rounded-2xl border text-sm font-bold transition-all touch-manipulation ${
                            formData.interested_in === g 
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                              : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 active:scale-95'
                          }`}
                          onClick={() => updateForm('interested_in', g)}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Academic Info</label>
                    <div className="relative group">
                       <select 
                         className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 px-4 text-white focus:border-primary/50 outline-none appearance-none transition-all group-hover:bg-black/30"
                         value={formData.department}
                         onChange={(e) => updateForm('department', e.target.value)}
                       >
                         <option value="">Select Department</option>
                         {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-gray-900">{d}</option>)}
                       </select>
                       <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
                    </div>
                    
                    <AnimatePresence>
                      {formData.department && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative group overflow-hidden">
                          <select 
                            className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 px-4 text-white focus:border-primary/50 outline-none appearance-none transition-all group-hover:bg-black/30"
                            value={formData.major}
                            onChange={(e) => updateForm('major', e.target.value)}
                          >
                            <option value="">Select Major</option>
                            {MAJORS[formData.department]?.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="relative group">
                      <select 
                        className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 px-4 text-white focus:border-primary/50 outline-none appearance-none transition-all group-hover:bg-black/30"
                        value={formData.year}
                        onChange={(e) => updateForm('year', e.target.value)}
                      >
                        <option value="">Select Year</option>
                        {YEARS.map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Account Credentials */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <Input 
                    placeholder="Username" 
                    value={formData.username}
                    onChange={e => updateForm('username', e.target.value)}
                    className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                  <Input 
                    type="email"
                    placeholder="College Email (@cet.ac.in)" 
                    value={formData.email}
                    onChange={e => updateForm('email', e.target.value)}
                    className="bg-black/20 border-white/10 h-14 rounded-2xl text-lg"
                    inputMode="email"
                    autoCapitalize="none"
                  />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input 
                      type="password"
                      placeholder="Password" 
                      className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all text-lg placeholder:text-gray-500"
                      value={formData.password}
                      onChange={e => updateForm('password', e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input 
                      type="password"
                      placeholder="Confirm Password" 
                      className="w-full bg-black/20 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white focus:border-primary/50 outline-none transition-all text-lg placeholder:text-gray-500"
                      value={formData.confirmPassword}
                      onChange={e => updateForm('confirmPassword', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Verification (OTP) */}
              {currentStep === 2 && (
                <div className="space-y-8 text-center py-4">
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-6"
                  >
                    <Check size={48} />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-white">Check your Inbox</h3>
                    <p className="text-gray-400 mt-2">
                      We sent a verification code to <br/>
                      <span className="text-white font-medium bg-white/10 px-2 py-1 rounded-md">{formData.email}</span>
                    </p>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="text-primary text-sm font-bold mt-4 flex items-center gap-1 mx-auto hover:text-primary/80 transition-colors"
                    >
                      <Edit2 size={14} /> Change Email
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input 
                      type="text"
                      placeholder="000000" 
                      autoFocus
                      className="w-full bg-black/20 border border-white/10 rounded-3xl py-6 text-center text-4xl tracking-[0.5em] text-white focus:border-primary/50 outline-none font-mono placeholder:text-gray-700 transition-all focus:bg-black/30"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                    <p className="text-xs text-gray-500">
                      Did not receive the code? <span 
                        className={`text-white cursor-pointer hover:underline ${resendTimer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleResend}
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Interests */}
              {currentStep === 3 && (
                <div className="space-y-6">
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
                              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all active:scale-95 touch-manipulation ${
                                selected
                                  ? 'bg-white text-black border-white shadow-lg scale-105'
                                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
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

              {/* Step 5: Welcome */}
              {currentStep === 4 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-6">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-72 h-72 mb-8"
                  >
                    <Lottie animationData={welcomeAnim} loop={true} />
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-4xl font-bold text-white mb-4">You're In! 🎉</h2>
                    <p className="text-gray-300 text-lg leading-relaxed max-w-xs mx-auto">
                      Welcome to the club, <span className="text-primary font-bold">{formData.name.split(' ')[0]}</span>.
                      <br /> Your campus love story starts now.
                    </p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm font-medium text-center shrink-0"
            >
              {error}
            </motion.div>
          )}

          <div className="mt-6 pt-4 border-t border-white/5 shrink-0 z-10 bg-inherit">
            <Button 
              className="w-full h-16 text-lg font-bold rounded-2xl bg-white text-black hover:bg-gray-100 transition-transform active:scale-95 disabled:opacity-50 disabled:scale-100"
              onClick={currentStep === 4 ? () => navigate('/onboarding') : handleNext}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                currentStep === 4 ? (
                  <span className="flex items-center gap-2">
                    Get Started <Play size={20} fill="currentColor" />
                  </span>
                ) : (
                  currentStep === 1 ? 'Create Account' : (currentStep === 2 ? 'Verify & Continue' : 'Continue')
                )
              )}
            </Button>
          </div>
        </motion.div>
        
        <div className="absolute bottom-6 text-center md:hidden z-20">
          <p className="text-gray-600 text-xs uppercase tracking-widest font-bold">Made with ❤️ for CET</p>
        </div>
      </div>
    </div>
  );
}
