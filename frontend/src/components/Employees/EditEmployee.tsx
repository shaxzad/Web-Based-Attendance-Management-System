import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaEdit } from "react-icons/fa"

import { type EmployeeUpdate, EmployeesService, DepartmentsService } from "@/client"
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
import { Field } from "../ui/field"

interface EditEmployeeProps {
  employee: EmployeePublic
  isOpen?: boolean
  onClose?: () => void
}

const EditEmployee = ({ employee, isOpen: externalIsOpen, onClose }: EditEmployeeProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalIsOpen !== undefined ? (onClose || (() => {})) : setInternalIsOpen
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()

  // Fetch departments for the dropdown
  const { data: departmentsResponse } = useQuery({
    queryKey: ["departments"],
    queryFn: () => DepartmentsService.readDepartments({}),
  })
  
  const departments = departmentsResponse || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<EmployeeUpdate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      employee_id: employee.employee_id,
      cnic: employee.cnic,
      first_name: employee.first_name,
      last_name: employee.last_name,
      phone: employee.phone,
      address: employee.address || "",
      hire_date: employee.hire_date.split('T')[0],
      is_active: employee.is_active,
      emergency_contact_name: employee.emergency_contact_name || "",
      emergency_contact_phone: employee.emergency_contact_phone || "",
      department_id: employee.department_id,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: EmployeeUpdate) =>
      EmployeesService.updateEmployee({ 
        employeeId: employee.id,
        requestBody: data 
      }),
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

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button
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
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Update employee information.</Text>
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
                    required: "Employee ID is required.",
                    maxLength: {
                      value: 20,
                      message: "Employee ID must be less than 20 characters.",
                    },
                  })}
                  placeholder="Enter employee ID"
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
                    required: "CNIC is required.",
                    maxLength: {
                      value: 15,
                      message: "CNIC must be less than 15 characters.",
                    },
                  })}
                  placeholder="Enter CNIC number"
                  type="text"
                />
              </Field>

              <HStack gap={4} w="full">
                <Field
                  required
                  invalid={!!errors.first_name}
                  errorText={errors.first_name?.message}
                  label="First Name"
                >
                  <Input
                    id="first_name"
                    {...register("first_name", {
                      required: "First name is required.",
                      maxLength: {
                        value: 100,
                        message: "First name must be less than 100 characters.",
                      },
                    })}
                    placeholder="Enter first name"
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
                      required: "Last name is required.",
                      maxLength: {
                        value: 100,
                        message: "Last name must be less than 100 characters.",
                      },
                    })}
                    placeholder="Enter last name"
                    type="text"
                  />
                </Field>
              </HStack>

              <Field
                required
                invalid={!!errors.phone}
                errorText={errors.phone?.message}
                label="Phone"
              >
                <Input
                  id="phone"
                  {...register("phone", {
                    required: "Phone number is required.",
                    maxLength: {
                      value: 20,
                      message: "Phone number must be less than 20 characters.",
                    },
                  })}
                  placeholder="Enter phone number"
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
                  {...register("address", {
                    maxLength: {
                      value: 500,
                      message: "Address must be less than 500 characters.",
                    },
                  })}
                  placeholder="Enter address"
                  type="text"
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
                    required: "Hire date is required.",
                  })}
                  type="date"
                />
              </Field>



              <Field
                required
                invalid={!!errors.department_id}
                errorText={errors.department_id?.message}
                label="Department"
              >
                <select
                  id="department_id"
                  {...register("department_id", {
                    required: "Department is required.",
                  })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select department</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                invalid={!!errors.is_active}
                errorText={errors.is_active?.message}
                label="Employee Status"
              >
                <HStack gap={3} align="center">
                  <input
                    type="checkbox"
                    id="is_active"
                    {...register("is_active")}
                    defaultChecked={employee.is_active}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <Text fontSize="sm" color="gray.600">
                    Employee is active
                  </Text>
                </HStack>
              </Field>

              <HStack gap={4} w="full">
                <Field
                  invalid={!!errors.emergency_contact_name}
                  errorText={errors.emergency_contact_name?.message}
                  label="Emergency Contact Name"
                >
                  <Input
                    id="emergency_contact_name"
                    {...register("emergency_contact_name", {
                      maxLength: {
                        value: 100,
                        message: "Emergency contact name must be less than 100 characters.",
                      },
                    })}
                    placeholder="Enter emergency contact name"
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
                    {...register("emergency_contact_phone", {
                      maxLength: {
                        value: 20,
                        message: "Emergency contact phone must be less than 20 characters.",
                      },
                    })}
                    placeholder="Enter emergency contact phone"
                    type="tel"
                  />
                </Field>
              </HStack>
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
              colorPalette="primary"
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

export default EditEmployee 