'use client';

import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';

import { cn } from '@/lib/utils';

type RotatingTextProps = {
  text: string;
  containerClassName?: string;
} & HTMLMotionProps<'div'>;

const RotatingText = ({
  text,
  className,
  containerClassName,
  ...props
}: RotatingTextProps) => {
  return (
    <div className={cn('relative w-fit h-5 overflow-hidden', containerClassName)}>
      <AnimatePresence>
        <motion.div
          key={text}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(className)}
          {...props}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export { RotatingText, type RotatingTextProps };
