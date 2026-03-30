const crypto = require('crypto');
const admin = require('firebase-admin');

// 1. 初始化 Firebase Admin (利用環境變數)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // 處理 Vercel 環境變數中的換行符號問題
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    })
  });
}
const db = admin.firestore();

// 您的固定參數 (請確保與 index.html 中的一致)
const appId = 'nail-inventory-app';
const adminUserId = "MvkJo5e1kEcBS0fGGMr4RKdQjYg1"; 

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('不允許的方法');

  try {
    const body = req.body;
    const items = body.items || []; // 假設前端傳來 [{ id: 'NAIL_0001', size: 'M', quantity: 2 }]
    
    let backendTotalAmount = 0;
    const orderItems = [];

    // ==========================================
    // 🛡️ 核心防護：後端驗價 (不信任前端的金額)
    // ==========================================
    for (const item of items) {
      // 親自去 Firebase 查這個款式的真實價格
      const doc = await db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('inventory').doc(item.id).get();
      
      if (doc.exists) {
        const product = doc.data();
        const itemTotal = product.price * item.quantity;
        backendTotalAmount += itemTotal;
        
        orderItems.push({
          productId: item.id,
          name: product.name,
          size: item.size,
          quantity: item.quantity,
          price: product.price, // 寫入真實價格
          imageUrl: product.media?.[0]?.url || ''
        });
      }
    }

    if (backendTotalAmount === 0) {
      return res.status(400).send('購物車無效或商品不存在');
    }

    // ==========================================
    // 📝 在 Firebase 建立「待付款」訂單
    // ==========================================
    const MerchantTradeNo = 'NAILS' + new Date().getTime();
    
    await db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('orders').doc(MerchantTradeNo).set({
      id: MerchantTradeNo,
      customerInfo: {
        name: body.name || '未提供',
        phone: body.phone || '未提供',
        address: body.address || '未提供'
      },
      items: orderItems,
      totalAmount: backendTotalAmount,
      discountCode: body.discountCode || '',
      status: 'pending', // 狀態：待付款
      createdAt: new Date().toISOString()
    });

    // ==========================================
    // 💳 產生綠界結帳表單
    // ==========================================
    const MerchantID = '3411891'; 
    const HashKey    = 'VZ0XSU4VbvmTeMsK';    
    const HashIV     = 'wAFot8tTLMamEOBJ';     
    
    const tzOffset = 8 * 60 * 60000;
    const localTime = new Date(new Date().getTime() + tzOffset);
    const MerchantTradeDate = localTime.toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/');

    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // 這是下一步我們要寫的 Webhook 網址
    const ReturnURL = `${protocol}://${host}/api/ecpay_webhook`; 
    const OrderResultURL = `${protocol}://${host}/shop.html?order=success`; 

    const params = {
      ChoosePayment: 'ALL', 
      EncryptType: '1', 
      ItemName: 'MyNails 穿戴甲訂單',
      MerchantID: MerchantID, 
      MerchantTradeDate: MerchantTradeDate,
      MerchantTradeNo: MerchantTradeNo, 
      OrderResultURL: OrderResultURL,
      PaymentType: 'aio', 
      ReturnURL: ReturnURL, // 綠界付款成功會在背景呼叫這個網址
      TotalAmount: backendTotalAmount.toString(), // 放入後端算好的安全金額
      TradeDesc: 'MyNails 官方網站訂單',
    };

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
    console.error(err);
    res.status(500).send('伺服器錯誤：' + err.toString());
  }
};