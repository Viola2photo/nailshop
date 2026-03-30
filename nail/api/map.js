export default function handler(req, res) {
  // 綠界規定只接受 POST 請求回傳資料
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  // 從綠界回傳的資料中，解構出我們需要的：門市代號、門市名稱、門市地址
  const { CVSStoreID, CVSStoreName, CVSAddress } = req.body;

  // 產生一段 HTML，把資料「隔空」丟回給購物車頁面
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
        <p>門市選擇成功！視窗即將關閉...</p>
      </div>
      <script>
        // 確認是不是由購物車(母視窗)呼叫出來的
        if (window.opener) {
          // 將門市資料打包
          const messageData = {
            type: 'ECPAY_MAP_RESULT',
            storeId: '${CVSStoreID}',
            storeName: '${CVSStoreName}',
            storeAddress: '${CVSAddress}'
          };
          
          // 傳送資料給母視窗 ('*' 代表不限制接收的網域)
          window.opener.postMessage(messageData, '*');
          
          // 延遲 0.5 秒後自動關閉這個小視窗
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