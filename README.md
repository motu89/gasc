# City Marketplace Platform

A multi-functional platform for city-based renting, selling, and service booking built with Next.js.

## Features

- ✅ Product listing for rent, sale, and installment
- ✅ Booking of skilled services
- ✅ Secure login/registration for users, vendors, and skilled persons
- ✅ Admin dashboard for approvals and user management
- ✅ Search/filtering, cart, and order management system
- ✅ Frontend-only (no backend required)
- ✅ Mock authentication (works immediately)

## Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Run Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## Login Instructions

The project uses **mock authentication** - you can login with any credentials!

1. Go to `/auth/login` or click "Login" in the navbar
2. Enter any email (e.g., `test@example.com`)
3. Enter any password (e.g., `password123`)
4. **Select your role** from the dropdown:
   - **User** → Redirects to home page
   - **Vendor** → Redirects to vendor dashboard
   - **Service Provider** → Redirects to provider dashboard
   - **Admin** → Redirects to admin dashboard
5. Click "Sign in"
6. You'll be automatically redirected to the appropriate dashboard!

## Available Pages

- `/` - Home page with featured products and services
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/products` - Browse all products with search & filters
- `/products/[id]` - Product detail page
- `/services` - Browse all services
- `/services/[id]` - Service detail with booking calendar
- `/cart` - Shopping cart
- `/admin/dashboard` - Admin dashboard (approvals, user management)
- `/vendor/dashboard` - Vendor dashboard (product management)
- `/provider/dashboard` - Service provider dashboard (bookings)

## Project Structure

- `/app` - Next.js 14 App Router pages
- `/components` - Reusable React components
- `/lib` - Utility functions and stores (Zustand)
- `/types` - TypeScript type definitions
- `/public` - Static assets

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** React Icons
- **Notifications:** React Hot Toast
- **Date Picker:** React DatePicker

## Notes

- This is a **frontend-only** implementation
- Authentication is **mocked** (no backend required)
- All data is **mock data** (replace with API calls when connecting backend)
- Images use placeholder gradients (add real images when ready)

