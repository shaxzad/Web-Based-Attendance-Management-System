# Development Rules - Component-Based Architecture

## 🎯 **Core Principles**

### ✅ **Component-Based Architecture**
- Use reusable components from `@/components/ui/`
- Create new components in appropriate directories
- Follow consistent naming conventions
- Avoid custom CSS when possible

### ✅ **Chakra UI First Approach**
- Use Chakra UI components as the primary UI library
- Leverage Chakra UI's built-in styling system
- Use theme tokens for colors, spacing, and typography
- Avoid custom CSS unless absolutely necessary

## 📋 **Component Usage Rules**

### ✅ **DO:**
- ✅ Use `AppModal` for all modal dialogs
- ✅ Use `AppTable` for all data tables
- ✅ Use `Field` component for form inputs
- ✅ Use `Checkbox` component for checkboxes
- ✅ Use `Button` with proper variants and color schemes
- ✅ Use `Badge` for status indicators
- ✅ Use `HStack`/`VStack` for layouts
- ✅ Use `Box` for containers and spacing

### ❌ **DON'T:**
- ❌ Don't use custom dialog systems (DialogRoot, DialogContent, etc.)
- ❌ Don't use custom table implementations
- ❌ Don't use React Icons (use text or Chakra UI icons)
- ❌ Don't write custom CSS for common UI patterns
- ❌ Don't create one-off components for standard UI elements

## 🏗️ **Component Structure**

### **Modal Components:**
```tsx
// ✅ CORRECT - Use AppModal
import { AppModal } from '@/components/ui/modal';

<AppModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  submitText="Save"
  cancelText="Cancel"
  onSubmit={handleSubmit}
  isLoading={isLoading}
  size="md"
>
  {/* Modal content */}
</AppModal>
```

### **Table Components:**
```tsx
// ✅ CORRECT - Use AppTable
import { AppTable, createAvatarColumn, createStatusColumn } from '@/components/ui/table';

const columns = [
  { key: 'id', label: '#' },
  createAvatarColumn('name', 'Employee Name'),
  { key: 'cnic', label: 'CNIC' },
  { key: 'phone', label: 'Phone' },
  { key: 'department', label: 'Department' },
  createStatusColumn('status', 'Status'),
  createActionsColumn('actions', 'Actions', <ActionButtons />),
];

<AppTable
  data={employees}
  columns={columns}
  isLoading={isLoading}
  searchPlaceholder="Search employees..."
  onSearchChange={handleSearch}
  filterOptions={departmentOptions}
  onFilterChange={handleFilter}
/>
```

### **Form Components:**
```tsx
// ✅ CORRECT - Use Field component
import { Field } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';

<Field required label="Name">
  <Input {...register("name")} />
</Field>

<Field>
  <Checkbox checked={isActive} onCheckedChange={setIsActive}>
    Is Active
  </Checkbox>
</Field>
```

## 🎨 **Styling Guidelines**

### **Colors:**
- Use Chakra UI color tokens: `blue.500`, `green.500`, `red.500`
- Use semantic colors: `primary`, `success`, `error`
- Avoid hardcoded hex colors

### **Spacing:**
- Use Chakra UI spacing tokens: `gap={4}`, `p={6}`, `m={2}`
- Use consistent spacing: 2, 4, 6, 8, 12, 16, 24

### **Typography:**
- Use Chakra UI text components: `Text`, `Heading`
- Use consistent font sizes: `sm`, `md`, `lg`, `xl`

## 📁 **File Organization**

### **Component Structure:**
```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── modal.tsx         # AppModal component
│   │   ├── table.tsx         # AppTable component
│   │   ├── field.tsx         # Field component
│   │   └── checkbox.tsx      # Checkbox component
│   ├── Admin/                # Admin-specific components
│   ├── Departments/          # Department components
│   ├── Employees/            # Employee components
│   ├── Devices/              # Device components
│   └── Items/                # Item components
```

## 🔧 **Modal Best Practices**

### **Centering and Z-Index:**
- Modals should always be centered on screen
- Use high z-index values (9998, 9999) to ensure visibility
- Use backdrop with proper opacity
- Ensure modal content is properly positioned

### **Modal Sizes:**
- `sm`: 400px max width (simple forms)
- `md`: 600px max width (standard forms)
- `lg`: 800px max width (complex forms)
- `xl`: 1000px max width (detailed views)

## 📊 **Table Best Practices**

### **Consistent Structure:**
- Use `AppTable` for all data tables
- Define columns with proper types
- Use helper functions for common column types
- Include search and filter functionality
- Handle loading and empty states

### **Column Types:**
- Text columns: Simple data display
- Avatar columns: User/employee information
- Status columns: Status badges
- Action columns: Action buttons/menus

## 🚀 **Benefits**

### **Consistency:**
- All modals look and behave the same
- All tables have consistent styling
- Unified user experience across the application

### **Maintainability:**
- Single source of truth for modal behavior
- Easy to update styling globally
- Reduced code duplication

### **Developer Experience:**
- Clear patterns to follow
- Reusable components
- Type-safe implementations

## 🔍 **Code Review Checklist**

### **Modal Components:**
- [ ] Uses `AppModal` instead of custom dialog
- [ ] Proper z-index and centering
- [ ] Consistent button styling
- [ ] Proper loading states
- [ ] Form validation handled correctly

### **Table Components:**
- [ ] Uses `AppTable` instead of custom table
- [ ] Proper column definitions
- [ ] Search and filter functionality
- [ ] Loading and empty states
- [ ] Responsive design

### **General:**
- [ ] No React Icons imports
- [ ] Uses Chakra UI components
- [ ] Consistent spacing and colors
- [ ] Proper TypeScript types
- [ ] Follows naming conventions

## 📝 **Migration Guide**

### **Converting Custom Modals:**
1. Replace `DialogRoot`/`DialogContent` with `AppModal`
2. Update imports to use `@/components/ui/modal`
3. Convert form submission to use `onSubmit` prop
4. Update button styling to match Chakra UI
5. Test modal centering and z-index

### **Converting Custom Tables:**
1. Replace custom table with `AppTable`
2. Define columns using the column interface
3. Use helper functions for common column types
4. Add search and filter functionality
5. Handle loading and empty states

---

**Remember: Always use component-based architecture with Chakra UI first approach!** 