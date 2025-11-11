# Documentation

This document provides detailed information about the Clinic OS Lite API endpoints and reusable React Native components.

## API Documentation

This document provides detailed information about the Clinic OS Lite API endpoints.

### Authentication

#### `POST /api/auth/register`

Registers a new user and returns an access token, refresh token, and user info.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "your_password",
  "full_name": "New User Name",
  "phone": "(555) 555-1234",
  "medical_specialty": "General Practice"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": "new_user_id",
    "email": "newuser@example.com",
    "full_name": "New User Name",
    "phone": "(555) 555-1234",
    "medical_specialty": "General Practice",
    "role": "DOCTOR",
    "plan": "BASIC",
    "subscription_status": "TRIALING",
    "subscription_end_date": "YYYY-MM-DDTHH:MM:SS.ffffff+00:00"
  }
}
```

#### `POST /api/auth/login`

Authenticates a user and returns an access token and a refresh token.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "token_type": "bearer"
}
```

#### `POST /api/auth/refresh`

Refreshes an expired access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token"
}
```

**Response:**
```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "token_type": "bearer"
}
```

#### `GET /api/auth/me`

Retrieves the currently authenticated user's information.

**Authentication:** Bearer Token

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "DOCTOR",
  "plan": "PRO"
}
```

### Users

#### `POST /api/users/`

Creates a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "new_password",
  "full_name": "New User"
}
```

**Response:**
```json
{
  "id": "new_user_id",
  "email": "newuser@example.com",
  "full_name": "New User"
}
```

#### `GET /api/users/me`

Retrieves the currently authenticated user's profile.

**Authentication:** Bearer Token

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "DOCTOR",
  "plan": "PRO"
}
```

### Patients

#### `POST /api/patients/`

Creates a new patient.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "123-456-7890",
  "email": "john.doe@example.com",
  "address": "123 Main St",
  "location": "Clinic",
  "initial_complaint": "Headache",
  "initial_diagnosis": "Migraine",
  "group": "general"
}
```

**Response:** The created patient object.

#### `GET /api/patients/`

Retrieves a list of patients for the current user.

**Authentication:** Bearer Token

**Response:** A list of patient objects.

#### `GET /api/patients/{patient_id}`

Retrieves a specific patient by ID.

**Authentication:** Bearer Token

**Response:** The requested patient object.

#### `PUT /api/patients/{patient_id}`

Updates a specific patient by ID.

**Authentication:** Bearer Token

**Request Body:** The fields to update.

**Response:** The updated patient object.

#### `DELETE /api/patients/{patient_id}`

Deletes a specific patient by ID.

**Authentication:** Bearer Token

**Response:**
```json
{
  "message": "Patient deleted successfully"
}
```

### Clinical Notes

#### `POST /api/patients/{patient_id}/notes`

Creates a new clinical note for a patient.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "content": "Patient is feeling better."
}
```

**Response:** The created clinical note object.

#### `GET /api/patients/{patient_id}/notes`

Retrieves a list of clinical notes for a patient.

**Authentication:** Bearer Token

**Response:** A list of clinical note objects.

### Sync

#### `POST /api/sync/pull`

Pulls changes from the server since the last sync.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "last_pulled_at": "timestamp"
}
```

**Response:**
```json
{
  "changes": {
    "patients": { "created": [], "updated": [], "deleted": [] },
    "clinical_notes": { "created": [], "updated": [], "deleted": [] }
  },
  "timestamp": "new_timestamp"
}
```

#### `POST /api/sync/push`

Pushes local changes to the server.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "changes": {
    "patients": { "created": [], "updated": [], "deleted": [] },
    "clinical_notes": { "created": [], "updated": [], "deleted": [] }
  }
}
```

**Response:**
```json
{
  "status": "success"
}
```

## Component Documentation

This document provides information about the reusable React Native components in the Clinic OS Lite frontend.

### `ControlledInput`

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

### `PatientForm`

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

### `Button`

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

### `SkeletonLoader`

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
