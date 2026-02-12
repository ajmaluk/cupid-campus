import React from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import welcomeAnim from '../../assets/lottie/welcome.json';

interface WelcomeProps {
  name: string;
}

export const Welcome: React.FC<WelcomeProps> = ({ name }) => {
  return (
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
          Welcome to the club, <span className="text-primary font-bold">{name.split(' ')[0]}</span>.
          <br /> Your campus love story starts now.
        </p>
      </motion.div>
    </div>
  );
};
