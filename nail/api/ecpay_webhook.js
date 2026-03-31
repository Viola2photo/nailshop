const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    })
  });
}
const db = admin.firestore();
const appId = 'nail-inventory-app';
const adminUserId = 'MvkJo5e1kEcBS0fGGMr4RKdQjYg1';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const data = req.body;
  const HashKey = process.env.ECPAY_HASH_KEY || 'VZ0XSU4VbvmTeMsK';
  const HashIV = process.env.ECPAY_HASH_IV || 'wAFot8tTLMamEOBJ';

  const receivedMac = data.CheckMacValue;
  delete data.CheckMacValue;
  const keys = Object.keys(data).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  let raw = HashKey=;
  for (const key of keys) raw += &=;
  raw += &HashIV=;

  const urlEncoded = encodeURIComponent(raw).replace(/%20/g, '+').replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.').replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')').toLowerCase();
  const checkMac = crypto.createHash('sha256').update(urlEncoded).digest('hex').toUpperCase();

  if (receivedMac !== checkMac) return res.status(400).send('0|Error');

  if (data.RtnCode === '1') {
    const MerchantTradeNo = data.MerchantTradeNo;
    const orderRef = db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('orders').doc(MerchantTradeNo);
    const orderSnap = await orderRef.get();
    const existing = orderSnap.exists ? orderSnap.data() : {};

    const isCod = existing.isCod || data.CustomField4 === '貨到付款';
    const codNote = existing.codNote || data.CustomField4 || '';

    await orderRef.update({
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentType: data.PaymentType,
      tradeNo: data.TradeNo,
      isCod,
      codNote,
      ecpayRaw: data
    });
  }

  res.status(200).send('1|OK');
};
