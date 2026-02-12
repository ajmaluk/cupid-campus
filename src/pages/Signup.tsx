import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Loader2, Play } from 'lucide-react';
import { useSignup, STEPS } from '../hooks/useSignup';
import { PersonalDetails } from '../components/signup/PersonalDetails';
import { AcademicDetails } from '../components/signup/AcademicDetails';
import { AccountDetails } from '../components/signup/AccountDetails';
import { Verification } from '../components/signup/Verification';
import { Interests } from '../components/signup/Interests';
import { Welcome } from '../components/signup/Welcome';

export default function Signup() {
  const navigate = useNavigate();
  const {
    currentStep,
    setCurrentStep,
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
  } = useSignup();

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
        {/* Mobile Background Blobs - Static/Simplified to reduce lag */}
        <div className="md:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[80px] opacity-40" 
          />
          <div 
            className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[80px] opacity-40" 
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
              {currentStep === 0 && (
                <PersonalDetails formData={formData} updateForm={updateForm} />
              )}
              {currentStep === 1 && (
                <AcademicDetails formData={formData} updateForm={updateForm} />
              )}
              {currentStep === 2 && (
                <AccountDetails 
                  formData={formData} 
                  updateForm={updateForm} 
                  error={error} 
                  isCheckingUsername={isCheckingUsername} 
                />
              )}
              {currentStep === 3 && (
                <Verification 
                  email={formData.email}
                  otp={otp}
                  setOtp={setOtp}
                  resendTimer={resendTimer}
                  handleResend={handleResend}
                  onChangeEmail={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 4 && (
                <Interests interests={formData.interests} updateForm={updateForm} />
              )}
              {currentStep === 5 && (
                <Welcome name={formData.name} />
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
              onClick={currentStep === 5 ? () => navigate('/onboarding') : handleNext}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                currentStep === 5 ? (
                  <span className="flex items-center gap-2">
                    Get Started <Play size={20} fill="currentColor" />
                  </span>
                ) : (
                  currentStep === 2 ? 'Create Account' : (currentStep === 3 ? 'Verify & Continue' : 'Continue')
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
