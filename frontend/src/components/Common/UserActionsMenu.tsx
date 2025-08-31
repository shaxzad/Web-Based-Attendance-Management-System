import { IconButton } from "@chakra-ui/react"
import { BsThreeDotsVertical } from "react-icons/bs"
import { useState } from "react"
import { MenuContent, MenuRoot, MenuTrigger, MenuItem } from "../ui/menu"

import type { UserPublic } from "@/client"
import DeleteUser from "../Admin/DeleteUser"
import EditUser from "../Admin/EditUser"

interface UserActionsMenuProps {
  user: UserPublic
  disabled?: boolean
}

export const UserActionsMenu = ({ user, disabled }: UserActionsMenuProps) => {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleEditClick = () => {
    setShowEditModal(true)
    // Close menu after a short delay to allow the modal to open
    setTimeout(() => {
      const menuButton = document.querySelector('[data-menu-trigger]') as HTMLElement
      if (menuButton) {
        menuButton.click()
      }
    }, 100)
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
    // Close menu after a short delay to allow the modal to open
    setTimeout(() => {
      const menuButton = document.querySelector('[data-menu-trigger]') as HTMLElement
      if (menuButton) {
        menuButton.click()
      }
    }, 100)
  }

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <IconButton 
            variant="ghost" 
            color="inherit" 
            disabled={disabled}
            data-menu-trigger
          >
            <BsThreeDotsVertical />
          </IconButton>
        </MenuTrigger>
        <MenuContent>
          <MenuItem value="edit" onClick={handleEditClick}>
            Edit User
          </MenuItem>
          <MenuItem value="delete" onClick={handleDeleteClick}>
            Delete User
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      {/* Render modals outside menu context */}
      {showEditModal && (
        <EditUser 
          user={user} 
          onClose={() => setShowEditModal(false)}
        />
      )}
      
      {showDeleteModal && (
        <DeleteUser 
          id={user.id} 
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  )
}
