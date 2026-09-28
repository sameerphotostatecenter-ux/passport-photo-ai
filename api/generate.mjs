import OpenAI, { toFile } from 'openai';

const PROMPT = `Create a realistic passport-size photo of the same person in the image. Keep the face, expression, and all facial features completely unchanged. Replace the current outfit with a professional suit and tie suitable for official documents. Maintain a clean white background, natural lighting, and correct proportions for a passport photo.`;

export const maxDuration = 300;

export async function POST(request) {
  try {
    const key = process.env.OPENAI_API_KEY;

    if (!key) {
      return Response.json(
        { error: 'OPENAI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const file = form.get('image');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json(
        { error: 'Please select an image first.' },
        { status: 400 }
      );
    }

    const type = file.type || 'image/jpeg';

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) {
      return Response.json(
        { error: 'Please upload JPG, PNG or WebP.' },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const client = new OpenAI({
      apiKey: key
    });

    const input = await toFile(
      bytes,
      file.name || 'photo.jpg',
      { type }
    );

    const result = await client.images.edit({
      model: 'gpt-image-2',
      image: input,
      prompt: PROMPT,
      size: '1024x1536',
      quality: 'high',
      background: 'opaque',
      output_format: 'png'
    });

    const image = result?.data?.[0]?.b64_json;

    if (!image) {
      throw new Error('No image was returned by OpenAI.');
    }

    return Response.json({
      image: `data:image/png;base64,${image}`
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: error?.message || 'Image generation failed.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    ok: true
  });
}
