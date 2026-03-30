// 檔案路徑： /api/map-reply.js
export default function handler(req, res) {
  // 綠界規定只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  // 綠界地圖會用 POST 方式回傳這些門市資料給我們
  const { CVSStoreID, CVSStoreName, CVSAddress } = req.body;

  // 產生一段 HTML，利用 JavaScript 將資料傳回母視窗 (購物車)
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <title>門市選擇成功</title>
      <style>
        body { background-color: #FAF9F8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0; }
        .success-box { text-align: center; color: #10b981; font-weight: bold; }
        .check-icon { font-size: 40px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="success-box">
        <div class="check-icon">✅</div>
        <p>門市選擇成功！正在將資料帶回購物車...</p>
      </div>
      <script>
        // 檢查這個視窗是否是由購物車 (window.opener) 打開的
        if (window.opener) {
          // 將取得的門市資料包裝起來
          const messageData = {
            type: 'ECPAY_MAP_RESULT',
            storeId: '${CVSStoreID}',
            storeName: '${CVSStoreName}',
            storeAddress: '${CVSAddress}'
          };
          
          // 隔空傳送給購物車母視窗！ ('*' 代表允許傳給任何網域的母視窗)
          window.opener.postMessage(messageData, '*');
          
          // 傳送完畢後，自動關閉這個彈出的小視窗
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          document.body.innerHTML = '<h3 style="color:red; text-align:center; margin-top:50px;">錯誤：無法找到原本的購物車頁面，請關閉視窗重新操作。</h3>';
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
