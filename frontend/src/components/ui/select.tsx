import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  children, 
  value, 
  onValueChange, 
  placeholder,
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <div ref={triggerRef}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === SelectTrigger) {
              return React.cloneElement(child as any, {
                onClick: () => setIsOpen(!isOpen),
                isOpen,
                selectedValue,
                placeholder
              });
            }
            if (child.type === SelectContent && isOpen) {
              return React.cloneElement(child as any, {
                onSelect: handleSelect
              });
            }
          }
          return child;
        })}
      </div>
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps & {
  onClick?: () => void;
  isOpen?: boolean;
  selectedValue?: string;
  placeholder?: string;
}> = ({ children, className, onClick, isOpen, selectedValue, placeholder }) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        isOpen && 'ring-2 ring-blue-500 border-blue-500',
        className
      )}
      onClick={onClick}
    >
      <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
        {selectedValue || placeholder}
      </span>
      <svg
        className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};

export const SelectContent: React.FC<SelectContentProps & {
  onSelect?: (value: string) => void;
}> = ({ children, className, onSelect }) => {
  return (
    <div className={cn(
      'absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto',
      className
    )}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child as any, {
            onSelect
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & {
  onSelect?: (value: string) => void;
}> = ({ children, value, className, onSelect }) => {
  return (
    <div
      className={cn(
        'px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        className
      )}
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, className }) => {
  return <span className={cn('text-gray-500', className)}>{placeholder}</span>;
}; 