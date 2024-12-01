import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { Redis } from 'ioredis'; // Usando Redis para cache (opcional)

const supabase = createClient(
  'https://qtqwjlyacfvwpotbzbhh.supabase.co', // URL do seu Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0cXdqbHlhY2Z2d3BvdGJ6YmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwMTgzOTgsImV4cCI6MjA0ODU5NDM5OH0.h2rWS80XTLsd524BLw8lWjZoTgpzmIC8KSZGz7s3UgQ'
);

const redis = new Redis(); // Instancia do Redis para cache, se necessário.

export const getCache = async (key: string) => {
  // Tentando pegar o dado do cache Redis
  const cachedData = await redis.get(key);
  if (cachedData) {
    console.log('Cache hit');
    return JSON.parse(cachedData);
  }

  // Caso o dado não esteja no cache, vamos buscar no banco de dados (Supabase)
  console.log('Cache miss, fetching from database');
  const { data, error } = await supabase.from('your_table').select().eq('id', key).single();

  if (error) {
    console.error('Error fetching from database', error);
    return null;
  }

  // Armazenando o dado no cache Redis para consultas futuras
  await redis.set(key, JSON.stringify(data), 'EX', 3600); // Expira em 1 hora (3600 segundos)

  return data;
};

export const setCache = async (key: string, data: any) => {
  // Salvando no cache Redis
  await redis.set(key, JSON.stringify(data), 'EX', 3600); // Expira em 1 hora
};

export const clearCache = async (key: string) => {
  // Removendo o dado do cache
  await redis.del(key);
};
