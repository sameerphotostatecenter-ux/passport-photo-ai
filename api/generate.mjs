const PROMPT = `Create a realistic passport-size photo of the same person in the image. Keep the face, expression, and all facial features completely unchanged. Replace the current outfit with a professional suit and tie suitable for official documents. Maintain a clean white background, natural lighting, and correct proportions for a passport photo.`;

export const maxDuration = 300;

export async function POST(request) {
  try {
    const token = process.env.CLOUDFLARE_AI_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!token || !accountId) {
      return Response.json(
        { error: "Cloudflare AI is not configured." },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const file = form.get("image");

    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json(
        { error: "Please upload an image." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    const aiForm = new FormData();

    aiForm.append("prompt", PROMPT);
    aiForm.append(
      "input_image_0",
      new Blob([bytes], { type: file.type || "image/jpeg" }),
      file.name || "photo.jpg"
    );

    aiForm.append("width", "768");
    aiForm.append("height", "1024");

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: aiForm
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(errorText);

      return Response.json(
        { error: "Cloudflare AI request failed." },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!result.success || !result.result?.image) {
      console.error(result);

      return Response.json(
        { error: "No image was returned." },
        { status: 500 }
      );
    }

    return Response.json({
      image: `data:image/png;base64,${result.result.image}`
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: error?.message || "Generation failed." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ ok: true });
}
