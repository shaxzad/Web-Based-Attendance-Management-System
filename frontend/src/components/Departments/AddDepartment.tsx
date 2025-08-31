import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"

import { type DepartmentCreate, DepartmentsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { AppModal } from "../ui/modal"
import { Field } from "../ui/field"

const AddDepartment = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<DepartmentCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: DepartmentCreate) =>
      DepartmentsService.createDepartment({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Department created successfully.")
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

  const onSubmit: SubmitHandler<DepartmentCreate> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <>
      <Button
        value="add-department"
        my={4}
        colorScheme="primary"
        variant="solid"
        size="lg"
        fontWeight="bold"
        onClick={() => setIsOpen(true)}
      >
        Add Department
      </Button>

      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add Department"
        submitText="Add Department"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <VStack gap={4} align="stretch">
          <Text color="gray.600" fontSize="sm">
            Fill in the details to add a new department.
          </Text>
          
          <Field
            required
            invalid={!!errors.name}
            errorText={errors.name?.message}
            label="Department Name"
          >
            <Input
              id="name"
              {...register("name", {
                required: "Department name is required.",
                maxLength: {
                  value: 100,
                  message: "Department name must be less than 100 characters.",
                },
              })}
              placeholder="Enter department name"
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
              {...register("description", {
                maxLength: {
                  value: 255,
                  message: "Description must be less than 255 characters.",
                },
              })}
              placeholder="Enter department description"
              type="text"
            />
          </Field>
        </VStack>
      </AppModal>
    </>
  )
}

export default AddDepartment 