import { Button, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { AttendanceService } from "@/client"
import { AppModal } from "@/components/ui/modal"
import useCustomToast from "@/hooks/useCustomToast"
import type { ZKTecoDevicePublic } from "@/client/types.gen"

interface DeleteDeviceProps {
  device: ZKTecoDevicePublic
  isOpen: boolean
  onClose: () => void
}

const DeleteDevice = ({ device, isOpen, onClose }: DeleteDeviceProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm()

  const deleteDevice = async (deviceId: string) => {
    await AttendanceService.deleteZktecoDevice({ deviceId })
  }

  const mutation = useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      showSuccessToast(`Device "${device.device_name}" was deleted successfully`)
      onClose()
    },
    onError: () => {
      showErrorToast("An error occurred while deleting the device")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["zkteco-devices"] })
    },
  })

  const onSubmit = async () => {
    mutation.mutate(device.id)
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Device"
      submitText="Delete"
      cancelText="Cancel"
      onSubmit={handleSubmit(onSubmit)}
      isLoading={isSubmitting}
      size="md"
      submitButtonProps={{ colorScheme: "red" }}
    >
      <Text mb={4}>
        Are you sure you want to delete the device <strong>"{device.device_name}"</strong>?
      </Text>
      <Text mb={4} fontSize="sm" color="gray.600">
        Device IP: {device.device_ip}:{device.device_port}
      </Text>
      <Text fontSize="sm" color="red.600">
        This action cannot be undone and will remove all device configuration and sync history.
      </Text>
    </AppModal>
  )
}

export default DeleteDevice

