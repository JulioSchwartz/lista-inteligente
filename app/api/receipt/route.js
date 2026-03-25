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
Você é um sistema especialista em leitura de cupom fiscal brasileiro.

TAREFAS:
1. Extraia TODOS os produtos comprados
2. Extraia o VALOR TOTAL FINAL

REGRAS IMPORTANTES:

- O total geralmente aparece como:
  "VALOR TOTAL"
  "TOTAL"
  "VALOR A PAGAR"

- Neste cupom, o total está no FINAL

- Ignore:
  CNPJ, endereço, código, impostos

- Produtos:
  Pegue apenas nomes com valor (linhas com preço)

- Simplifique nomes:
  "FILEZINHO SASSAMI" → "frango"
  "FILE DE TILAPIA" → "tilapia"
  "PAPEL MANTEIGA" → "papel manteiga"

FORMATO OBRIGATÓRIO:
{
  "items": ["frango", "tilapia", "carne", "arroz"],
  "total": 519.77
}

IMPORTANTE:
- Converta vírgula para ponto (519,77 → 519.77)
- Retorne SOMENTE JSON
`

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
