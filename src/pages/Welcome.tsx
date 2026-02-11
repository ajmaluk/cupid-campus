import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { Button } from '../components/ui/Button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';

// Import animations directly to ensure they bundle correctly
import welcomeAnim from '../assets/lottie/welcome.json';
import findAnim from '../assets/lottie/find.json';
import planAnim from '../assets/lottie/plan.json';
import enjoyAnim from '../assets/lottie/enjoy.json';

const SLIDES = [
  {
    id: 'welcome',
    animation: welcomeAnim,
    title: "Welcome to CeeEeTea",
    description: "The exclusive dating community for College of Engineering Trivandrum.",
    bg: "from-purple-900/40 to-black"
  },
  {
    id: 'find',
    animation: findAnim,
    title: "Find Your Match",
    description: "Swipe right on profiles that catch your eye. We use smart algorithms to match you with your campus cutie.",
    bg: "from-pink-900/40 to-black"
  },
  {
    id: 'plan',
    animation: planAnim,
    title: "Plan The Date",
    description: "Matched? Great! Chat instantly and plan your meet-up at the canteen or library.",
    bg: "from-blue-900/40 to-black"
  },
  {
    id: 'enjoy',
    animation: enjoyAnim,
    title: "Create Memories",
    description: "Go out, have fun, and make college life unforgettable. Your story starts here.",
    bg: "from-green-900/40 to-black"
  }
];

export default function Welcome() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/discover');
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
        {/* Background Gradient Transition */}
        <motion.div
          animate={{ background: `linear-gradient(to bottom, ${SLIDES[currentSlide].bg.split(' ')[0].replace('from-', '')}, #000)` }} // Simplified dynamic bg for demo, relying on Tailwind classes usually needs full strings
          className={`absolute inset-0 bg-gradient-to-b ${SLIDES[currentSlide].bg} transition-colors duration-700`}
        />

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center max-w-md w-full"
            >
              <div className="w-64 h-64 mb-8 drop-shadow-2xl">
                <Lottie 
                  animationData={SLIDES[currentSlide].animation} 
                  loop={true}
                  className="w-full h-full"
                />
              </div>

              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                {SLIDES[currentSlide].title}
              </h1>
              
              <p className="text-lg text-gray-300 leading-relaxed font-medium">
                {SLIDES[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Controls */}
        <div className="p-8 relative z-10">
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <motion.div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-gray-700'
                }`}
                layout
              />
            ))}
          </div>

          <div className="flex justify-between items-center w-full">
            <div className="flex justify-start min-w-[80px]">
              {currentSlide > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  className="pl-0 hover:bg-transparent text-gray-400 hover:text-white"
                >
                  <ChevronLeft size={24} /> Back
                </Button>
              )}
            </div>
            
            <div className="flex justify-end min-w-[80px]">
              <Button 
                onClick={handleNext} 
                className="rounded-full shadow-xl shadow-primary/20 px-8"
              >
                {currentSlide === SLIDES.length - 1 ? (
                  <span className="flex items-center gap-2">
                    Get Started <ChevronRight size={20} />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Next <ChevronRight size={20} />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
