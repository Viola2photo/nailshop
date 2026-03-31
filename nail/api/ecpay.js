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

  try {
    const body = req.body;
    const items = body.items || [];
    const discountCode = (body.promoCode || '').toUpperCase().trim();
    const paymentMethod = body.paymentMethod || 'ALL';
    const isCod = body.isCod === true;
    const codNote = body.codNote || (isCod ? '貨到付款' : '一般付款');

    if (!Array.isArray(items) || items.length === 0) return res.status(400).send('購物車無效');

    let backendSubtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const doc = await db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('inventory').doc(item.id).get();
      if (!doc.exists) return res.status(400).send('商品不存在');
      const p = doc.data();
      backendSubtotal += p.price * item.quantity;
      orderItems.push({ productId: item.id, name: p.name, size: item.size, quantity: item.quantity, price: p.price });
    }

    let discountAmount = 0;
    const PROMO_CODES = {
      VIP9: { type: 'percent', value: 0.9 },
      SAVE100: { type: 'minus', value: 100 },
      NEWOPEN: { type: 'percent', value: 0.85 },
      KOL_VIOLA: { type: 'percent', value: 0.95 }
    };

    if (PROMO_CODES[discountCode]) {
      const promo = PROMO_CODES[discountCode];
      if (promo.type === 'percent') discountAmount = Math.round(backendSubtotal * (1 - promo.value));
      else if (promo.type === 'minus') discountAmount = promo.value;
    }

    const shippingFee = backendSubtotal >= 1000 ? 0 : 65;
    const finalTotal = backendSubtotal - discountAmount + shippingFee;

    const MerchantTradeNo = 'NAILS' + Date.now();

    await db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('orders').doc(MerchantTradeNo).set({
      id: MerchantTradeNo,
      customerInfo: { name: body.customerInfo?.name || '未提供', phone: body.customerInfo?.phone || '未提供', address: body.customerInfo?.address || '未提供' },
      items: orderItems,
      totalAmount: finalTotal,
      discountAmount,
      shippingFee,
      paymentMethod,
      isCod,
      codNote,
      logisticsType: body.logisticsType || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    const MerchantID = process.env.ECPAY_MERCHANT_ID || '3411891';
    const HashKey = process.env.ECPAY_HASH_KEY || 'VZ0XSU4VbvmTeMsK';
    const HashIV = process.env.ECPAY_HASH_IV || 'wAFot8tTLMamEOBJ';

    const tzOffset = 8 * 60 * 60000;
    const localTime = new Date(Date.now() + tzOffset);
    const MerchantTradeDate = localTime.toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/');
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const ReturnURL = ${protocol}://System.Management.Automation.Internal.Host.InternalHost/api/ecpay_webhook;
    const OrderResultURL = ${protocol}://System.Management.Automation.Internal.Host.InternalHost/shop.html?order=success;

    const logisticsType = body.logisticsType || '';
    const isCVS = logisticsType === 'UNIMARTC2C' || logisticsType === 'FAMIC2C';
    const receiverName = body.customerInfo?.name || '';
    const receiverPhone = body.customerInfo?.phone || '';
    const logisticsAddress = body.customerInfo?.address || '';

    const params = {
      ChoosePayment: 'ALL',
      EncryptType: '1',
      ItemName: 指尖造藝訂單||,
      MerchantID,
      MerchantTradeDate,
      MerchantTradeNo,
      OrderResultURL,
      PaymentType: 'aio',
      ReturnURL,
      TotalAmount: finalTotal.toString(),
      TradeDesc: 指尖造藝訂單 ,
      SenderName: receiverName,
      SenderPhone: receiverPhone,
      ReceiverName: receiverName,
      ReceiverPhone: receiverPhone,
      CustomField1: receiverName,
      CustomField2: receiverPhone,
      CustomField3: logisticsAddress,
      CustomField4: codNote
    };

    if (isCVS) {
      params.LogisticsType = 'CVS';
      params.LogisticsSubType = logisticsType;
      params.IsCollection = 'N';
      params.ReceiverAddress = '';
    } else {
      params.ReceiverAddress = logisticsAddress;
    }

    const keys = Object.keys(params).sort();
    let raw = HashKey=;
    for (const key of keys) raw += &=;
    raw += &HashIV=;

    const urlEncoded = encodeURIComponent(raw).replace(/%20/g, '+').replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.').replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')').toLowerCase();
    params.CheckMacValue = crypto.createHash('sha256').update(urlEncoded).digest('hex').toUpperCase();

    let formHtml = <form id='ecpay-form' action='https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5' method='POST'>;
    for (const key in params) formHtml += <input type='hidden' name='' value='' />;
    formHtml += </form><script>document.getElementById('ecpay-form').submit();</script>;

    res.status(200).header('Content-Type', 'text/html; charset=utf-8').send(formHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('伺服器錯誤:' + err.message);
  }
};
