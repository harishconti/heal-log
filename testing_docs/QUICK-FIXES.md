# Doctor Log - Quick Fix Code Snippets
**Copy-paste ready solutions for each issue**

---

## Fix #1: Smart Email Redirect (30 min)

### File: `frontend/app/register.tsx`

**FIND THIS:**
```typescript
catch (error: any) {
  Alert.alert('Registration Failed', error.message || 'An unexpected error occurred.');
}
```

**REPLACE WITH:**
```typescript
catch (error: any) {
  const errorMessage = error.message || 'An unexpected error occurred.';
  
  // Smart redirect for duplicate email
  if (errorMessage.toLowerCase().includes('email already exists') || 
      errorMessage.toLowerCase().includes('account with this email')) {
    Alert.alert(
      'Account Exists',
      'This email is already registered. Would you like to sign in instead?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        { text: 'Sign In', onPress: () => router.back(), style: 'default' }
      ]
    );
  } else {
    Alert.alert('Registration Failed', errorMessage);
  }
}
```

### File: `backend/app/api/auth.py`

**FIND THIS:**
```python
if existing_user:
    raise ValueError("An account with this email already exists.")
```

**REPLACE WITH:**
```python
if existing_user:
    raise APIException(
        status_code=status.HTTP_409_CONFLICT,
        detail="An account with this email already exists. Please sign in instead."
    )
```

---

## Fix #2: Name Field Validation (20 min)

### File: `frontend/lib/validation.ts`

**FIND THIS:**
```typescript
export const registerSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
```

**REPLACE WITH:**
```typescript
const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;

export const registerSchema = z.object({
  full_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .refine((name) => nameRegex.test(name), {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes"
    }),
```

Also update patientSchema similarly.

---

## Fix #4: Strong Password Requirements (1 hour)

### File: `frontend/lib/validation.ts`

**FIND THIS:**
```typescript
password: z.string().min(6, "Password must be at least 6 characters"),
```

**REPLACE WITH:**
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

password: z.string()
  .min(8, "Password must be at least 8 characters")
  .refine((password) => passwordRegex.test(password), {
    message: "Must contain uppercase, lowercase, number, and special character (@$!%*?&)"
  }),
```

---

## Fix #6: Error Message Mapper (1 hour)

### Create new file: `frontend/utils/errorMessages.ts`

```typescript
type ErrorContext = 'signup' | 'login' | 'add_patient' | 'reset_password';

const ERROR_MESSAGES: Record<string, Record<ErrorContext, string>> = {
  'email already exists': {
    signup: '📧 This email is already registered. Would you like to sign in instead?',
    login: 'Email not found',
    add_patient: 'Patient email already exists',
    reset_password: 'Email not found'
  },
  'invalid email format': {
    signup: '❌ Invalid email (e.g., user@gmail.com)',
    login: 'Invalid email',
    add_patient: 'Invalid email',
    reset_password: 'Invalid email'
  },
  'invalid email or password': {
    signup: 'N/A',
    login: '❌ Wrong email or password. Try again or reset password.',
    add_patient: 'N/A',
    reset_password: 'N/A'
  },
};

export const getErrorMessage = (errorText: string, context: ErrorContext): string => {
  const lowerError = errorText.toLowerCase();
  
  for (const [key, messages] of Object.entries(ERROR_MESSAGES)) {
    if (lowerError.includes(key)) {
      return messages[context];
    }
  }
  
  return '❌ Something went wrong. Try again.';
};
```

### Update: `frontend/app/register.tsx`

```typescript
import { getErrorMessage } from '@/utils/errorMessages';

const onSubmit = async (data: RegisterFormData) => {
  setIsLoading(true);
  try {
    await register({...data, medical_specialty: medicalSpecialty});
    router.replace('/');
  } catch (error: any) {
    const userMessage = getErrorMessage(error.message, 'signup');
    Alert.alert('Registration Failed', userMessage);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Fix #7: Remove Meaningless Icons (30 min)

### File: `frontend/app/register.tsx`

**DELETE THIS:**
```typescript
{/* Three social login icons */}
<View style={styles.iconRow}>
  <TouchableOpacity style={styles.iconButton}>
    <Ionicons name="logo-google" size={32} color="#4285F4" />
  </TouchableOpacity>
  {/* ... more icons ... */}
</View>
```

**REPLACE WITH:**
```typescript
{/* Why Choose Doctor Log */}
<View style={styles.featuresSection}>
  <Text style={styles.featuresTitle}>Why Choose Doctor Log?</Text>
  <View style={styles.featureItem}>
    <Ionicons name="people" size={24} color="#2ecc71" />
    <Text style={styles.featureName}>Easy Patient Management</Text>
  </View>
  <View style={styles.featureItem}>
    <Ionicons name="document-text" size={24} color="#2ecc71" />
    <Text style={styles.featureName}>Digital Records</Text>
  </View>
  <View style={styles.featureItem}>
    <Ionicons name="shield-checkmark" size={24} color="#2ecc71" />
    <Text style={styles.featureName}>HIPAA Compliant</Text>
  </View>
</View>
```

---

## Fix #8: Patient Form Validation (1 day)

### File: `frontend/lib/validation.ts`

```typescript
const indianPhoneRegex = /^[6-9]\d{9}$/;

const isValidDate = (dateString: string): boolean => {
  if (!dateString) return true;
  const date = new Date(dateString);
  const today = new Date();
  if (isNaN(date.getTime())) return false;
  if (date > today) return false;
  if (date.getFullYear() < today.getFullYear() - 150) return false;
  return true;
};

export const patientSchema = z.object({
  full_name: z.string()
    .min(2, "Name required")
    .max(50, "Name too long")
    .refine((name) => nameRegex.test(name), {
      message: "Name: letters, spaces, hyphens only"
    }),
  phone_number: z.string()
    .refine(val => !val || indianPhoneRegex.test(val), {
      message: "10 digits, start with 6-9"
    })
    .optional(),
  date_of_birth: z.string()
    .refine(val => !val || isValidDate(val), {
      message: "Invalid date"
    })
    .optional(),
  address: z.string().max(200, "Address too long").optional(),
});
```

---

## Fix #10: Network Timeout (1 hour)

### Create: `frontend/utils/apiClient.ts`

```typescript
const API_TIMEOUT = 30000; // 30 seconds

export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Check connection and retry.');
    }
    throw error;
  }
};
```

---

## Testing Commands

```bash
# Backend: Test duplicate email (expect 409)
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@test.com","password":"Test123!@"}'

# Backend: Test weak password
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"password":"weak"}'

# Frontend: Test name validation
# Try: "john@123", "@#$%", "x"
# Expected: All rejected with clear message

# Frontend: Test password strength
# Try: "pass123"
# Expected: Rejected - needs uppercase, special char
```

---

**For full implementations and more details, see DOCTOR-LOG-TESTING-REPORT.md**
