// 最簡易綠界超商選門市跳轉用（對應 shop.html open window 由 frontend 取門市訊息）
module.exports = (req, res) => {
  const logisticsType = req.query.logisticsType || 'UNIMARTC2C';
  const redirectUrl = https://payment.ecpay.com.tw/Mapping?LogisticsType=CVS&LogisticsSubType=;
  res.redirect(redirectUrl);
};
