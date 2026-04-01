import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. On cherche le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Accès refusé. Token manquant." });
    }

    // 2. On extrait le token (ce qui est après "Bearer ")
    const token = authHeader.split(' ')[1];

    // 3. On demande à Supabase de vérifier ce token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Session invalide ou expirée. Reconnectez-vous." });
    }

    // ✅ Succès : Le token est valide, on attache l'user à la requête et on passe au controller
    (req as any).user = user;
    next(); 

  } catch (err) {
    console.error("Erreur Auth Middleware:", err);
    res.status(500).json({ error: "Erreur de sécurité interne" });
  }
};