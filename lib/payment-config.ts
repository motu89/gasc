import { UserModel } from '@/models/User';

export async function getAdminPaymentMethods() {
  const admin = await UserModel.findOne({ role: 'admin' }).select(
    'easyPaisaAccount jazzCashAccount email'
  );

  return {
    adminEmail: admin?.email || process.env.ADMIN_EMAIL || '',
    easyPaisaAccount: admin?.easyPaisaAccount || '',
    jazzCashAccount: admin?.jazzCashAccount || '',
  };
}
