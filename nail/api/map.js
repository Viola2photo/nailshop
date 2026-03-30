export default function handler(req, res) {
  const { logisticsType } = req.query;

  // 1. 填入您的綠界特店編號 (請在後台確認)
  const merchantID = '3411891'; 
  
  // 2. 綠界環境網址 (正式環境)
  const mapUrl = 'https://logistics.ecpay.com.tw/Express/map';

  // 3. 組合回傳網址：告訴綠界選完後要把資料送到哪裡
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const serverReplyUrl = `${protocol}://${host}/api/map-reply`;

  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <title>正在連接超商地圖...</title>
      <style>
        body { background-color: #FAF9F8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0; }
        .loading { text-align: center; color: #ec4899; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="loading">
        <p>正在為您連接至超商地圖，請稍候...</p>
      </div>
      <form id="mapForm" method="POST" action="${mapUrl}">
        <input type="hidden" name="MerchantID" value="${merchantID}" />
        <input type="hidden" name="LogisticsType" value="CVS" />
        <input type="hidden" name="LogisticsSubType" value="${logisticsType || 'UNIMART'}" />
        <input type="hidden" name="IsCollection" value="N" />
        <input type="hidden" name="ServerReplyURL" value="${serverReplyUrl}" />
      </form>
      <script>document.getElementById('mapForm').submit();</script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}