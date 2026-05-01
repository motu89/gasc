import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    await connectToDatabase()

    const empty = { user: { easyPaisaAccount: '', jazzCashAccount: '' } }

    if (!userId && !email) {
      return NextResponse.json(empty)
    }

    let user = null

    if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase().trim() }).select('easyPaisaAccount jazzCashAccount role')
    } else if (userId) {
      // Strategy 1: Try by MongoDB _id (vendorId stored in products is the user's _id)
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await UserModel.findById(userId).select('easyPaisaAccount jazzCashAccount role')
      }
      // Strategy 2: If not found by _id, try by email (in case userId is an email)
      if (!user) {
        user = await UserModel.findOne({ email: userId.toLowerCase().trim() }).select('easyPaisaAccount jazzCashAccount role')
      }
    }

    // Always return 200 — modal handles the "no payment methods" case gracefully
    if (!user) {
      return NextResponse.json(empty)
    }

    // If found but no payment methods set, still return empty so modal shows friendly message
    if (user.role !== 'vendor' && user.role !== 'service_provider') {
      return NextResponse.json(empty)
    }

    return NextResponse.json({
      user: {
        easyPaisaAccount: user.easyPaisaAccount || '',
        jazzCashAccount: user.jazzCashAccount || '',
      },
    })
  } catch (error) {
    console.error('Payment method fetch error:', error);
    // Still return 200 with empty so the modal opens instead of crashing
    return NextResponse.json({ user: { easyPaisaAccount: '', jazzCashAccount: '' } })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, easyPaisaAccount, jazzCashAccount } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
    }

    if (!easyPaisaAccount && !jazzCashAccount) {
      return NextResponse.json(
        { error: 'At least one payment method is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let user = null
    if (email) {
      user = await UserModel.findOne({ email })
    } else if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await UserModel.findById(userId)
      }
      if (!user) {
        user = await UserModel.findOne({ email: userId })
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'vendor' && user.role !== 'service_provider') {
      return NextResponse.json(
        { error: 'Only vendors and service providers can set payment methods' },
        { status: 403 }
      );
    }

    user.easyPaisaAccount = easyPaisaAccount || user.easyPaisaAccount;
    user.jazzCashAccount = jazzCashAccount || user.jazzCashAccount;
    await user.save();

    return NextResponse.json({
      message: 'Payment methods updated successfully',
      user: {
        easyPaisaAccount: user.easyPaisaAccount || '',
        jazzCashAccount: user.jazzCashAccount || '',
      },
    });
  } catch (error) {
    console.error('Payment method update error:', error);
    return NextResponse.json(
      { error: 'Unable to update payment methods' },
      { status: 500 }
    );
  }
}
