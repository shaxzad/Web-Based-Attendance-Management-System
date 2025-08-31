import React, { useState, useRef, useEffect } from "react"
import {
  IconButton,
  Box,
  VStack,
  Button,
  Portal,
} from "@chakra-ui/react"
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa"
import type { DepartmentPublic } from "@/client/types.gen"
import EditDepartment from "./EditDepartment"
import DeleteDepartment from "./DeleteDepartment"

interface DepartmentActionsProps {
  department: DepartmentPublic
}

const DepartmentActions = ({ department }: DepartmentActionsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
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

  const handleEditClick = () => {
    setIsOpen(false)
    setShowEditModal(true)
  }

  const handleDeleteClick = () => {
    setIsOpen(false)
    setShowDeleteModal(true)
  }

  return (
    <Box position="relative" ref={dropdownRef}>
      <IconButton
        aria-label="Department actions"
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
                onClick={handleEditClick}
              >
                <FaEdit fontSize="14px" />
                Edit Department
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
                Delete Department
              </Button>
            </VStack>
          </Box>
        </Portal>
      )}

      {/* Show modals when triggered */}
      {showEditModal && (
        <EditDepartment 
          department={department} 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
      
      {showDeleteModal && (
        <DeleteDepartment 
          department={department}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </Box>
  )
}

export default DepartmentActions 