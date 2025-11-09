# Component Documentation

This document provides information about the reusable React Native components in the Clinic OS Lite frontend.

## `ControlledInput`

A wrapper around `TextInput` that integrates with `react-hook-form`.

**Location:** `frontend/components/forms/ControlledInput.tsx`

**Props:**
*   `control`: `Control<any>` - The `control` object from `react-hook-form`.
*   `name`: `string` - The name of the form field.
*   `label`: `string` (optional) - The label to display above the input.
*   `error`: `string` (optional) - The error message to display below the input.
*   ...and all other `TextInputProps`.

**Usage:**
```tsx
<ControlledInput
  control={control}
  name="name"
  label="Full Name"
  placeholder="Enter patient's full name"
  error={errors.name?.message}
/>
```

## `PatientForm`

A comprehensive form for creating and editing patient records.

**Location:** `frontend/components/forms/PatientForm.tsx`

**Props:**
*   `mode`: `'create' | 'edit'` - The mode of the form.
*   `initialData`: `Partial<PatientFormValues>` (optional) - The initial data for the form.
*   `onSubmit`: `(data: PatientFormValues) => Promise<void>` - The function to call when the form is submitted.
*   `onCancel`: `() => void` - The function to call when the cancel button is pressed.
*   `loading`: `boolean` (optional) - Whether the form is in a loading state.
*   `submitButtonText`: `string` (optional) - The text to display on the submit button.

**Usage:**
```tsx
<PatientForm
  mode="create"
  onSubmit={async (data) => {
    // Handle form submission
  }}
  onCancel={() => {
    // Handle form cancellation
  }}
/>
```

## `Button`

A reusable button component with theming, haptic feedback, and multiple variants.

**Location:** `frontend/components/ui/Button.tsx`

**Props:**
*   `title`: `string` - The text to display on the button.
*   `onPress`: `() => void` - The function to call when the button is pressed.
*   `variant`: `'primary' | 'secondary' | 'outline' | 'danger' | 'success'` (optional) - The button style variant.
*   `size`: `'small' | 'medium' | 'large'` (optional) - The button size.
*   `disabled`: `boolean` (optional) - Whether the button is disabled.
*   `loading`: `boolean` (optional) - Whether to show a loading spinner.
*   `icon`: `keyof typeof Ionicons.glyphMap` (optional) - The name of the icon to display.
*   `iconPosition`: `'left' | 'right'` (optional) - The position of the icon.
*   `style`: `ViewStyle` (optional) - Custom styles for the button container.
*   `textStyle`: `TextStyle` (optional) - Custom styles for the button text.
*   `hapticFeedback`: `boolean` (optional) - Whether to trigger haptic feedback on press.

**Usage:**
```tsx
<Button
  title="Save Changes"
  onPress={() => {
    // Handle button press
  }}
  variant="primary"
  loading={isSaving}
/>
```

## `SkeletonLoader`

A component that displays a shimmering placeholder while content is loading.

**Location:** `frontend/components/ui/SkeletonLoader.tsx`

**Props:**
*   `width`: `number | string` (optional) - The width of the skeleton loader.
*   `height`: `number` (optional) - The height of the skeleton loader.
*   `borderRadius`: `number` (optional) - The border radius of the skeleton loader.
*   `style`: `any` (optional) - Custom styles for the skeleton loader.

**Usage:**
```tsx
<SkeletonLoader width={200} height={20} />
```
