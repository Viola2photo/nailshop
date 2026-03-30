// 檔案路徑： /api/ecpay_map_reply.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('只允許 POST 請求');
  }

  // 從綠界回傳的資料中提取店名與地址
  const { CVSStoreName, CVSAddress } = req.body;

  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="utf-8">
      <title>門市選擇成功</title>
    </head>
    <body style="text-align:center; padding-top:50px; font-family:sans-serif; background-color:#FAF9F8;">
      <h2 style="color:#10b981;">✅ 門市選擇成功！</h2>
      <p>視窗即將自動關閉，請回到購物車繼續結帳。</p>
      <script>
        if (window.opener) {
          const messageData = {
            type: 'ECPAY_MAP_RESULT',
            storeName: '${CVSStoreName || ""}',
            storeAddress: '${CVSAddress || ""}'
          };
          
          // 傳送資料給母視窗
          window.opener.postMessage(messageData, '*');
          
          // 關閉小視窗
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          alert('找不到原本的購物車頁面，請手動關閉此視窗。');
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}