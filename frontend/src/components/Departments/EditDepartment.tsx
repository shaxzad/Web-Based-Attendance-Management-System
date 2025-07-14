import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaEdit } from "react-icons/fa"

import { type DepartmentUpdate, DepartmentsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import type { DepartmentPublic } from "@/client/types.gen"
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
import { Field } from "../ui/field"

interface EditDepartmentProps {
  department: DepartmentPublic
  isOpen?: boolean
  onClose?: () => void
}

const EditDepartment = ({ department, isOpen: externalIsOpen, onClose }: EditDepartmentProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalIsOpen !== undefined ? (onClose || (() => {})) : setInternalIsOpen
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<DepartmentUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: department.name,
      description: department.description,
      is_active: department.is_active,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: DepartmentUpdate) =>
      DepartmentsService.updateDepartment({
        departmentId: department.id,
        requestBody: data,
      }),
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

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button
          value="edit-department"
          variant="subtle"
          colorPalette="blue"
          size="sm"
        >
          <FaEdit fontSize="14px" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update the department details.</Text>
            <VStack gap={4}>
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
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Update
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default EditDepartment 