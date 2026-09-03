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

  /**
   * Transformation appliquée à l'ENTRÉE : ce qui est stocké chez Cloudinary est
   * déjà borné, au lieu de conserver le fichier brut de l'appareil photo (souvent
   * plusieurs Mo pour 4000 px de large). La livraison reste plafonnée à ~1280 px
   * par lib/images.ts, donc 2000 px couvrent largement tous les usages du site.
   * Sans cela, chaque nouvelle photo repartait en original pleine résolution.
   */
  const transformation = 'c_limit,w_2000,q_auto:good';

  // Tous les paramètres signés doivent être renvoyés à l'identique par le client.
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder, transformation },
    apiSecret
  );

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, transformation });
}
