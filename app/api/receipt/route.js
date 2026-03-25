export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return Response.json({ items: [], total: 0 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const image = `data:image/jpeg;base64,${base64}`

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
                text: `
Você é um leitor de cupom fiscal brasileiro.

Extraia TODOS os produtos e o valor total.

REGRAS:
- Ignore CNPJ, endereço, caixa, etc
- Pegue apenas produtos comprados
- Normalize nomes (ex: "ARROZ TIPO 1" → "arroz")
- Retorne nomes simples

FORMATO OBRIGATÓRIO:
{
  "items": ["arroz", "feijao", "banana"],
  "total": 123.45
}

Se não conseguir ler perfeitamente, tente ao máximo aproximar.
Retorne SOMENTE JSON.
`
              },
              {
                type: "input_image",
                image: image
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()

    console.log("OPENAI RAW 👉", JSON.stringify(data))

    let text = data.output?.[0]?.content?.[0]?.text

    // 🔥 FALLBACK INTELIGENTE
    if (!text) {
      return Response.json({
        items: ["item não identificado"],
        total: 0
      })
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim()

    let parsed

    try {
      parsed = JSON.parse(text)
    } catch (e) {
      console.log("ERRO PARSE 👉", text)

      // 🔥 fallback se IA não responder corretamente
      parsed = {
        items: ["erro leitura"],
        total: 0
      }
    }

    return Response.json(parsed)

  } catch (error) {
    console.error("ERRO GERAL 👉", error)

    return Response.json({
      items: ["erro geral"],
      total: 0
    })
  }
}
