import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"

import { useState } from "react"

import { type EmployeeCreate, EmployeesService, DepartmentsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { AppModal } from "../ui/modal"
import { Field } from "../ui/field"

const AddEmployee = () => {
  const [isOpen, setIsOpen] = useState(false)
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
    formState: { errors, isSubmitting },
  } = useForm<EmployeeCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      employee_id: "",
      cnic: "",
      first_name: "",
      last_name: "",
      phone: "",
      address: "",
      hire_date: new Date().toISOString().split('T')[0],
      is_active: true,
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  })

  const mutation = useMutation({
    mutationFn: (data: EmployeeCreate) =>
      EmployeesService.createEmployee({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Employee created successfully.")
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

  const onSubmit: SubmitHandler<EmployeeCreate> = (data) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  return (
    <>
      <Button
        value="add-employee"
        my={4}
        colorScheme="primary"
        variant="solid"
        size="lg"
        fontWeight="bold"
        onClick={() => setIsOpen(true)}
      >
        Add Employee
      </Button>

      <AppModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add Employee"
        submitText="Add Employee"
        cancelText="Cancel"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        size="lg"
      >
        <VStack gap={4} align="stretch">
          <Text color="gray.600" fontSize="sm">
            Fill in the details to add a new employee.
          </Text>
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
          </VStack>
        </AppModal>
      </>
    )
}

export default AddEmployee 