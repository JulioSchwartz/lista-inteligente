export async function POST(req) {
  return Response.json({
    items: ["arroz", "banana"],
    total: 120
  })
}
