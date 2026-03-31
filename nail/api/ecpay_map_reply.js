module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('不允許的方法');
  
  const storeName = req.body.CVSStoreName || '';
  const storeAddress = req.body.CVSAddress || '';
  
  const html = `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head><meta charset="UTF-8"><title>門市選擇成功</title></head>
    <body style="text-align:center; padding-top:50px; font-family:sans-serif;">
      <h2>✅ 門市選擇成功！</h2>
      <p>請關閉此視窗，回到購物車繼續結帳。</p>
      <script>
        if(window.opener) {
          window.opener.postMessage({
            type: 'ECPAY_MAP_RESULT',
            storeName: '${storeName}',
            storeAddress: '${storeAddress}'
          }, '*');
          window.close();
        }
      </script>
    </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
};