import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get("file")

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Extraia os produtos e o valor total desse cupom. Retorne JSON no formato: { items: [\"arroz\", \"banana\"], total: 100 }"
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${base64}`
          }
        ]
      }
    ]
  })

  const text = response.output_text

  try {
    const data = JSON.parse(text)
    return Response.json(data)
  } catch {
    return Response.json({
      items: [],
      total: 0
    })
  }
}
