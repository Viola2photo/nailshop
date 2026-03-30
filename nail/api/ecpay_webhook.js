const crypto = require('crypto');
const admin = require('firebase-admin');

// 初始化 Firebase Admin (確保 Vercel 環境有此實例)
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

module.exports = async (req, res) => {
  // 綠界 Webhook 一定是 POST
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const data = req.body;
    
    // 您的綠界金鑰
    const HashKey = 'VZ0XSU4VbvmTeMsK';    
    const HashIV  = 'wAFot8tTLMamEOBJ';  

    // ==========================================
    // 🔍 1. 驗證檢查碼 (確認真的是綠界傳來的)
    // ==========================================
    const receivedMac = data.CheckMacValue;
    delete data.CheckMacValue; // 計算 MAC 時不需要包含這項

    const keys = Object.keys(data).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    let rawString = `HashKey=${HashKey}`;
    for (const key of keys) {
      rawString += `&${key}=${data[key]}`;
    }
    rawString += `&HashIV=${HashIV}`;

    const urlEncoded = encodeURIComponent(rawString)
      .replace(/%20/g, '+').replace(/%2d/g, '-').replace(/%5f/g, '_')
      .replace(/%2e/g, '.').replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')').toLowerCase();

    const calculatedMac = crypto.createHash('sha256').update(urlEncoded).digest('hex').toUpperCase();

    if (receivedMac !== calculatedMac) {
      console.error('CheckMacValue 驗證失敗');
      return res.status(400).send('0|Error');
    }

    // ==========================================
    // ✅ 2. 確認付款狀態並更新資料庫
    // ==========================================
    // RtnCode === '1' 代表付款成功
    if (data.RtnCode === '1') {
      const MerchantTradeNo = data.MerchantTradeNo;
      const orderRef = db.collection('artifacts').doc(appId).collection('users').doc(adminUserId).collection('orders').doc(MerchantTradeNo);
      const orderSnap = await orderRef.get();
      const existingOrder = orderSnap.exists ? orderSnap.data() : {};

      const customerInfo = {
        name: existingOrder.customerInfo?.name || data.CustomField1 || data.SenderName || '',
        phone: existingOrder.customerInfo?.phone || data.CustomField2 || data.SenderPhone || '',
        address: existingOrder.customerInfo?.address || data.CustomField3 || data.CVSAddress || ''
      };

      // 更新 Firebase 訂單狀態為已付款
      await orderRef.update({
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentType: data.PaymentType, // 記錄客人是用信用卡還是超商付的
        tradeNo: data.TradeNo,         // 綠界的交易序號 (方便日後對帳退款)
        customerInfo,
        ecpayRaw: data
      });
      
      // 💡 如果未來想加「自動寄出 Email」，程式碼可以寫在這裡。
    }

    // ==========================================
    // 📢 3. 回傳 1|OK 給綠界
    // ==========================================
    // 務必回傳 1|OK，否則綠界會以為我們沒收到，然後一直重發通知
    res.status(200).send('1|OK');

  } catch (error) {
    console.error('Webhook 處理錯誤:', error);
    res.status(500).send('0|Error');
  }
};