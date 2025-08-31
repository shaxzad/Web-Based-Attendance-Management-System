import React from 'react';
import { cn } from '@/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ 
  className, 
  ...props 
}) => {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}; 