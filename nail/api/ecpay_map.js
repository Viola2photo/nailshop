exports.handler = async (event) => {
  const type = event.queryStringParameters.type || 'UNIMARTC2C'; 
  
  // 🚨 填入您的正式 MerchantID
  const MerchantID = '3411891'; 
  
  const mapUrl = 'https://logistics.ecpay.com.tw/Express/map';
  const host = event.headers.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
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
  return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: formHtml };
};