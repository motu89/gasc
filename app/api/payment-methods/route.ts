import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAdminPaymentMethods } from '@/lib/payment-config';
import { UserModel } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();

    const methods = await getAdminPaymentMethods();

    return NextResponse.json({
      user: {
        easyPaisaAccount: methods.easyPaisaAccount,
        jazzCashAccount: methods.jazzCashAccount,
      },
    });
  } catch (error) {
    console.error('Payment method fetch error:', error);
    return NextResponse.json(
      {
        user: {
          easyPaisaAccount: '',
          jazzCashAccount: '',
        },
      },
      { status: 200 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, easyPaisaAccount, jazzCashAccount } = body;

    if (!email) {
      return NextResponse.json({ error: 'Admin email is required.' }, { status: 400 });
    }

    await connectToDatabase();

    const adminUser = await UserModel.findOne({ email: email.toLowerCase().trim(), role: 'admin' });

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found.' }, { status: 404 });
    }

    adminUser.easyPaisaAccount = easyPaisaAccount?.trim() || '';
    adminUser.jazzCashAccount = jazzCashAccount?.trim() || '';
    await adminUser.save();

    return NextResponse.json({
      message: 'Payment methods updated successfully.',
      user: {
        easyPaisaAccount: adminUser.easyPaisaAccount || '',
        jazzCashAccount: adminUser.jazzCashAccount || '',
      },
    });
  } catch (error) {
    console.error('Payment method update error:', error);
    return NextResponse.json({ error: 'Unable to update payment methods.' }, { status: 500 });
  }
}
