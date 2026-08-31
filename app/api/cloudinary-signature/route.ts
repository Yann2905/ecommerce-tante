import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * ✅ Génère une signature Cloudinary pour un upload direct depuis le navigateur.
 * Le secret Cloudinary ne quitte JAMAIS le serveur. Route réservée à l'admin.
 *
 * Variables serveur requises :
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Cloudinary non configuré (variables manquantes).' },
      { status: 500 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = 'emma-shop/products';

  // Signe uniquement les paramètres qui seront envoyés (folder + timestamp).
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret
  );

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
