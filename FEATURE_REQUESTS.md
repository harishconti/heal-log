# Feature Requests - Phone Integration

## User Requirements

The user has requested three advanced phone integration features:

### 1. **Contact Import**
- **Requirement**: Allow importing contacts from the device into the app as patients
- **Current Status**: Partially implemented - app can EXPORT patients to device contacts
- **Missing**: Reverse direction - importing device contacts as patients

### 2. **In-App Calling**
- **Requirement**: Make phone calls directly from within the app
- **Current Status**: Not implemented
- **Needed**: Integrate phone dialer functionality with patient phone numbers

### 3. **Replace Default Caller**  
- **Requirement**: App should be capable of replacing the actual phone app/caller ID on mobile
- **Current Status**: Not feasible - Android/iOS don't allow third-party apps to replace system dialer
- **Alternative**: Use CallKit (iOS) or Telecom Framework (Android) to show in-call UI

---

## Implementation Notes

### Contact Import Implementation

**Approach**:
1. Request contacts permission
2. Use Expo Contacts API to read device contacts
3. Show contacts list with checkbox selection
4. Create patient records from selected contacts

**Code Location**: `frontend/app/contacts-import.tsx` (new file)

**Dependencies**: 
- `expo-contacts` package
- Permission handling

---

### In-App Calling Implementation

**Approach**:
1. Add call button to patient details screen
2. Use React Native `Linking.openURL()` with `tel:` protocol
3. Optionally log call attempts in app database

**Code Location**: `frontend/app/patient/[id].tsx` (modify existing)

**Example**:
```typescript
import { Linking } from 'react-native';

const makeCall = (phoneNumber: string) => {
  Linking.openURL(`tel:${phoneNumber}`);
};
```

---

### Default Caller Replacement - NOT POSSIBLE

**Technical Limitations**:
- **Android**: Cannot replace default phone app without system-level access
- **iOS**: Cannot replace Phone app at all

**What IS Possible**:
1. **Caller ID Enhancement**: Show custom UI when patient calls (already implemented via contacts sync)
2. **In-Call Overlay**: Show patient info overlay during calls (requires CallKit on iOS, Telecom on Android)
3. **Call Logging**: Log all patient calls within the app

**Alternative Recommendation**:
Use **Call Screening** or **Call UI Overlay** instead of full replacement:
- Android: Use InCallService API
- iOS: Use CallKit framework

---

## Priority & Feasibility

| Feature | Priority | Feasibility | Estimated Effort |
|---------|----------|-------------|------------------|
| Contact Import | High | ✅ Easy | 4-6 hours |
| In-App Calling | High | ✅ Easy | 2-3 hours |
| Dialer Replacement | Low | ❌ Not Possible | N/A |
| Call UI Overlay (Alternative) | Medium | ⚠️ Complex | 20-30 hours |

---

## Next Steps

1. **Implement Contact Import**: Create new screen for importing device contacts
2. **Add Call Buttons**: Modify patient details to include call functionality
3. **Discuss Alternatives**: Explain dialer replacement limitations to user and propose call UI overlay as alternative

---

## Related Files

- `frontend/app/contacts-sync.tsx` - Current contact sync implementation
- `frontend/utils/phoneIntegration.ts` - Phone utility functions
- `frontend/app/patient/[id].tsx` - Patient details screen (add call button here)
