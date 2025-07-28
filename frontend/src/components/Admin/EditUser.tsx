import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"

import { type UserPublic, type UserUpdate, UsersService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"
import { Checkbox } from "../ui/checkbox"
import { AppModal } from "../ui/modal"
import { Field } from "../ui/field"

interface EditUserProps {
  user: UserPublic
  onClose?: () => void
}

interface UserUpdateForm extends UserUpdate {
  confirm_password?: string
}

const EditUser = ({ user, onClose }: EditUserProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: user,
  })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateForm) =>
      UsersService.updateUser({ userId: user.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("User updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit: SubmitHandler<UserUpdateForm> = async (data) => {
    if (data.password === "") {
      data.password = undefined
    }
    mutation.mutate(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
    onClose?.()
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Edit User
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit User"
        submitText="Save"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>Update the user details below.</Text>
        <VStack gap={4}>
          <Field
            required
            invalid={!!errors.email}
            errorText={errors.email?.message}
            label="Email"
          >
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
            />
          </Field>

          <Field
            invalid={!!errors.full_name}
            errorText={errors.full_name?.message}
            label="Full Name"
          >
            <Input
              id="name"
              {...register("full_name")}
              placeholder="Full name"
              type="text"
            />
          </Field>

          <Field
            invalid={!!errors.password}
            errorText={errors.password?.message}
            label="Set Password"
          >
            <Input
              id="password"
              {...register("password", {
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              placeholder="Password"
              type="password"
            />
          </Field>

          <Field
            invalid={!!errors.confirm_password}
            errorText={errors.confirm_password?.message}
            label="Confirm Password"
          >
            <Input
              id="confirm_password"
              {...register("confirm_password", {
                validate: (value) =>
                  value === getValues().password ||
                  "The passwords do not match",
              })}
              placeholder="Password"
              type="password"
            />
          </Field>
        </VStack>

        <Flex mt={4} direction="column" gap={4}>
          <Controller
            control={control}
            name="is_superuser"
            render={({ field }) => (
              <Field disabled={field.disabled} colorPalette="teal">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={({ checked }) => field.onChange(checked)}
                >
                  Is superuser?
                </Checkbox>
              </Field>
            )}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Field disabled={field.disabled} colorPalette="teal">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={({ checked }) => field.onChange(checked)}
                >
                  Is active?
                </Checkbox>
              </Field>
            )}
          />
        </Flex>
      </AppModal>
    </>
  )
}

export default EditUser
