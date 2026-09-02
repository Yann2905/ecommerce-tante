import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthenticatedUser, isAdminUser } from '@/lib/auth';
import { reportError } from '@/lib/observability';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser) return NextResponse.json({ error: 'Session absente ou expirée.' }, { status: 401 });
  if (!isAdminUser(authenticatedUser)) return NextResponse.json({ error: 'Compte connecté mais non autorisé à accéder à l’administration.' }, { status: 403 });
  try {
    const [{ data: products, error: productsError }, { data: orders, error: ordersError }] = await Promise.all([
      supabaseAdmin.from('products').select('id, name, stock, is_active, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('orders').select('id, customer_name, total_price, status, created_at').order('created_at', { ascending: false }),
    ]);

    if (productsError) throw productsError;
    if (ordersError) throw ordersError;

    const allProducts = products ?? [];
    const allOrders = orders ?? [];
    const validOrders = allOrders.filter((order) => order.status !== 'annulee' && order.status !== 'annulé');
    const pendingStatuses = new Set(['en_attente', 'confirmee', 'en_preparation']);
    const revenue = validOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
    const recentOrders = allOrders.slice(0, 8);
    const lowStock = allProducts.filter((product) => Number(product.stock ?? 0) <= 3);

    return NextResponse.json({
      stats: {
        revenue,
        ordersCount: allOrders.length,
        pendingCount: allOrders.filter((order) => pendingStatuses.has(order.status)).length,
        productsCount: allProducts.length,
        activeProductsCount: allProducts.filter((product) => product.is_active).length,
        inStockCount: allProducts.filter((product) => Number(product.stock ?? 0) > 0).length,
        lowStockCount: lowStock.length,
      },
      recentOrders,
      lowStockProducts: lowStock.slice(0, 8),
    });
  } catch (err) {
    await reportError('admin.dashboard', err);
    return NextResponse.json({ error: 'Impossible de charger le tableau de bord.' }, { status: 500 });
  }
}
