const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: '不允許的方法' };

  try {
    const body = JSON.parse(event.body);
    const TotalAmount = body.total.toString();
    const ItemName = body.items || 'MyNails 穿戴甲訂單';
    
    // 接收客人的收件資料
    const customerName = body.name || '未提供';
    const customerPhone = body.phone || '未提供';
    const shippingAddress = body.address || '未提供';

    // ==========================================
    // 🚨 這裡必須填入您的「正式版」綠界金鑰！ 🚨
    // ==========================================
    const MerchantID = '3411891'; 
    const HashKey    = 'VZ0XSU4VbvmTeMsK';    
    const HashIV     = 'wAFot8tTLMamEOBJ';     
    // ==========================================
    
    const MerchantTradeNo = 'NAILS' + new Date().getTime();
    const tzOffset = 8 * 60 * 60000;
    const localTime = new Date(new Date().getTime() + tzOffset);
    const MerchantTradeDate = localTime.toISOString().replace('T', ' ').split('.')[0].replace(/-/g, '/');

    const host = event.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const ReturnURL = `${protocol}://${host}/`; 
    const OrderResultURL = `${protocol}://${host}/shop.html?order=success`; 

    const params = {
      ChoosePayment: 'ALL',
      EncryptType: '1',
      ItemName: ItemName,
      MerchantID: MerchantID,
      MerchantTradeDate: MerchantTradeDate,
      MerchantTradeNo: MerchantTradeNo,
      OrderResultURL: OrderResultURL,
      PaymentType: 'aio',
      ReturnURL: ReturnURL,
      TotalAmount: TotalAmount,
      TradeDesc: 'MyNails 官方網站訂單',
      // 把收件資料塞進綠界的備註欄位
      CustomField1: `收件人:${customerName}`,
      CustomField2: `電話:${customerPhone}`,
      CustomField3: `門市:${shippingAddress}`
    };

    const keys = Object.keys(params).sort();
    let rawString = `HashKey=${HashKey}`;
    for (const key of keys) { rawString += `&${key}=${params[key]}`; }
    rawString += `&HashIV=${HashIV}`;

    const urlEncoded = encodeURIComponent(rawString)
      .replace(/%20/g, '+').replace(/%2d/g, '-').replace(/%5f/g, '_')
      .replace(/%2e/g, '.').replace(/%21/g, '!').replace(/%2a/g, '*')
      .replace(/%28/g, '(').replace(/%29/g, ')').toLowerCase();

    const CheckMacValue = crypto.createHash('sha256').update(urlEncoded).digest('hex').toUpperCase();
    params.CheckMacValue = CheckMacValue;

    // 🚀 已自動幫您切換為綠界「正式環境」的網址
    let formHtml = `<form id="ecpay-form" action="https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5" method="POST">`;
    for (const key in params) { formHtml += `<input type="hidden" name="${key}" value="${params[key]}" />`; }
    formHtml += `</form><script>document.getElementById("ecpay-form").submit();</script>`;

    return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: formHtml };
  } catch (err) {
    return { statusCode: 500, body: '伺服器錯誤：' + err.toString() };
  }
};