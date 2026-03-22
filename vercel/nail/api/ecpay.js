const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('不允許的方法');

  try {
    const body = req.body;
    const TotalAmount = body.total.toString();
    const ItemName = body.items || 'MyNails 穿戴甲訂單';
    
    const customerName = body.name || '未提供';
    const customerPhone = body.phone || '未提供';
    const shippingAddress = body.address || '未提供';

    // 🚨 這裡必須填入您的「正式版」綠界金鑰！
    const MerchantID = '3411891'; 
    const HashKey    = 'VZ0XSU4VbvmTeMsK';    
    const HashIV     = 'wAFot8tTLMamEOBJ';     
    
    const MerchantTradeNo = 'NAILS' + new Date().getTime();
    const tzOffset = 8 * 60 * 60000;
    const localTime = new Date(new Date().getTime() + tzOffset);
    const MerchantTradeDate = localTime.toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/');

    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const ReturnURL = `${protocol}://${host}/`; 
    const OrderResultURL = `${protocol}://${host}/shop.html?order=success`; 

    const params = {
      ChoosePayment: 'ALL', EncryptType: '1', ItemName: ItemName,
      MerchantID: MerchantID, MerchantTradeDate: MerchantTradeDate,
      MerchantTradeNo: MerchantTradeNo, OrderResultURL: OrderResultURL,
      PaymentType: 'aio', ReturnURL: ReturnURL, TotalAmount: TotalAmount,
      TradeDesc: 'MyNails 官方網站訂單',
      CustomField1: `收件人:${customerName}`, CustomField2: `電話:${customerPhone}`, CustomField3: `門市:${shippingAddress}`
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
    res.status(500).send('伺服器錯誤：' + err.toString());
  }
};