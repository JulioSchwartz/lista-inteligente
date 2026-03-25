export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ items: [], total: 0 })
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
                text: "Leia este cupom e retorne JSON com items e total"
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

    console.log("OPENAI RESPONSE 👉", JSON.stringify(data))

    let text = data.output?.[0]?.content?.[0]?.text || '{}'

    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    let parsed

    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { items: [], total: 0 }
    }

    return Response.json(parsed)

  } catch (error) {
    console.error("ERRO NA API 👉", error)
    return Response.json({ items: [], total: 0 })
  }
}
