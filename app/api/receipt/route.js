export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return Response.json({ items: [], total: 0 })
    }

    // 🔥 converter imagem
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    // 🔥 formato correto para OpenAI
    const image = `data:image/jpeg;base64,${base64}`

    // 🔥 chamada da IA
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
Você é um sistema profissional de leitura de cupom fiscal brasileiro.

Sua tarefa:
- Identificar todos os produtos comprados
- Identificar o valor total do cupom

REGRAS:
- Ignore CNPJ, endereço, caixa, operador
- Considere apenas linhas com preço
- Produtos sempre possuem valor monetário ao lado
- Normalize nomes (ex: "ARROZ TIPO 1" → "arroz")

EXEMPLOS:
ARROZ 5KG        25,90 → arroz
FEIJAO PRETO     8,50 → feijao
BANANA PRATA     4,99 → banana

TOTAL:
- Procure linha com TOTAL
- Se não encontrar, some os valores

RETORNE SOMENTE JSON:
{"items": ["arroz", "feijao", "banana"], "total": 39.39}
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

    // 🔥 fallback se não veio nada
    if (!text) {
      return Response.json({
        items: ["nao identificado"],
        total: 0,
      })
    }

    // 🔥 limpa possíveis blocos markdown
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()

    let parsed

    try {
      parsed = JSON.parse(text)
    } catch (err) {
      console.log("ERRO PARSE 👉", text)

      parsed = {
        items: ["erro leitura"],
        total: 0,
      }
    }

    // 🔥 garante estrutura válida
    if (!Array.isArray(parsed.items)) {
      parsed.items = []
    }

    if (!parsed.total || isNaN(parsed.total)) {
      parsed.total = 0
    }

    return Response.json(parsed)

  } catch (error) {
    console.error("ERRO GERAL 👉", error)

    return Response.json({
      items: ["erro geral"],
      total: 0,
    })
  }
}
