import React, { useState, useRef, useEffect } from "react"
import {
  IconButton,
  Box,
  VStack,
  Button,
  Portal,
} from "@chakra-ui/react"
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa"
import type { ZKTecoDevicePublic } from "@/client/types.gen"
import DeleteDevice from "./DeleteDevice"

interface DeviceActionsProps {
  device: ZKTecoDevicePublic
  onViewDetails: () => void
}

const DeviceActions = ({ device, onViewDetails }: DeviceActionsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null)

  // Close dropdown when clicking outside both button and dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Open dropdown and set its position
  const handleButtonClick = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (next && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPos({
          top: rect.bottom + window.scrollY,
          left: rect.right - 150 + window.scrollX, // 150px is minW of dropdown
        })
      }
      return next
    })
  }

  const handleViewClick = () => {
    setIsOpen(false)
    onViewDetails()
  }

  const handleDeleteClick = () => {
    setIsOpen(false)
    setShowDeleteModal(true)
  }

  return (
    <Box position="relative" ref={dropdownRef}>
      <IconButton
        aria-label="Device actions"
        variant="ghost"
        size="sm"
        colorPalette="gray"
        _hover={{ bg: "gray.100" }}
        onClick={handleButtonClick}
        ref={buttonRef}
      >
        <FaEllipsisV fontSize="14px" />
      </IconButton>

      {isOpen && dropdownPos && (
        <Portal>
          <Box
            ref={dropdownRef}
            position="fixed"
            top={dropdownPos.top}
            left={dropdownPos.left}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="lg"
            zIndex={9999}
            minW="150px"
          >
            <VStack gap={0} align="stretch">
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                gap={2}
                borderRadius="0"
                _hover={{ bg: "blue.50" }}
                onClick={handleViewClick}
              >
                <FaEdit fontSize="14px" />
                View Details
              </Button>
              <Button
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                gap={2}
                borderRadius="0"
                _hover={{ bg: "red.50" }}
                onClick={handleDeleteClick}
              >
                <FaTrash fontSize="14px" />
                Delete Device
              </Button>
            </VStack>
          </Box>
        </Portal>
      )}

      {/* Show delete modal when triggered */}
      {showDeleteModal && (
        <DeleteDevice 
          device={device}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </Box>
  )
}

export default DeviceActions

