import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { ensureAdminUser, errorResponse, serializeUser } from '@/lib/server-utils';
import { UserModel } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const payload = await request.json();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password?.trim();

    if (!email || !password) {
      return errorResponse('Email and password are required.');
    }

    const user = await UserModel.findOne({ email });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return errorResponse('Invalid email or password.', 401);
    }

    return NextResponse.json({ user: serializeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Unable to login right now.', 500);
  }
}
