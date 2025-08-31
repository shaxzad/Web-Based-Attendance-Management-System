import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { EmployeesService } from "@/client"
import { AppModal } from "@/components/ui/modal"
import useCustomToast from "@/hooks/useCustomToast"

const DeleteEmployee = ({ id }: { id: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteEmployee = async (id: string) => {
    await EmployeesService.deleteEmployee({ employeeId: id })
  }

  const mutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      showSuccessToast("The employee was deleted successfully")
      setIsOpen(false)
    },
    onError: () => {
      showErrorToast("An error occurred while deleting the employee")
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
        Delete Employee
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Delete Employee"
        submitText="Delete"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>
          Are you sure you want to delete this employee? This action cannot be undone.
        </Text>
      </AppModal>
    </>
  )
}

export default DeleteEmployee 