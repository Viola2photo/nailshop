export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // 從綠界 POST 回來的 Body 中提取資料
  const { CVSStoreID, CVSStoreName, CVSAddress } = req.body;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body>
      <script>
        if (window.opener) {
          const messageData = {
            type: 'ECPAY_MAP_RESULT',
            storeId: '${CVSStoreID}',
            storeName: '${CVSStoreName}',
            storeAddress: '${CVSAddress}'
          };
          // 關鍵：將資料傳送回母視窗
          window.opener.postMessage(messageData, '*');
          window.close();
        } else {
          alert('找不到母視窗，請關閉後重新操作。');
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}