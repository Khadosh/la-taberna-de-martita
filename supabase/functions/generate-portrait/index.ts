import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { prompt } = await req.json() as { prompt: string }
  if (!prompt) return new Response(JSON.stringify({ error: 'prompt required' }), { status: 400, headers: corsHeaders })

  const falKey = Deno.env.get('FAL_KEY')
  if (!falKey) return new Response(JSON.stringify({ error: 'FAL_KEY not configured' }), { status: 500, headers: corsHeaders })

  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: { 'Authorization': `Key ${falKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: 'square_hd', num_inference_steps: 4, num_images: 1 }),
  })

  if (!res.ok) {
    const err = await res.text()
    return new Response(JSON.stringify({ error: err }), { status: res.status, headers: corsHeaders })
  }

  const data = await res.json() as { images: { url: string }[] }
  const url = data.images[0]?.url ?? null

  return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
