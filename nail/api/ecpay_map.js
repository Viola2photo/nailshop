// 檔案路徑： /api/ecpay_map.js
export default function handler(req, res) {
  // 取得前端傳來的類型，預設為 UNIMARTC2C (符合您的 C2C 權限)
  const type = req.query.logisticsType || 'UNIMARTC2C'; 

  const merchantID = '3411891'; 
  const mapUrl = 'https://logistics.ecpay.com.tw/Express/map';
  
  const host = req.headers.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // 確保回傳網址指向正確的處理檔案
  const serverReplyUrl = `${protocol}://${host}/api/ecpay_map_reply`;

  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <title>正在導向超商地圖...</title>
      <style>
        body { background-color: #FAF9F8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0; }
        .spinner { width: 40px; height: 40px; border: 4px solid #ec4899; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div style="text-align: center; color: #ec4899; font-weight: bold;">
        <div class="spinner"></div>
        <p>正在連接地圖，請稍候...</p>
      </div>
      
      <form id="mapForm" method="POST" action="${mapUrl}">
        <input type="hidden" name="MerchantID" value="${merchantID}" />
        <input type="hidden" name="LogisticsType" value="CVS" />
        <input type="hidden" name="LogisticsSubType" value="${type}" />
        <input type="hidden" name="IsCollection" value="N" />
        <input type="hidden" name="ServerReplyURL" value="${serverReplyUrl}" />
      </form>
      
      <script>
        window.onload = function() {
          document.getElementById('mapForm').submit();
        };
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}