export default function handler(req, res) {
  // 取得超商類型
  const { logisticsType } = req.query;

  // 綠界特店編號 (測試用)
  const merchantID = '3411891'; 
  
  // 綠界正式環境地圖網址 (這裡必須是純文字，不能有括號)
  const mapUrl = 'https://logistics.ecpay.com.tw/Express/map';

  // 自動判斷目前的網域，組合出讓綠界把資料送回來的網址 (ServerReplyURL)
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const serverReplyUrl = `${protocol}://${host}/api/map-reply`;

  // 產生一個會自動 submit (送出) 的隱藏表單
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>正在導向超商地圖...</title>
      <style>
        body { background-color: #FAF9F8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0; }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(236,72,153,0.2); border-top-color: #ec4899; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div style="text-align: center; color: #ec4899; font-weight: bold;">
        <div class="spinner"></div>
        <p>正在為您連接至綠界超商地圖，請稍候...</p>
      </div>
      
      <form id="mapForm" method="POST" action="${mapUrl}">
        <input type="hidden" name="MerchantID" value="${merchantID}" />
        <input type="hidden" name="LogisticsType" value="CVS" />
        <input type="hidden" name="LogisticsSubType" value="${logisticsType || 'UNIMART'}" />
        <input type="hidden" name="IsCollection" value="N" />
        <input type="hidden" name="ServerReplyURL" value="${serverReplyUrl}" />
      </form>
      
      <script>
        document.getElementById('mapForm').submit();
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}