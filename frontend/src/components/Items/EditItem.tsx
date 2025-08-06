import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ItemPublic, type ItemUpdate, ItemsService } from "@/client"
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

interface EditItemProps {
  item: ItemPublic
}

const EditItem = ({ item }: EditItemProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: item,
  })

  const mutation = useMutation({
    mutationFn: (data: ItemUpdate) =>
      ItemsService.updateItem({ id: item.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Item updated successfully.")
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

  const onSubmit: SubmitHandler<ItemUpdate> = (data) => {
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
        Edit Item
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit Item"
        submitText="Update"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="md"
      >
        <Text mb={4}>Update the item details below.</Text>
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

export default EditItem
