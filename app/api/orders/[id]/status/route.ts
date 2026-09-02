import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthUser } from '@/lib/auth';
import { notifyOrderStatusChanged } from '@/lib/notifications';
import { reportError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

const StatusSchema = z.object({
  status: z.enum(['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee', 'retournee']),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Identifiant de commande invalide.' }, { status: 400 });
  }

  try {
    const parsed = StatusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Statut invalide.', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin.rpc('update_order_status', {
      p_order_id: id,
      p_status: parsed.data.status,
      p_changed_by: user.id,
      p_note: parsed.data.note ?? null,
    });

    if (error) {
      const status = /transition impossible|statut invalide/i.test(error.message) ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    if (order?._changed && order._previous_status) {
      await notifyOrderStatusChanged(order, order._previous_status, order.status);
    }

    return NextResponse.json({ order, changed: Boolean(order?._changed) });
  } catch (err) {
    await reportError('orders.status_update', err, { orderId: id });
    return NextResponse.json({ error: 'Impossible de modifier le statut.' }, { status: 500 });
  }
}
