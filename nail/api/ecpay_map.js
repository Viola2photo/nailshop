export default function handler(req, res) {
  const { logisticsType } = req.query;

  // 自動判斷抓取您的環境變數，若無則預設使用綠界測試特店編號 2000132
  const merchantID = process.env.MERCHANT_ID || process.env.ECPAY_MERCHANT_ID || '2000132';
  
  // 自動判斷是否為測試環境，決定開啟哪一個綠界地圖網址
  const isTest = process.env.IS_TEST === 'true';
  const mapUrl = isTest 
    ? 'https://logistics-stage.ecpay.com.tw/Express/map'
    : 'https://logistics.ecpay.com.tw/Express/map';

  // 組合回傳網址 (ServerReplyURL)，讓綠界知道選完門市後要將資料丟給誰 (丟給我們的 map-reply.js)
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const serverReplyUrl = `${protocol}://${host}/api/map-reply`;

  // 產生一個自動送出的隱藏表單
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>正在導向超商地圖...</title>
    </head>
    <body style="background-color: #FAF9F8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0;">
      <div style="text-align: center; color: #ec4899; font-weight: bold; padding: 20px;">
        <div style="width: 40px; height: 40px; border: 4px solid rgba(236,72,153,0.2); border-top-color: #ec4899; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto;"></div>
        <p>正在為您開啟超商地圖，請稍候...</p>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      
      <form id="mapForm" method="POST" action="${mapUrl}">
        <input type="hidden" name="MerchantID" value="${merchantID}" />
        <input type="hidden" name="LogisticsType" value="CVS" />
        <input type="hidden" name="LogisticsSubType" value="${logisticsType}" />
        <input type="hidden" name="IsCollection" value="N" />
        <input type="hidden" name="ServerReplyURL" value="${serverReplyUrl}" />
      </form>
      <script>
        // 網頁一載入就自動送出表單至綠界
        document.getElementById('mapForm').submit();
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}