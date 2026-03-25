export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return new Response(JSON.stringify({ error: 'Sem arquivo' }), { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

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
              {
                type: "input_text",
                text: "Leia o cupom fiscal e retorne JSON: { items: [], total: number }"
              },
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

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500 })
  }
}
