'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps, type Transition } from 'motion/react';

import {
  SlidingNumber,
  type SlidingNumberProps,
} from '@/components/animate-ui/text/sliding-number';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CounterProps = HTMLMotionProps<'div'> & {
  number: number;
  setNumber: (number: number) => void;
  slidingNumberProps?: Omit<SlidingNumberProps, 'number'>;
  buttonProps?: Omit<React.ComponentProps<typeof Button>, 'onClick'>;
  transition?: Transition;
};

function Counter({
  number,
  setNumber,
  className,
  slidingNumberProps,
  buttonProps,
  transition = { type: 'spring', bounce: 0, stiffness: 300, damping: 30 },
  ...props
}: CounterProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(String(number));
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditing) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      setNumber(number + 1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      setNumber(number - 1);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleInputBlur = () => {
    const newNumber = parseInt(inputValue, 10);
    if (!isNaN(newNumber)) {
      setNumber(newNumber);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Prevent implicit form submission (Enter in a text input submits the nearest form by default)
      event.preventDefault();
      handleInputBlur();
    } else if (event.key === 'Escape') {
      setInputValue(String(number));
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(String(number));
    }
  }, [number, isEditing]);

  return (
    <motion.div
      data-slot="counter"
      layout
      tabIndex={0}
      onKeyDown={handleKeyDown}
      transition={transition}
      className={cn(
        'flex items-center justify-between w-full p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className,
      )}
      {...props}
    >
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="button"
          size="icon"
          {...buttonProps}
          onClick={() => setNumber(number - 1)}
          className={cn(
            'bg-white dark:bg-neutral-950 hover:bg-white/70 dark:hover:bg-neutral-950/70 text-neutral-950 dark:text-white text-2xl font-light pb-[3px]',
            buttonProps?.className,
          )}
        >
          -
        </Button>
      </motion.div>

      <div
        className="relative h-8 flex-grow flex items-center justify-center cursor-text"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full text-center bg-transparent text-lg focus:outline-none"
          />
        ) : (
          <SlidingNumber
            number={number}
            {...slidingNumberProps}
            className={cn('text-lg', slidingNumberProps?.className)}
          />
        )}
      </div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          type="button"
          size="icon"
          {...buttonProps}
          onClick={() => setNumber(number + 1)}
          className={cn(
            'bg-white dark:bg-neutral-950 hover:bg-white/70 dark:hover:bg-neutral-950/70 text-neutral-950 dark:text-white text-2xl font-light pb-[3px]',
            buttonProps?.className,
          )}
        >
          +
        </Button>
      </motion.div>
    </motion.div>
  );
}


export { Counter, type CounterProps };
