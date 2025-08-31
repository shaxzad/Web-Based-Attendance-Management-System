
import {
  Button,
  Text,

  HStack,
  Box,
} from '@chakra-ui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  onSubmit?: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AppModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  onSubmit,
  isLoading = false,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { maxW: '400px' };
      case 'lg':
        return { maxW: '800px' };
      case 'xl':
        return { maxW: '1000px' };
      default:
        return { maxW: '600px' };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={9998}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
      >
        {/* Modal Content */}
        <Box
          bg="white"
          borderRadius="xl"
          boxShadow="2xl"
          w="full"
          maxH="90vh"
          overflow="hidden"
          position="relative"
          transform="translateZ(0)"
          {...getSizeStyles()}
        >
          {/* Header */}
          <Box
            px={6}
            py={4}
            borderBottom="1px solid"
            borderColor="gray.200"
            position="relative"
            bg="white"
          >
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {title}
            </Text>
            <Button
              position="absolute"
              top={2}
              right={2}
              variant="ghost"
              size="sm"
              onClick={onClose}
              _hover={{ bg: "gray.100" }}
              zIndex={1}
            >
              ✕
            </Button>
          </Box>

          {/* Body */}
          <Box
            px={6}
            py={4}
            maxH="60vh"
            overflowY="auto"
            bg="white"
          >
            {children}
          </Box>

          {/* Footer */}
          {(onSubmit || cancelText) && (
            <Box
              px={6}
              py={4}
              borderTop="1px solid"
              borderColor="gray.200"
              bg="gray.50"
            >
              <HStack justify="end" gap={3}>
                <Button variant="ghost" onClick={onClose}>
                  {cancelText}
                </Button>
                {onSubmit && (
                  <Button
                    colorScheme="blue"
                    onClick={onSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : submitText}
                  </Button>
                )}
              </HStack>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}; 