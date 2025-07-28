import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { DepartmentsService } from "@/client"
import { AppModal } from "@/components/ui/modal"
import useCustomToast from "@/hooks/useCustomToast"

const DeleteDepartment = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteDepartment = async (id: string) => {
    await DepartmentsService.deleteDepartment({ departmentId: id })
  }

  const mutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      showSuccessToast("The department was deleted successfully")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("An error occurred while deleting the department")
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
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        colorScheme="red"
        onClick={() => setIsOpen(true)}
      >
        Delete Department
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Delete Department"
        submitText="Delete"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>
          Are you sure you want to delete this department? This action cannot be undone.
        </Text>
      </AppModal>
    </>
  )
}

export default DeleteDepartment 