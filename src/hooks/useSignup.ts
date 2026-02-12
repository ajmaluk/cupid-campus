import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import type { Profile } from '../types/index';

export const STEPS = ['Personal Details', 'Account', 'Verification', 'Interests', 'Welcome'];

export interface SignupFormData {
  name: string;
  dob: string;
  gender: Profile['gender'] | '';
  interested_in: Profile['interested_in'] | '';
  department: string;
  major: string;
  year: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  interests: string[];
  photos: string[];
  bio: string;
}

const INITIAL_FORM_DATA: SignupFormData = {
  name: '',
  dob: '',
  gender: '',
  interested_in: '',
  department: '',
  major: '',
  year: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  interests: [],
  photos: [],
  bio: ''
};

export function useSignup() {
  const navigate = useNavigate();
  const { setCurrentUser } = useStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState<SignupFormData>(INITIAL_FORM_DATA);
  const [resendTimer, setResendTimer] = useState(0);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Debounced username check
  useEffect(() => {
    const checkUsername = async () => {
      if (!formData.username || formData.username.length < 3) return;
      
      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username.trim().toLowerCase())
          .maybeSingle();
          
        if (error) throw error;
        if (data) {
          setError('Username already taken');
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

  const updateForm = useCallback(<K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) => {
    if (key === 'department') {
      setFormData(prev => ({ ...prev, [key]: value, major: '' }));
    } else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
    setError('');
  }, []);

  const calculateAge = (dob: string) => {
    const birthday = new Date(dob);
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const validateStep = (step: number): string | null => {
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
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep === 1) { // Account Step
      setLoading(true);
      try {
        const sanitizedUsername = formData.username.trim().toLowerCase();
        const sanitizedEmail = formData.email.trim().toLowerCase();

        // Check Username (Final Check)
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', sanitizedUsername)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
          throw new Error('Username already taken');
        }

        // SignUp with Supabase
        const { error: signUpError } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name.trim(),
              username: sanitizedUsername,
            }
          }
        });

        if (signUpError) throw signUpError;

        setResendTimer(60);
        setCurrentStep(prev => prev + 1);
      } catch (err: unknown) {
        console.error('Signup Error:', err);
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        // Handle Supabase specific error structure if needed (often comes as { message: ... } or { error_description: ... })
        const supabaseError = err as { message?: string, error_description?: string };
        const detailedMessage = supabaseError?.message || supabaseError?.error_description || message;
        
        let friendlyMessage = detailedMessage;
        if (friendlyMessage.includes('User already registered')) {
          friendlyMessage = 'User already registered. Please Login instead.';
        } else if (friendlyMessage.includes('Password should be')) {
          friendlyMessage = 'Password is too weak.';
        }

        setError(friendlyMessage);
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 2) { // Verification Step
      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        return;
      }
      setLoading(true);
      try {
        const sanitizedEmail = formData.email.trim().toLowerCase();
        
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email: sanitizedEmail,
          token: otp,
          type: 'signup'
        });

        if (verifyError) throw verifyError;

        const userId = verifyData.user?.id;
        if (userId) {
          const profile: Profile = {
            id: userId,
            name: formData.name.trim(),
            username: formData.username.trim().toLowerCase(),
            dob: formData.dob,
            age: calculateAge(formData.dob),
            gender: formData.gender as Profile['gender'],
            interested_in: formData.interested_in as Profile['interested_in'],
            department: formData.department,
            major: formData.major,
            course: `${formData.department} - ${formData.major}`,
            year: formData.year,
            bio: '',
            interests: formData.interests,
            photos: [],
            primary_photo: `https://ui-avatars.com/api/?name=${formData.name.trim()}&background=random`,
            created_at: new Date().toISOString()
          };

          const { error: upsertError } = await supabase.from('profiles').upsert(profile);
          if (upsertError) throw upsertError;
          setCurrentUser(profile);
          setCurrentStep(prev => prev + 1);
        }
      } catch (err: unknown) {
        console.error('Verification Error:', err);
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message.includes('Token has expired') ? 'Code expired. Please Resend.' : message);
      } finally {
        setLoading(false);
      }
    } else {
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
    } catch (err: unknown) {
      console.error('Resend Error:', err);
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    setCurrentStep, // Exposed if needed
    loading,
    error,
    otp,
    setOtp,
    formData,
    updateForm,
    handleNext,
    handleBack,
    handleResend,
    resendTimer,
    isCheckingUsername
  };
}
