import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { type UserCreate, UsersService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { emailPattern, handleError } from "@/utils"
import {
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { Checkbox } from "../ui/checkbox"
import { AppModal } from "../ui/modal"
import { Field } from "../ui/field"

interface UserCreateForm extends UserCreate {
  confirm_password: string
}

const AddUser = () => {
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
  } = useForm<UserCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      is_superuser: false,
      is_active: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserCreate) =>
      UsersService.createUser({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("User created successfully.")
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

  const onSubmit: SubmitHandler<UserCreateForm> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <>
      <Button 
        value="add-user" 
        my={4}
        colorScheme="blue"
        onClick={() => setIsOpen(true)}
      >
        Add User
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add User"
        submitText="Save"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>
          Fill in the form below to add a new user to the system.
        </Text>
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
            required
            invalid={!!errors.password}
            errorText={errors.password?.message}
            label="Set Password"
          >
            <Input
              id="password"
              {...register("password", {
                required: "Password is required",
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
            required
            invalid={!!errors.confirm_password}
            errorText={errors.confirm_password?.message}
            label="Confirm Password"
          >
            <Input
              id="confirm_password"
              {...register("confirm_password", {
                required: "Please confirm your password",
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

export default AddUser
