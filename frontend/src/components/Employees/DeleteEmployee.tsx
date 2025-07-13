import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaTrash } from "react-icons/fa"

import { EmployeesService } from "@/client"
import type { EmployeePublic } from "@/client/types.gen"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"

interface DeleteEmployeeProps {
  employee: EmployeePublic
}

const DeleteEmployee = ({ employee }: DeleteEmployeeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () =>
      EmployeesService.deleteEmployee({ employeeId: employee.id }),
    onSuccess: () => {
      showSuccessToast("Employee deleted successfully.")
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })

  const handleDelete = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "sm" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button
          variant="subtle"
          colorPalette="red"
          size="sm"
        >
          <FaTrash fontSize="14px" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Employee</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <VStack gap={4} textAlign="center">
            <Text>
              Are you sure you want to delete{" "}
              <strong>
                {employee.first_name} {employee.last_name}
              </strong>
              ?
            </Text>
            <Text fontSize="sm" color="gray.500">
              Employee ID: {employee.employee_id}
            </Text>
            <Text fontSize="sm" color="red.500">
              This action cannot be undone.
            </Text>
          </VStack>
        </DialogBody>

        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button
              variant="subtle"
              colorPalette="gray"
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            variant="solid"
            colorPalette="red"
            onClick={handleDelete}
            loading={mutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteEmployee 