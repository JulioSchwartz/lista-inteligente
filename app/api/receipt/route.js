export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return Response.json({ items: [], total: 0 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const image = `data:image/jpeg;base64,${base64}`

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
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
Você é um sistema especialista em leitura de cupom fiscal brasileiro.

Extraia:
1. Lista de produtos
2. Valor total FINAL do cupom

REGRAS:
- Ignore CNPJ, endereço, códigos
- Pegue apenas itens com preço
- Simplifique nomes (ex: "FILE DE TILAPIA" → "tilapia")
- O total geralmente aparece como:
  "VALOR TOTAL"
  "TOTAL"
  "VALOR A PAGAR"

FORMATO:
{"items": ["frango", "tilapia", "carne"], "total": 519.77}

IMPORTANTE:
- Converter vírgula para ponto (519,77 → 519.77)
- Retornar SOMENTE JSON
                `.trim(),
              },
              {
                type: "input_image",
                image: image,
              },
            ],
          },
        ],
      }),
    })

    const data = await response.json()

    console.log("OPENAI RAW 👉", JSON.stringify(data))

    let text = data?.output?.[0]?.content?.[0]?.text || ""

    if (!text) {
      return Response.json({ items: [], total: 0 })
    }

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let parsed

    try {
      parsed = JSON.parse(text)
    } catch (err) {
      console.log("ERRO PARSE 👉", text)
      parsed = { items: [], total: 0 }
    }

    // 🔥 GARANTE ARRAY
    if (!Array.isArray(parsed.items)) {
      parsed.items = []
    }

    // 🔥 GARANTE TOTAL
    if (!parsed.total || isNaN(parsed.total) || parsed.total === 0) {
      // tenta extrair manualmente do texto
      const match = text.match(/(\d{1,3}\.\d{3},\d{2}|\d+,\d{2})/g)

      if (match && match.length > 0) {
        const lastValue = match[match.length - 1]
        parsed.total = Number(
          lastValue.replace(/\./g, "").replace(",", ".")
        )
      } else {
        parsed.total = 0
      }
    }

    return Response.json(parsed)

  } catch (error) {
    console.error("ERRO GERAL 👉", error)

    return Response.json({
      items: [],
      total: 0,
    })
  }
}
