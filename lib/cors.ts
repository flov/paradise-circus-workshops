const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function corsJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: { ...corsHeaders, ...init?.headers },
  })
}

export function corsOptions() {
  return new Response(null, { status: 204, headers: corsHeaders })
}
