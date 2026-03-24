import OpenAI from "openai"

export async function POST(req) {
  try {
    console.log("🔥 API CHAMADA")

    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      console.log("❌ Sem arquivo")
      return Response.json({ error: "Sem arquivo" })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")

    console.log("📸 Imagem convertida")

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Leia o cupom fiscal e retorne SOMENTE JSON válido no formato: { \"items\": [], \"total\": 0 }"
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64}`
            }
          ]
        }
      ]
    })

    console.log("🤖 Resposta IA:", response)

    const text = response.output_text

    console.log("📄 Texto:", text)

    const data = JSON.parse(text)

    return Response.json(data)

  } catch (error) {
    console.error("🔥 ERRO REAL:", error)
    return Response.json({ error: error.message })
  }
}
