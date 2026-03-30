// 檔案路徑： /api/map.js
export default function handler(req, res) {
  // 取得前端傳來的超商類型 (例如 UNIMART 代表 7-11，FAMI 代表全家)
  const { logisticsType } = req.query;

  // 🔴【請修改這裡】填入您在綠界後台取得的「特店編號」
  const merchantID = '3411891'; 
  
  // 綠界正式環境地圖網址 (若要測試請改為 [https://logistics-stage.ecpay.com.tw/Express/map](https://logistics-stage.ecpay.com.tw/Express/map))
  const mapUrl = '[https://logistics.ecpay.com.tw/Express/map](https://logistics.ecpay.com.tw/Express/map)';

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
        <p>正在為您連接至超商地圖，請稍候...</p>
      </div>
      
      <!-- 這個表單一載入就會立刻被執行 submit -->
      <form id="mapForm" method="POST" action="${mapUrl}">
        <input type="hidden" name="MerchantID" value="${merchantID}" />
        <input type="hidden" name="LogisticsType" value="CVS" />
        <input type="hidden" name="LogisticsSubType" value="${logisticsType || 'UNIMART'}" />
        <input type="hidden" name="IsCollection" value="N" /> <!-- N 代表不代收貨款，若要取貨付款請視您的合約設定 -->
        <input type="hidden" name="ServerReplyURL" value="${serverReplyUrl}" />
      </form>
      
      <script>
        // 網頁一載入，立刻觸發按鈕將資料 POST 給綠界
        document.getElementById('mapForm').submit();
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}