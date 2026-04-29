import { apiRequest } from '@/lib/api-client';
import { User, UserRole } from '@/types';

export async function authenticateUser(email: string, password: string) {
  const response = await apiRequest<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return response.user;
}

export async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
}) {
  const response = await apiRequest<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

  return response.user;
}

