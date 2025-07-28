import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { UsersService } from "@/client"
import { AppModal } from "@/components/ui/modal"
import useCustomToast from "@/hooks/useCustomToast"

const DeleteUser = ({ id, onClose }: { id: string; onClose?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteUser = async (id: string) => {
    await UsersService.deleteUser({ userId: id })
  }

  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      showSuccessToast("The user was deleted successfully")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("An error occurred while deleting the user")
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit = async () => {
    mutation.mutate(id)
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        colorScheme="red"
        onClick={() => setIsOpen(true)}
      >
        Delete User
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Delete User"
        submitText="Delete"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>
          All items associated with this user will also be{" "}
          <strong>permanently deleted.</strong> Are you sure? You will not
          be able to undo this action.
        </Text>
      </AppModal>
    </>
  )
}

export default DeleteUser
