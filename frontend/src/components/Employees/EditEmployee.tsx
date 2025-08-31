import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  Flex,
  Input,
  Text,
  VStack,
  Select,
} from "@chakra-ui/react"
import { useState } from "react"

import { type EmployeePublic, type EmployeeUpdate, EmployeesService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { Checkbox } from "../ui/checkbox"
import { AppModal } from "../ui/modal"
import { Field } from "../ui/field"

interface EditEmployeeProps {
  employee: EmployeePublic
}

const EditEmployee = ({ employee }: EditEmployeeProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: employee,
  })

  const mutation = useMutation({
    mutationFn: (data: EmployeeUpdate) =>
      EmployeesService.updateEmployee({ employeeId: employee.id, requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Employee updated successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
    },
  })

  const onSubmit: SubmitHandler<EmployeeUpdate> = (data) => {
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
        Edit Employee
      </Button>
      
      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit Employee"
        submitText="Update"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="lg"
      >
        <Text mb={4}>Update the employee details below.</Text>
        <VStack gap={4}>
          <Field
            required
            invalid={!!errors.employee_id}
            errorText={errors.employee_id?.message}
            label="Employee ID"
          >
            <Input
              id="employee_id"
              {...register("employee_id", {
                required: "Employee ID is required",
              })}
              placeholder="EMP001"
              type="text"
            />
          </Field>

          <Field
            required
            invalid={!!errors.cnic}
            errorText={errors.cnic?.message}
            label="CNIC"
          >
            <Input
              id="cnic"
              {...register("cnic", {
                required: "CNIC is required",
                pattern: {
                  value: /^\d{5}-\d{7}-\d$/,
                  message: "CNIC must be in format: 12345-1234567-1",
                },
              })}
              placeholder="12345-1234567-1"
              type="text"
            />
          </Field>

          <Field
            required
            invalid={!!errors.first_name}
            errorText={errors.first_name?.message}
            label="First Name"
          >
            <Input
              id="first_name"
              {...register("first_name", {
                required: "First name is required",
              })}
              placeholder="John"
              type="text"
            />
          </Field>

          <Field
            required
            invalid={!!errors.last_name}
            errorText={errors.last_name?.message}
            label="Last Name"
          >
            <Input
              id="last_name"
              {...register("last_name", {
                required: "Last name is required",
              })}
              placeholder="Doe"
              type="text"
            />
          </Field>

          <Field
            required
            invalid={!!errors.phone}
            errorText={errors.phone?.message}
            label="Phone"
          >
            <Input
              id="phone"
              {...register("phone", {
                required: "Phone is required",
                pattern: {
                  value: /^\+?[\d\s-]+$/,
                  message: "Please enter a valid phone number",
                },
              })}
              placeholder="+92 300 1234567"
              type="tel"
            />
          </Field>

          <Field
            invalid={!!errors.address}
            errorText={errors.address?.message}
            label="Address"
          >
            <Input
              id="address"
              {...register("address")}
              placeholder="123 Main Street, City"
              type="text"
            />
          </Field>

          <Field
            invalid={!!errors.date_of_birth}
            errorText={errors.date_of_birth?.message}
            label="Date of Birth"
          >
            <Input
              id="date_of_birth"
              {...register("date_of_birth")}
              type="date"
            />
          </Field>

          <Field
            required
            invalid={!!errors.hire_date}
            errorText={errors.hire_date?.message}
            label="Hire Date"
          >
            <Input
              id="hire_date"
              {...register("hire_date", {
                required: "Hire date is required",
              })}
              type="date"
            />
          </Field>

          <Field
            invalid={!!errors.salary}
            errorText={errors.salary?.message}
            label="Salary"
          >
            <Input
              id="salary"
              {...register("salary", {
                min: {
                  value: 0,
                  message: "Salary must be at least 0",
                },
              })}
              placeholder="50000"
              type="number"
              step="0.01"
            />
          </Field>

          <Field
            invalid={!!errors.emergency_contact_name}
            errorText={errors.emergency_contact_name?.message}
            label="Emergency Contact Name"
          >
            <Input
              id="emergency_contact_name"
              {...register("emergency_contact_name")}
              placeholder="Emergency contact name"
              type="text"
            />
          </Field>

          <Field
            invalid={!!errors.emergency_contact_phone}
            errorText={errors.emergency_contact_phone?.message}
            label="Emergency Contact Phone"
          >
            <Input
              id="emergency_contact_phone"
              {...register("emergency_contact_phone")}
              placeholder="+92 300 1234567"
              type="tel"
            />
          </Field>
        </VStack>

        <Flex mt={4} direction="column" gap={4}>
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <Field disabled={field.disabled} colorPalette="teal">
                <Checkbox
                  checked={field.value || false}
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

export default EditEmployee 