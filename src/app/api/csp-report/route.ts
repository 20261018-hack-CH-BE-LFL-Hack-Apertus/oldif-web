export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > 16384)
    return new Response(null, { status: 413 });
  await request.body?.cancel();
  return new Response(null, { status: 204 });
}
