# Gestão Café & Queijos

Aplicação web responsiva (mobile-first) em **Next.js App Router + TypeScript + Tailwind CSS**, com **Firebase Authentication** e **Cloud Firestore**, pronta para deploy na **Vercel**.

## Regra arquitetural

Os dois negócios são **completamente isolados**:

| Negócio | Coleções Firestore | Módulo |
| --- | --- | --- |
| Operação Queijos | `queijos_compras`, `queijos_vendas`, `queijos_tipos` | `src/modules/queijos/` |
| Operação Café | `cafe_producao`, `cafe_vendas` | `src/modules/cafe/` |

Não há relatórios consolidados misturando café e queijos. O seletor de negócio (sidebar no desktop, cabeçalho fixo no mobile) troca menu, KPIs, formulários, tabelas e exportações. A preferência fica salva no `localStorage`.

## Instalação local

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# preencha as variáveis NEXT_PUBLIC_FIREBASE_* em .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A tela de login aceita apenas e-mail/senha de um usuário **criado manualmente no Firebase**: em **Authentication → Users → Add user**, informe o e-mail e a senha. Não há cadastro público pela interface.

### Variáveis de ambiente

No Firebase Console: **Configurações do projeto → Seus aplicativos → App Web → SDK setup**.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXX   # opcional

# Servidor apenas (sem NEXT_PUBLIC) — recomendado
CAPTCHA_SECRET=valor-aleatorio-longo
```

Sem as variáveis do Firebase a app abre normalmente, mas exibe um aviso na tela de login e não cria conexão. Sem `CAPTCHA_SECRET`, um valor padrão local é usado — defina um segredo aleatório antes de publicar.

### Login

- **Sem cadastro público:** o usuário é liberado manualmente em Firebase Console → Authentication → Users.
- **CAPTCHA:** desafio matemático leve, gerado e validado no servidor (`/api/captcha`), assinado com HMAC e expirando em 5 minutos. Não exige chave de API nem plano pago — ideal para uso pessoal. Cada tentativa gera um novo desafio.
- **Mostrar senha:** botão de olho no campo de senha.
- Para um projeto comercial/público, troque o desafio por Cloudflare Turnstile ou reCAPTCHA; o atual inibe apenas uso casual por bots.

### Regras do Firestore (mínimo recomendado)

Em **Firestore Database → Regras**:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function autenticado() {
      return request.auth != null;
    }
    match /cafe_producao/{doc} { allow read, write: if autenticado(); }
    match /cafe_vendas/{doc}   { allow read, write: if autenticado(); }
    match /queijos_compras/{doc} { allow read, write: if autenticado(); }
    match /queijos_vendas/{doc}  { allow read, write: if autenticado(); }
    match /queijos_tipos/{doc}   { allow read, write: if autenticado(); }
  }
}
```

Para múltiplos usuários com acessos distintos, adicione um campo `ownerUid` aos registros e restrinja `request.resource.data.ownerUid == request.auth.uid`.

### Plano Firebase Spark (sem custo)

O projeto foi desenhado para funcionar no **plano Spark**: não usa Cloud Functions, Cloud Storage, banco nomeado, TTL, PITR nem backup automático (recursos que exigem faturamento/Blaze). A hospedagem da interface e a validação do CAPTCHA rodam na Vercel (API Route), não no Firebase.

Limites do Firestore **Standard / banco `(default)`** no Spark (por projeto, não por app):

| Recurso | Cota gratuita |
| --- | --- |
| Leituras de documentos | 50.000 / dia |
| Escritas de documentos | 20.000 / dia |
| Exclusões de documentos | 20.000 / dia |
| Dados armazenados | 1 GiB |
| Transferência de saída | 10 GiB / mês |

As cotas diárias são reiniciadas por volta da meia-noite (fuso do Pacífico) e são compartilhadas por todos os apps do mesmo projeto Firebase. Se uma cota for excedida dentro do mês, o uso daquele produto é interrompido até o próximo ciclo ou até fazer upgrade para Blaze.

Boas práticas no Spark:

- Use os filtros de período nas telas e evite deixar várias abas abertas simultaneamente — cada listener `onSnapshot` conta leituras.
- Não repita "Carregar dados de teste" em produção; cada registro é uma escrita.
- Use **Exportar CSV** como rotina de backup manual, já que PITR/backups automáticos exigem faturamento.
- Autenticação por e-mail/senha não adiciona custo por usuário.

### Dados de teste

Botão **Carregar dados de teste** disponível no Resumo/Painel em `npm run dev` e, em qualquer ambiente, na página **Configurações**. Os dados são inseridos somente nas coleções do negócio ativo.

## Padrões brasileiros

- Moeda: `R$ 1.234,56`
- Datas: `DD/MM/AAAA` (nos CSVs e tabelas)
- Decimais: `1.234,56` — os campos aceitam vírgula ou ponto
- CSV: separador `;`, BOM UTF-8 e números decimais com vírgula (Excel pt-BR)

## Deploy na Vercel

1. Faça `push` do repositório para GitHub/GitLab/Bitbucket.
2. Na Vercel: **Add New → Project** e selecione o repositório (framework detectado: Next.js).
3. Em **Environment Variables**, adicione todas as variáveis `NEXT_PUBLIC_FIREBASE_*` e também `CAPTCHA_SECRET` com os mesmos valores do `.env.local` (ambientes Production, Preview e Development).
4. **Deploy**. Não é necessário configurar `buildCommand` (padrão: `npm run build`).
5. No Firebase Console, adicione o domínio da Vercel em **Authentication → Settings → Authorized domains** (domínios `*.vercel.app` e seu domínio customizado).

## Scripts

```bash
npm run dev        # desenvolvimento
npm run build      # build de produção (validação para Vercel)
npm start          # serve o build localmente
npm run typecheck  # checagem TypeScript
```
