
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.'
    });
  }

  const scriptUrl = process.env.PRICING_ROOM_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({
      success: false,
      error: 'Registration service is not configured.'
    });
  }

  try {
    const payload =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    const responseText = await response.text();

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error('Apps Script returned an invalid response.');
    }

    if (!response.ok || !result.success) {
      throw new Error('Registration was not saved.');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Pricing Room registration failed:', error);

    return res.status(502).json({
      success: false,
      error: 'We could not save your registration. Please try again.'
    });
  }
}
