# Planos da Tissi

App para a Tissi montar o plano alimentar de cada paciente (individual ou família) e baixar em PDF, Word e Excel, com a logo dela no rodapé.
Tem modelos prontos, busca em +2.800 alimentos com quantidades, importância por refeição, copiar de outra paciente e leitura de exames (PDF, Excel, Word, foto).
Site estático (GitHub Pages) + login e banco de dados no Supabase (gratuito). Tudo é salvo sozinho.

## Configurar (uma vez, uns 10 minutos)

**1. Banco de dados e login (Supabase)**
1. Crie uma conta em https://supabase.com e clique em **New project** (nome: `planos-tissi`, anote a senha do banco, região: South America).
2. No menu esquerdo, **SQL Editor > New query**, cole o conteúdo de `supabase.sql` e clique **Run**.
3. **Authentication > Users > Add user > Create new user**: coloque o e-mail e uma senha para a Tissi, marque **Auto Confirm User**. (Crie outro para você, se quiser.)
4. **Authentication > Sign In / Providers > Email**: desligue **Allow new users to sign up**. Assim só quem você criou consegue entrar.
5. **Project Settings > API**: copie a **Project URL** e a chave **anon public**.

**2. Colar as chaves**
Abra `config.js` e cole os dois valores entre as aspas. A chave `anon` é pública por natureza; quem protege os dados é o login e a regra do banco.

**3. Publicar no GitHub Pages**
No repositório: **Settings > Pages > Build and deployment > Source: Deploy from a branch > Branch: main / (root) > Save**.
Em 1 a 2 minutos o endereço aparece nessa mesma tela.

## Usar
Entrar com e-mail e senha, **+ Nova paciente**, preencher dia a dia, **Baixar** (PDF, Word ou Excel).
Os dados das pacientes ficam só no Supabase, nunca no GitHub.
