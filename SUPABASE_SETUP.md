# Setup Supabase (GitHub Pages)

1. Crie um projeto no Supabase.
2. No painel SQL Editor, rode o arquivo `supabase.sql`.
3. Em Auth > Users, crie seu usuario admin (email + senha).
4. Em Auth > Providers, deixe `Email` ativo e desative signup publico se quiser.
5. Copie `Project URL` e `anon public key`.
6. Edite `supabase.config.js` com esses valores.
7. No `supabase.sql`, troque `SEU_EMAIL_ADMIN@EXEMPLO.COM` pelo seu email admin e rode de novo.
8. Publique os arquivos no GitHub Pages.

## Uso
- Admin: `/admin.html`
- Site: `index.html`
- Galeria por categoria: `catalog.html?cat=action-figure`

## Importante
- `server.js` nao e necessario para GitHub Pages.
- A seguranca esta no Supabase RLS + login.
