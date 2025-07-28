import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { UsersService } from "@/client"
import { AppModal } from "@/components/ui/modal"
import useCustomToast from "@/hooks/useCustomToast"

const DeleteConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteUser = async () => {
    await UsersService.deleteUserMe()
  }

  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      showSuccessToast("Your account has been deleted successfully")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("An error occurred while deleting your account")
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit = async () => {
    mutation.mutate()
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        colorScheme="red"
        onClick={() => setIsOpen(true)}
      >
        Delete Account
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Confirmation Required"
        submitText="Delete Account"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>
          Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
        </Text>
      </AppModal>
    </>
  )
}

export default DeleteConfirmation
