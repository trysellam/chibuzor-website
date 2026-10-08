
export const prerender = false;

export async function POST({ request }) {
  const scriptUrl = import.meta.env.PRICING_ROOM_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return Response.json(
      { success: false, error: 'Registration service is not configured.' },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error('Registration service returned an error.');
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error('Registration was not saved.');
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Pricing Room registration failed:', error);

    return Response.json(
      {
        success: false,
        error: 'We could not save your registration. Please try again.'
      },
      { status: 502 }
    );
  }
}
