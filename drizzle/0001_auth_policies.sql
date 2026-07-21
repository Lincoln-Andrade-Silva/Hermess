-- FK: profiles.id -> auth.users.id (cascade ao deletar o usuário)
ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES auth.users ("id") ON DELETE CASCADE;
--> statement-breakpoint

-- Row Level Security
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- Grants mínimos (RLS ainda governa quais linhas ficam visíveis).
GRANT SELECT, UPDATE ON "profiles" TO authenticated;
--> statement-breakpoint

-- Cada usuário lê apenas o próprio profile.
CREATE POLICY "profiles_select_own" ON "profiles"
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = "id");
--> statement-breakpoint

-- Cada usuário atualiza apenas o próprio profile (USING + WITH CHECK).
CREATE POLICY "profiles_update_own" ON "profiles"
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = "id")
  WITH CHECK ((select auth.uid()) = "id");
--> statement-breakpoint

-- Cria o profile automaticamente ao inserir em auth.users.
-- SECURITY DEFINER: o INSERT ocorre no contexto do sistema de auth, contornando
-- a RLS de forma controlada. Só é chamável como trigger (NEW não existe fora disso).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE((NEW.raw_app_meta_data->>'tipo')::public.tipo_usuario, 'cliente')
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
