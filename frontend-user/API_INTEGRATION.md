# Frontend-User API Integration Guide

## Setup Instructions

### 1. Environment Configuration
The frontend is configured to connect to the backend at `http://localhost:8080`. If your backend runs on a different port, update the `.env.local` file:

```
VITE_API_URL=http://localhost:8080
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. Backend API Configuration
The backend should be running on `http://localhost:8080` with the following endpoints:

**Authentication:**
- POST `/api/auth/login` - Login with email and password
- POST `/api/auth/register` - Register new user
- PUT `/api/auth/change-password` - Change password
- POST `/api/auth/forgot-password` - Request password reset

**Menu:**
- GET `/api/menu` - Get all menu items
- GET `/api/menu/{id}` - Get specific menu item

**Reservations:**
- POST `/api/reservation` - Create new reservation
- GET `/api/reservation` - Get all reservations
- GET `/api/reservation/{id}` - Get specific reservation
- POST `/api/reservation/{id}/cancel` - Cancel reservation

## Features Implemented

### 1. Authentication Service
- Login with email/password
- User registration
- Automatic token storage in localStorage
- JWT token handling
- Password change and forgot password support

### 2. Menu Service
- Fetch all menu items from backend
- Fallback to mock data if API fails
- Real-time menu updates

### 3. Reservation Service
- Create new reservations
- View reservation history
- Cancel reservations
- Form validation

### 4. API Client Utility
- Centralized HTTP client using Fetch API
- Automatic JWT token injection
- Error handling and logging
- Consistent error response format

## Testing

### Manual Testing Steps

1. **Test Registration:**
   - Navigate to `/register`
   - Fill in name, email, and password
   - Click "Đăng ký"
   - Should redirect to login page on success

2. **Test Login:**
   - Navigate to `/login`
   - Use registered email and password
   - Click "Đăng nhập"
   - Should redirect to home page on success

3. **Test Menu:**
   - Navigate to `/menu`
   - Menu items should load from backend
   - Should show loading state while fetching
   - Should display all menu items with categories

4. **Test Booking:**
   - Navigate to `/booking`
   - Fill in reservation form (name, phone, date, time, guests)
   - Click "Xác nhận đặt bàn"
   - Should show success/error message

## API Error Handling

The application handles various error scenarios:
- Network errors - Shows user-friendly error message
- API errors - Displays error message from server
- Validation errors - Shows field-level validation messages
- Loading states - Disables form inputs while processing

## Troubleshooting

### API Connection Issues
If you see "Đăng nhập thất bại" or connection errors:
1. Check if backend is running on port 8080
2. Verify `VITE_API_URL` in `.env.local` matches your backend URL
3. Check browser console for specific error messages
4. Verify CORS is properly configured in backend

### Token Issues
If you're logged in but getting 401 errors:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page and login again
3. Check if backend is returning valid JWT tokens

### Menu Not Loading
If menu shows "Using mock data as fallback":
1. Check if backend menu endpoint is working
2. Verify user is authenticated if required
3. Check browser console for network errors

## Project Structure

```
frontend-user/src/
├── config/
│   └── api.ts                 # API endpoints and config
├── context/
│   └── AuthContext.tsx        # Authentication state
├── services/
│   ├── authService.ts         # Auth API calls
│   ├── menuService.ts         # Menu API calls
│   ├── reservationService.ts  # Reservation API calls
│   └── mockMenu.ts            # Mock menu data fallback
├── types/
│   ├── auth.ts                # Auth types
│   └── menu.ts                # Menu types
├── utils/
│   ├── apiClient.ts           # HTTP client utility
│   └── validation.ts          # Form validation
├── pages/                      # Page components
├── component/                  # Reusable components
├── hooks/                      # Custom React hooks
└── App.tsx                     # Main app component
```

## Next Steps

1. Test all API connections thoroughly
2. Handle edge cases and error scenarios
3. Add loading skeletons for better UX
4. Implement session persistence
5. Add request retry logic for failed requests
