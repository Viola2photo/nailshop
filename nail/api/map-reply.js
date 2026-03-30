export default function handler(req, res) {
  // 綠界規定只接受 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 綠界地圖會用 POST 方式回傳這些門市資料
  const { CVSStoreID, CVSStoreName, CVSAddress } = req.body;

  // 產生一段 HTML，利用 JavaScript 的 postMessage 將資料「隔空」傳回給母視窗 (也就是您的購物車網頁)
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <title>門市選擇成功</title>
    </head>
    <body style="background-color: #FAF9F8; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; margin: 0;">
      <div style="text-align: center; color: #10b981; font-weight: bold;">
        <p style="font-size: 24px; margin-bottom: 8px;">✅</p>
        <p>門市選擇成功！正在將資料帶回購物車...</p>
      </div>
      <script>
        // 如果這個視窗是被購物車 (window.opener) 打開的
        if (window.opener) {
          // 將取得的門市資料傳回給購物車
          window.opener.postMessage({
            type: 'ECPAY_MAP_RESULT',
            storeId: '${CVSStoreID}',
            storeName: '${CVSStoreName}',
            storeAddress: '${CVSAddress}'
          }, '*');
          
          // 傳送完畢後自動關閉這個彈出視窗
          window.close(); 
        } else {
          document.write('<p style="text-align:center; margin-top: 20px;">請關閉此視窗並回到原網頁。</p>');
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}