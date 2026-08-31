// TEMPORARY — for debugging only. Delete this file once the real issue is found.
// Visit /api/debug-env directly in your browser after deploying this.
// It does NOT reveal the actual key value, only whether it exists.

export default function handler(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  const keyLength = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0;

  // List every environment variable NAME visible to this function (not values)
  const visibleVarNames = Object.keys(process.env).filter(
    (k) => !k.startsWith('VERCEL_') && !k.startsWith('NOW_') && !k.startsWith('AWS_') && !k.startsWith('npm_')
  );

  return res.status(200).json({
    anthropic_key_found: hasKey,
    anthropic_key_length: keyLength,
    node_env: process.env.NODE_ENV || null,
    vercel_env: process.env.VERCEL_ENV || null,
    other_visible_variable_names: visibleVarNames
  });
}
