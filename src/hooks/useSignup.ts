import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import { getApiUrl } from '../lib/utils';
import type { Profile } from '../types/index';

export const STEPS = ['Personal Details', 'Academic Info', 'Account', 'Verification', 'Interests', 'Welcome'];

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
  const { setCurrentUser, currentUser } = useStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState<SignupFormData>(INITIAL_FORM_DATA);
  const [resendTimer, setResendTimer] = useState(0);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [otpHash, setOtpHash] = useState('');

  // Timer for resend OTP
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
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
        const { data, error } = await supabase.rpc('check_username', { 
          username_to_check: formData.username.trim().toLowerCase() 
        });
          
        if (error) throw error;
        if (data === true) {
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
        return null;
      case 1: // Academic Info
        if (!formData.department) return "Department is required";
        if (!formData.major) return "Major is required";
        if (!formData.year) return "Year is required";
        return null;
      case 2: // Account
        if (!formData.username) return "Username is required";
        if (!formData.email) return "Email is required";
        if (!formData.email.endsWith('@cet.ac.in')) return "Must be a @cet.ac.in email";
        if (!formData.password) return "Password is required";
        if (formData.password.length < 6) return "Password must be at least 6 characters";
        if (formData.password !== formData.confirmPassword) return "Passwords do not match";
        return null;
      case 4: // Interests
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

    if (currentStep === 2) { // Account Step
      setLoading(true);
      try {
        const sanitizedUsername = formData.username.trim().toLowerCase();
        const sanitizedEmail = formData.email.trim().toLowerCase();

        // Check Username (Final Check)
      // Use RPC if available, or fallback to select if policy allows
      let usernameExists = false;
      
      try {
        const { data, error } = await supabase.rpc('check_username', { username_to_check: sanitizedUsername });
        if (!error && data !== null) {
          usernameExists = data;
        } else {
           // Fallback or error handling
           if (error) {
             console.error('RPC check_username error:', error);
             // If RPC fails (e.g. not created yet), try direct select (might fail due to RLS)
             const { data: existingUser, error: checkError } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', sanitizedUsername)
              .maybeSingle();
             
             if (!checkError && existingUser) usernameExists = true;
           }
        }
      } catch (err) {
        console.error("Username check failed", err);
      }

      if (usernameExists) {
        throw new Error('Username already taken');
      }

        // Send OTP via custom backend
        // Construct robust URL
        const fetchUrl = getApiUrl('/api/send-otp');
        console.log('Sending OTP to:', fetchUrl);

        const response = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sanitizedEmail }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send OTP');
        }

        const data = await response.json();
        if (data.hash) {
          setOtpHash(data.hash);
        }

        setResendTimer(60);
        setCurrentStep(prev => prev + 1);
      } catch (err: unknown) {
        console.error('Signup Error:', err);
        let message = 'An unexpected error occurred';
        if (err instanceof Error) {
          message = err.message;
          if (message === 'The string did not match the expected pattern.') {
             message = 'Invalid email or server configuration error';
          }
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 3) { // Verification Step
      if (!otp || otp.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        return;
      }
      setLoading(true);
      try {
        const sanitizedEmail = formData.email.trim().toLowerCase();
        
        // Verify OTP with custom backend
        const verifyUrl = getApiUrl('/api/verify-otp');

        const verifyResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sanitizedEmail, otp, hash: otpHash }),
        });

        if (!verifyResponse.ok) {
          const data = await verifyResponse.json();
          throw new Error(data.error || 'Verification failed');
        }

        // OTP Verified. Now create user in Supabase
        // Note: Supabase might still send a confirmation email.
        const sanitizedUsername = formData.username.trim().toLowerCase();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
        if (!signUpData.session) {
           console.warn("Session not created immediately. Email confirmation might be required.");
        }

        const userId = signUpData.user?.id;
        if (userId) {
          const profile: Profile = {
            id: userId,
            name: formData.name.trim(),
            username: sanitizedUsername,
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
          if (upsertError) {
             // If RLS prevents this, we might need to handle it. 
             // But for now, assuming user will handle Supabase side or RLS is open.
             console.error('Profile creation error:', upsertError);
             throw upsertError;
          }
          setCurrentUser(profile);
          setCurrentStep(prev => prev + 1);
        }
      } catch (err: unknown) {
        console.error('Verification Error:', err);
        const message = err instanceof Error ? err.message : 'Verification failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 4) { // Interests Step
      setLoading(true);
      try {
        if (!currentUser?.id) throw new Error("User not found");
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ interests: formData.interests })
          .eq('id', currentUser.id);

        if (updateError) throw updateError;
        
        // Update local state
        setCurrentUser({ ...currentUser, interests: formData.interests });
        setCurrentStep(prev => prev + 1);
      } catch (err: unknown) {
        console.error('Interest Update Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to update interests';
        setError(message);
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
      // Send OTP via custom backend
      const fetchUrl = getApiUrl('/api/send-otp');

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend code');
      }

      const data = await response.json();
      if (data.hash) {
        setOtpHash(data.hash);
      }

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
