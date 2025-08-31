"use client"

import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';



export const useCustomToast = () => {
  const showToast = useCallback((title: string, message: string, type: ToastType = 'info', duration: number = 5000) => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 translate-x-full`;
    
    // Set border color based on type
    switch (type) {
      case 'success':
        toast.classList.add('border-green-500');
        break;
      case 'error':
        toast.classList.add('border-red-500');
        break;
      case 'warning':
        toast.classList.add('border-yellow-500');
        break;
      case 'info':
        toast.classList.add('border-blue-500');
        break;
    }

    // Set icon based on type
    let icon = '';
    switch (type) {
      case 'success':
        icon = '✓';
        break;
      case 'error':
        icon = '✕';
        break;
      case 'warning':
        icon = '⚠';
        break;
      case 'info':
        icon = 'ℹ';
        break;
    }

    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-lg">${icon}</span>
        </div>
        <div class="ml-3 w-0 flex-1">
          <p class="text-sm font-medium text-gray-900">${title}</p>
          <p class="mt-1 text-sm text-gray-500">${message}</p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);

    // Handle close button
    const closeButton = toast.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        removeToast(toast);
      });
    }

    // Auto remove after duration
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }, []);

  const removeToast = (toast: HTMLElement) => {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  const showSuccessToast = useCallback((message: string) => {
    showToast('Success', message, 'success');
  }, [showToast]);

  const showErrorToast = useCallback((message: string) => {
    showToast('Error', message, 'error');
  }, [showToast]);

  return { showToast, showSuccessToast, showErrorToast };
};

// Default export for backward compatibility
export default useCustomToast;
