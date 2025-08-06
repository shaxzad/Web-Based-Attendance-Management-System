import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { type ItemCreate, ItemsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
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

interface ItemCreateForm extends ItemCreate {
  confirm_title: string
}

const AddItem = () => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ItemCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      confirm_title: "",
      description: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: ItemCreate) =>
      ItemsService.createItem({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Item created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const onSubmit: SubmitHandler<ItemCreateForm> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <>
      <Button 
        value="add-item" 
        my={4}
        colorScheme="blue"
        onClick={() => setIsOpen(true)}
      >
        Add Item
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add Item"
        submitText="Add Item"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>
          Fill in the form below to add a new item to the system.
        </Text>
        <VStack gap={4}>
          <Field
            required
            invalid={!!errors.title}
            errorText={errors.title?.message}
            label="Title"
          >
            <Input
              id="title"
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 2,
                  message: "Title must be at least 2 characters",
                },
              })}
              placeholder="Item title"
              type="text"
            />
          </Field>

          <Field
            required
            invalid={!!errors.confirm_title}
            errorText={errors.confirm_title?.message}
            label="Confirm Title"
          >
            <Input
              id="confirm_title"
              {...register("confirm_title", {
                required: "Please confirm the title",
                validate: (value) =>
                  value === getValues().title ||
                  "The titles do not match",
              })}
              placeholder="Confirm item title"
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
              placeholder="Item description"
              type="text"
            />
          </Field>
        </VStack>
      </AppModal>
    </>
  )
}

export default AddItem
