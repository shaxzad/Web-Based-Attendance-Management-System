import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type DepartmentPublic, type DepartmentUpdate, DepartmentsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  Button,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { AppModal } from "../ui/modal"
import { Field } from "../ui/field"

interface EditDepartmentProps {
  department: DepartmentPublic
}

const EditDepartment = ({ department }: EditDepartmentProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: department,
  })

  const mutation = useMutation({
    mutationFn: (data: DepartmentUpdate) =>
      DepartmentsService.updateDepartment({ departmentId: department.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Department updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
    },
  })

  const onSubmit: SubmitHandler<DepartmentUpdate> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Edit Department
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit Department"
        submitText="Update"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>Update the department details below.</Text>
        <VStack gap={4}>
          <Field
            required
            invalid={!!errors.name}
            errorText={errors.name?.message}
            label="Name"
          >
            <Input
              id="name"
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              placeholder="Department name"
              type="text"
            />
          </Field>

          <Field
            invalid={!!errors.description}
            errorText={errors.description?.message}
            label="Description"
          >
            <Input
              id="description"
              {...register("description")}
              placeholder="Department description"
              type="text"
            />
          </Field>
        </VStack>
      </AppModal>
    </>
  )
}

export default EditDepartment 