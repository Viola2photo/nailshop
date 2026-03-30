const crypto = require('crypto');
const admin = require('firebase-admin');

// 1. 初始化 Firebase Admin
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
const adminUserId = "MvkJo5e1kEcBS0fGGMr4RKdQjYg1"; 

// 🛡️ 後端定義與前端完全一致的規則
const SHIPPING_FEE = 65;              
const FREE_SHIPPING_THRESHOLD = 1000; 
const PROMO_CODES = {
  'VIP9': { type: 'percent', value: 0.9 },
  'SAVE100': { type: 'minus', value: 100 },
  'NEWOPEN': { type: 'percent', value: 0.85 },
  'KOL_VIOLA': { type: 'percent', value: 0.95 } 
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('不允許的方法');

  try {
    const body = req.body;
    const items = body.items || [];
    const discountCode = (body.discountCode || '').toUpperCase().trim();
    const paymentMethod = body.paymentMethod || 'ALL'; // 預設接收前端傳來的支付方式
    
    let backendSubtotal = 0;
    const orderItems = [];

    // 1. 驗證商品單價並計算小計
    for (const item of items) {
      const doc = await db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('inventory').doc(item.id).get();
      if (doc.exists) {
        const product = doc.data();
        backendSubtotal += product.price * item.quantity;
        orderItems.push({
          productId: item.id,
          name: product.name,
          size: item.size,
          quantity: item.quantity,
          price: product.price
        });
      }
    }

    if (backendSubtotal === 0) return res.status(400).send('購物車為空');

    // 2. 計算折扣金額
    let discountAmount = 0;
    if (discountCode && PROMO_CODES[discountCode]) {
      const promo = PROMO_CODES[discountCode];
      if (promo.type === 'percent') {
        discountAmount = Math.round(backendSubtotal * (1 - promo.value));
      } else if (promo.type === 'minus') {
        discountAmount = promo.value;
      }
    }

    // 3. 計算運費 (滿千免運)
    const currentShippingFee = backendSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    // 4. 計算最終總金額 (🛡️ 這就是傳給綠界的關鍵金額)
    const finalTotal = backendSubtotal - discountAmount + currentShippingFee;

    // 📝 建立訂單紀錄
    const MerchantTradeNo = 'NAILS' + new Date().getTime();
    await db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('orders').doc(MerchantTradeNo).set({
      orderId: MerchantTradeNo,
      customerInfo: {
        name: body.name || '未提供',
        phone: body.phone || '未提供',
        address: body.address || '未提供'
      },
      items: orderItems,
      subtotal: backendSubtotal,
      discount: discountAmount,
      shippingFee: currentShippingFee,
      totalAmount: finalTotal,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // 💳 產生綠界結帳表單
    const MerchantID = '3411891'; 
    const HashKey    = 'VZ0XSU4VbvmTeMsK';    
    const HashIV     = 'wAFot8tTLMamEOBJ';     
    
    const tzOffset = 8 * 60 * 60000;
    const localTime = new Date(new Date().getTime() + tzOffset);
    const MerchantTradeDate = localTime.toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/');

    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const ReturnURL = `${protocol}://${host}/api/ecpay_webhook`; 
    const OrderResultURL = `${protocol}://${host}/shop.html?order=success`; 

    const params = {
      ChoosePayment: paymentMethod, // 這裡讓用戶可以選擇超商(CVS)或信用卡(CREDIT)
      EncryptType: '1', 
      ItemName: `穿戴甲商品等 ${items.length} 件`,
      MerchantID: MerchantID, 
      MerchantTradeDate: MerchantTradeDate,
      MerchantTradeNo: MerchantTradeNo, 
      OrderResultURL: OrderResultURL,
      PaymentType: 'aio', 
      ReturnURL: ReturnURL,
      TotalAmount: finalTotal.toString(), // 🛡️ 傳送後端計算出的 455 元
      TradeDesc: '指尖造藝官網訂單',
    };

    // 簽章邏輯
    const keys = Object.keys(params).sort();
    let rawString = `HashKey=${HashKey}`;
    for (const key of keys) { rawString += `&${key}=${params[key]}`; }
    rawString += `&HashIV=${HashIV}`;

    const urlEncoded = encodeURIComponent(rawString)
      .replace(/%20/g, '+').replace(/%2d/g, '-').replace(/%5f/g, '_')
      .replace(/%2e/g, '.').replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')').toLowerCase();

    params.CheckMacValue = crypto.createHash('sha256').update(urlEncoded).digest('hex').toUpperCase();

    let formHtml = `<form id="ecpay-form" action="https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5" method="POST">`;
    for (const key in params) { formHtml += `<input type="hidden" name="${key}" value="${params[key]}" />`; }
    formHtml += `</form><script>document.getElementById("ecpay-form").submit();</script>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(formHtml);
  } catch (err) {
    res.status(500).send('伺服器錯誤：' + err.toString());
  }
};