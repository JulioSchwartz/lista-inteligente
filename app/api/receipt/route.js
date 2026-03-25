export const runtime = 'edge'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return new Response(JSON.stringify({ error: 'Sem arquivo' }), { status: 400 })
    }

    // 🔥 CONVERTE PRA BASE64 (leve)
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // ⚠️ LIMITA TAMANHO (IMPORTANTE)
    if (base64.length > 500000) {
      return new Response(JSON.stringify({ error: 'Imagem muito grande' }), { status: 400 })
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: "Leia este cupom fiscal e retorne JSON com itens e total. Exemplo: { items: ['arroz','feijao'], total: 100 }" },
              {
                type: "input_image",
                image_base64: base64
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()

    const text = data.output?.[0]?.content?.[0]?.text || '{}'
    const parsed = JSON.parse(text)

    return new Response(JSON.stringify(parsed), { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Erro ao processar' }), { status: 500 })
  }
}
