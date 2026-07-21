// Aceita tanto as variáveis do .env local quanto as criadas pela integração
// Supabase↔Vercel (que usam outros nomes).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

let supabaseHost = "";
try {
  supabaseHost = new URL(supabaseUrl).hostname;
} catch {
  supabaseHost = "";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Expõe as chaves públicas ao browser com nomes normalizados,
  // independentemente do nome que a integração criou.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
