/**
 * Advanced Animations with Framer Motion
 *
 * SALESFORCE: Static, clunky, no animations (feels like 2010)
 * LEADLAB: Smooth, delightful animations (feels like 2025)
 *
 * This is what polish looks like!
 */

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode } from 'react';

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// Scale animations
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const scaleUp: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// Slide animations
export const slideInLeft: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

export const slideInRight: Variants = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export const slideInUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

export const slideInDown: Variants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
};

// List animations
export const staggerList: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
  exit: { opacity: 0 },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// Special effects
export const bounce: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15,
    },
  },
  exit: { scale: 0, opacity: 0 },
};

export const shake: Variants = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};

export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// ============================================================================
// ANIMATION COMPONENTS
// ============================================================================

interface AnimatedProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Fade in animation
export function FadeIn({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in up animation
export function FadeInUp({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale in animation
export function ScaleIn({ children, className, delay = 0 }: AnimatedProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger list animation
interface StaggerListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerList({ children, className, staggerDelay = 0.05 }: StaggerListProps) {
  return (
    <motion.div
      variants={staggerList}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: AnimatedProps) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// MODAL/DIALOG ANIMATIONS
// ============================================================================

interface ModalAnimationProps {
  children: ReactNode;
  className?: string;
}

export function ModalAnimation({ children, className }: ModalAnimationProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// NOTIFICATION ANIMATIONS
// ============================================================================

export function NotificationAnimation({ children, className }: AnimatedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// CARD HOVER ANIMATIONS
// ============================================================================

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  lift?: number;
}

export function HoverCard({ children, className, scale = 1.02, lift = -4 }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{
        scale,
        y: lift,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// BUTTON ANIMATIONS
// ============================================================================

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function AnimatedButton({ children, onClick, className, disabled }: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export function LoadingDots({ className }: { className?: string }) {
  const dotVariants = {
    animate: (i: number) => ({
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.1,
      },
    }),
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          custom={i}
          variants={dotVariants}
          animate="animate"
          className="w-2 h-2 bg-current rounded-full"
        />
      ))}
    </div>
  );
}

export function LoadingSpinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={className}
      style={{ width: size, height: size }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </motion.div>
  );
}

// ============================================================================
// SUCCESS/ERROR ANIMATIONS
// ============================================================================

export function SuccessCheckmark({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      <motion.circle
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </motion.svg>
  );
}

export function ErrorX({ className }: { className?: string }) {
  return (
    <motion.svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    >
      <motion.circle
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        d="M16 16 36 36 M36 16 16 36"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </motion.svg>
  );
}

// ============================================================================
// NUMBER COUNTER ANIMATION
// ============================================================================

interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
  format?: (value: number) => string;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 1,
  className,
  format = (v) => Math.round(v).toString(),
}: CounterProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ value: from }}
        animate={{ value: to }}
        transition={{ duration, ease: 'easeOut' }}
      >
        {({ value }: any) => format(value)}
      </motion.span>
    </motion.span>
  );
}

// ============================================================================
// PROGRESS BAR ANIMATION
// ============================================================================

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  barClassName?: string;
  animated?: boolean;
}

export function AnimatedProgressBar({
  progress,
  className,
  barClassName,
  animated = true,
}: ProgressBarProps) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full bg-blue-500 rounded-full ${barClassName}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
      />
    </div>
  );
}

// ============================================================================
// SCROLL REVEAL ANIMATION
// ============================================================================

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// SKELETON LOADER WITH ANIMATION
// ============================================================================

export function AnimatedSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gray-200 rounded ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
