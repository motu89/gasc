# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Login Flow

### Test Login Credentials
You can login with any email and password (mock authentication). Select your role from the dropdown:

- **User**: Regular customer (redirects to home page)
- **Vendor**: Product seller (redirects to vendor dashboard)
- **Service Provider**: Service provider (redirects to provider dashboard)
- **Admin**: Administrator (redirects to admin dashboard)

### Steps to Test:
1. Go to `/auth/login`
2. Enter any email (e.g., `test@example.com`)
3. Enter any password (e.g., `password123`)
4. Select your role from the dropdown
5. Click "Sign in"
6. You'll be redirected to the appropriate dashboard based on your role

## Available Pages

- `/` - Home page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/products` - Product listing
- `/products/[id]` - Product detail
- `/services` - Service listing
- `/services/[id]` - Service detail with booking
- `/cart` - Shopping cart
- `/admin/dashboard` - Admin dashboard
- `/vendor/dashboard` - Vendor dashboard
- `/provider/dashboard` - Service provider dashboard

## Features

✅ Frontend-only implementation
✅ Mock authentication (no backend required)
✅ Role-based routing
✅ Responsive design
✅ Modern UI with Tailwind CSS


