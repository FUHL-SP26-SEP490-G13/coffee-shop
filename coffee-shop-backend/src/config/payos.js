const { PayOS } = require("@payos/node");
const env = require("./env");

const hasPayOSCredentials =
  !!env.PAYOS_CLIENT_ID && !!env.PAYOS_API_KEY && !!env.PAYOS_CHECKSUM_KEY;

const payOS = hasPayOSCredentials
  ? new PayOS({
      clientId: env.PAYOS_CLIENT_ID,
      apiKey: env.PAYOS_API_KEY,
      checksumKey: env.PAYOS_CHECKSUM_KEY,
    })
  : null;

if (!hasPayOSCredentials) {
  console.warn(
    "[PayOS] Missing credentials. Please set PAYOS_CLIENT_ID, PAYOS_API_KEY and PAYOS_CHECKSUM_KEY in your .env file.",
  );
}

const createPaymentLink = async (req, res, next) => {
  try {
    if (!payOS) {
      return res.status(500).json({
        success: false,
        message:
          "PayOS is not configured. Please check server environment variables.",
      });
    }

    const defaultOrderCode = Number(String(Date.now()).slice(-6));

    // Validate required fields
    const body = {
      orderCode: Number(req.body?.orderCode || defaultOrderCode),
      amount: Number(req.body?.amount),
      description: (req.body?.description || `DH #${req.body?.orderCode || defaultOrderCode}`).slice(0, 25),
      items: req.body?.items || [
        {
          name: req.body?.itemName,
          quantity: req.body?.itemQuantity,
          price: req.body?.itemPrice,
        },
      ],
      returnUrl: req.body?.returnUrl || env.PAYOS_RETURN_URL,
      cancelUrl: req.body?.cancelUrl || env.PAYOS_CANCEL_URL,
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    return res.status(201).json({
      success: true,
      message: "Create payment link successfully",
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      data: paymentLinkResponse,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  payOS,
  createPaymentLink,
};
