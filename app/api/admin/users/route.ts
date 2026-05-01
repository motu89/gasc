import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ensureAdminUser, errorResponse } from '@/lib/server-utils';
import { UserModel } from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = {};
    if (role) {
      query = { role };
    }

    const users = await UserModel.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return errorResponse('Unable to load users.', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const adminUser = await ensureAdminUser();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return errorResponse('User ID is required.', 400);
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return errorResponse('User not found.', 404);
    }

    // Prevent admin from deleting themselves
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    if (user.email === adminEmail.toLowerCase()) {
      return errorResponse('You cannot delete your own account.', 400);
    }

    await UserModel.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return errorResponse('Unable to delete user.', 500);
  }
}
