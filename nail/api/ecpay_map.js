module.exports = async (req, res) => {
  const type = req.query.type || 'UNIMARTC2C'; 
  
  // 🚨 填入您的正式 MerchantID
  const MerchantID = '3411891'; 
  
  const mapUrl = 'https://logistics.ecpay.com.tw/Express/map';
  const host = req.headers.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // 已自動切換為 Vercel 專用路徑
  const ServerReplyURL = `${protocol}://${host}/api/ecpay_map_reply`;

  const formHtml = `
    <form id="map-form" action="${mapUrl}" method="POST">
      <input type="hidden" name="MerchantID" value="${MerchantID}" />
      <input type="hidden" name="LogisticsType" value="CVS" />
      <input type="hidden" name="LogisticsSubType" value="${type}" />
      <input type="hidden" name="IsCollection" value="N" />
      <input type="hidden" name="ServerReplyURL" value="${ServerReplyURL}" />
    </form>
    <script>document.getElementById("map-form").submit();</script>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(formHtml);
};