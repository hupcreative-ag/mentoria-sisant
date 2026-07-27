// supabase.js - Inicialização Segura do Cliente Supabase para a plataforma Sisant
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

try {
    const supabaseUrl = (import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
    const supabaseAnonKey = (import.meta && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

    if (supabaseUrl && supabaseAnonKey) {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } else {
        console.warn('Aviso: Supabase URL ou Chave Anon não configuradas. Integração Supabase desativada.');
    }
} catch (e) {
    console.warn('Erro ao inicializar cliente Supabase:', e.message);
}

export const supabase = supabaseClient;
