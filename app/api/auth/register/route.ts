import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { ensureAdminUser, errorResponse, serializeUser } from '@/lib/server-utils';
import { UserModel } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const payload = await request.json();
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();
    const role = payload.role;
    const phone = payload.phone?.trim();
    const address = payload.address?.trim();

    if (!name || !email || !password || !role) {
      return errorResponse('Name, email, password, and role are required.');
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return errorResponse('Please provide a valid email address.');
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters long.');
    }

    if (!['user', 'vendor', 'service_provider'].includes(role)) {
      return errorResponse('Invalid role selected.');
    }

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return errorResponse('User with this email already exists.', 409);
    }

    const user = await UserModel.create({
      name,
      email,
      passwordHash: hashPassword(password),
      role,
      phone,
      address,
    });

    return NextResponse.json({ user: serializeUser(user) }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Unable to register user right now.', 500);
  }
}
