import axios from 'axios';

const PAYPAL_API_URL =
  process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api.sandbox.paypal.com'
    : 'https://api.paypal.com';

let accessToken: string = '';
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      `${PAYPAL_API_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;

    return accessToken;
  } catch (error) {
    console.error('❌ PayPal token error:', error);
    throw new Error('Nie można uzyskać dostępu do PayPal');
  }
}

export async function createPayPalOrder(
  submissionId: number,
  amount: number,
  returnUrl: string,
  cancelUrl: string
) {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'PLN',
              value: amount.toString(),
            },
            description: `Dostawa PALMO-TRANS (ID: ${submissionId})`,
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          user_action: 'PAY_NOW',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ PayPal create order error:', error);
    throw new Error('Nie można stworzyć zamówienia w PayPal');
  }
}

export async function capturePayPalOrder(orderId: string) {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ PayPal capture error:', error);
    throw new Error('Nie można potwierdzić płatności');
  }
}
