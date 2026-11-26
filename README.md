# ☕🧀 Gestão Café & Queijos

Sistema web **mobile-first** para administrar duas operações **completamente separadas**: café e queijos. Feito em **Next.js App Router + TypeScript + Tailwind CSS**, com **Firebase Authentication**, **Cloud Firestore** e deploy na **Vercel**.

> **Regra de ouro:** café e queijos nunca são misturados. Cada negócio tem menu, KPIs, formulários, tabelas, exportações e coleções próprias. O seletor de operação fica na sidebar (desktop) e no cabeçalho (mobile).

---

## 📑 Sumário

- [O que o sistema faz](#-o-que-o-sistema-faz)
- [Arquitetura isolada](#-arquitetura-isolada)
- [Tecnologias](#-tecnologias)
- [Instalação local](#-instalação-local)
- [Configuração do Firebase](#-configuração-do-firebase)
- [Login e segurança](#-login-e-segurança)
- [Regras do Firestore](#-regras-do-firestore)
- [PWA — instalar no celular](#-pwa--instalar-no-celular)
- [Padrões brasileiros](#-padrões-brasileiros)
- [Dados de teste](#-dados-de-teste)
- [Plano Spark (sem custo)](#-plano-spark-sem-custo)
- [Deploy na Vercel](#-deploy-na-vercel)
- [Checklist antes de tornar o repositório público](#-checklist-antes-de-tornar-o-repositório-público)
- [Scripts e solução de problemas](#-scripts-e-solução-de-problemas)

---

## ✨ O que o sistema faz

- **Operação Café:** painel, produção (lotes, qualidade, unidade, saldo) e vendas.
- **Operação Queijos:** resumo, compras (kg, custo médio) e vendas.
- **CRUD completo** com confirmação de exclusão, filtros por período e autocomplete.
- **Exportação CSV** em padrão brasileiro (`;`, BOM UTF-8, vírgula decimal).
- **Tema café/queijo** na tela de login, com CAPTCHA leve e botão de mostrar senha.
- **Persistência da sessão** via Firebase Auth e opção de **salvar senha neste dispositivo**.
- **Instalável como app** no Android e iPhone direto pelo navegador (PWA).

---

## 🧱 Arquitetura isolada

| Negócio | Coleções Firestore | Módulo |
| --- | --- | --- |
| ☕ Café | `cafe_producao`, `cafe_vendas` | `src/modules/cafe/` |
| 🧀 Queijos | `queijos_compras`, `queijos_vendas`, `queijos_tipos` | `src/modules/queijos/` |

Não existe relatório consolidado que misture os dois negócios. A preferência de operação fica no `localStorage`.

**Estrutura principal**

```text
src/
  app/
    (app)/            # rotas autenticadas (cafe/, queijos/, configuracoes)
    api/captcha/      # CAPTCHA validado no servidor
    login/            # tela de acesso
  components/         # shell, UI, providers (service worker)
  lib/                # firebase, auth, firestore, formatação, CSV
  modules/            # cafe/ e queijos/ (lógica, tipos, views, seeds)
public/
  icons/              # ícones PWA (192, 512, maskable, apple-touch)
  manifest.webmanifest
  sw.js
```

---

## 🛠 Tecnologias

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 3 |
| Auth / DB | Firebase Auth + Cloud Firestore |
| Ícones | Lucide React |
| CAPTCHA | Desafio matemático assinado com HMAC (API Route) |
| Hospedagem | Vercel |

---

## 🚀 Instalação local

```bash
npm install
cp .env.example .env.local    # Windows: copy .env.example .env.local
# preencha as variáveis em .env.local
npm run dev
```

Abra **http://localhost:3000**. No terminal deve aparecer `Environments: .env.local`, confirmando que as variáveis foram carregadas.

### Variáveis de ambiente

No Firebase Console: **Configurações do projeto → Seus aplicativos → App Web → SDK setup (aba npm)**.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<chave-publica-do-app-web>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<seu-projeto>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<seu-projeto>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<seu-projeto>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=        # opcional

CAPTCHA_SECRET=<segredo-aleatorio-do-servidor>
```

- Use a aba **npm** do Firebase. **Não** cole a tag `<script>`: o projeto já importa o SDK via pacote.
- `CAPTCHA_SECRET` **não** tem prefixo `NEXT_PUBLIC_` e nunca chega ao navegador. Gere um valor longo e aleatório.
- `.env.local`, `.env`, `.env.*.local`, `.env.development` e `.env.production` estão no `.gitignore`. **Nunca** faça commit deles.
- `.env.example` contém apenas os nomes das variáveis, sem valores.

---

## 🔥 Configuração do Firebase

1. Crie o projeto em https://console.firebase.google.com. Mantenha o plano **Spark**.
2. **Adicionar app → Web** (`</>`). Não marque Firebase Hosting (a interface vai na Vercel).
3. Copie o `firebaseConfig` para o `.env.local` como na tabela acima.
4. **Authentication → Sign-in method:** ative **E-mail/Senha**.
5. **Authentication → Usuários → Adicionar usuário:** crie seu usuário manualmente. É o único que entra.
6. **Firestore Database → Criar banco de dados:** edição **Standard**, modo **Produção**, localização próxima (ex.: `southamerica-east1`) e banco **`(default)`**.
7. Publique as regras (veja abaixo). As coleções são criadas automaticamente no primeiro salvamento.
8. **Authentication → Settings → Authorized domains:** adicione o domínio da Vercel e um domínio customizado, se houver.

> Não use “modo teste” no Firestore. As regras abaixo já liberam o app e bloqueiam acesso anônimo.

---

## 🔐 Login e segurança

- **Sem cadastro público:** a interface não tem “criar conta”. O usuário é liberado manualmente no Firebase.
- **CAPTCHA:** desafio matemático gerado em `/api/captcha`, assinado com HMAC e válido por 5 minutos. Roda na Vercel, sem custo e sem Cloud Functions. Um novo desafio é gerado a cada tentativa.
- **Mostrar senha:** botão de olho no campo.
- **Salvar senha neste dispositivo:** quando marcado, e-mail e senha ficam no `localStorage` e os campos são preenchidos automaticamente. Desmarcar apaga os dados salvos.

> ⚠️ **A senha salva fica em texto simples no navegador.** Use apenas no seu dispositivo pessoal. Para uso comercial/público, troque por Turnstile/reCAPTCHA e desative a opção de salvar senha.

O CAPTCHA protege a **interface de login**. As regras do Firestore protegem os **dados** contra chamadas diretas à API do Firebase. As duas camadas se complementam.

---

## 📜 Regras do Firestore

**Recomendado — restrito ao seu UID** (substitua `<SEU_UID>` pelo UID copiado em Authentication → Usuários):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function meuUsuario() {
      return request.auth != null && request.auth.uid == '<SEU_UID>';
    }
    match /cafe_producao/{doc}   { allow read, write: if meuUsuario(); }
    match /cafe_vendas/{doc}     { allow read, write: if meuUsuario(); }
    match /queijos_compras/{doc} { allow read, write: if meuUsuario(); }
    match /queijos_vendas/{doc}  { allow read, write: if meuUsuario(); }
    match /queijos_tipos/{doc}   { allow read, write: if meuUsuario(); }
  }
}
```

**Mínimo aceitável** (qualquer usuário autenticado):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function autenticado() { return request.auth != null; }
    match /cafe_producao/{doc}   { allow read, write: if autenticado(); }
    match /cafe_vendas/{doc}     { allow read, write: if autenticado(); }
    match /queijos_compras/{doc} { allow read, write: if autenticado(); }
    match /queijos_vendas/{doc}  { allow read, write: if autenticado(); }
    match /queijos_tipos/{doc}   { allow read, write: if autenticado(); }
  }
}
```

> Mesmo com o repositório público, a `apiKey` Web é pública por design. Se usar o UID nas regras, outra pessoa que criar conta no projeto **não consegue** ler ou alterar seus dados.

---

## 📱 PWA — instalar no celular

O site é instalável como app, com ícone próprio e tela cheia (sem barra do navegador).

- **Android (Chrome):** menu do navegador → **Instalar app** / **Adicionar à tela inicial**.
- **iPhone (Safari):** botão **Compartilhar** → **Adicionar à Tela de Início**.

Requisitos: HTTPS (a Vercel já fornece) e domínio autorizado no Firebase.

O service worker (`public/sw.js`) cacheia **apenas estáticos**: `/_next/static/`, manifest e ícones. Ele **nunca** cacheia `/api/`, Authentication, Firestore nem HTML de rotas — assim login e dados não ficam antigos. O registro só acontece em produção (não atrapalha `npm run dev`).

---

## 🇧🇷 Padrões brasileiros

| Item | Formato |
| --- | --- |
| Moeda | `R$ 1.234,56` |
| Datas | `DD/MM/AAAA` |
| Decimais | `1.234,56` (aceita vírgula ou ponto nos campos) |
| CSV | separador `;`, BOM UTF-8, vírgula decimal (Excel pt-BR) |

---

## 🧪 Dados de teste

Botão **Carregar dados de teste** disponível em:

- Resumo/Painel quando roda `npm run dev`;
- Página **Configurações** em qualquer ambiente.

Os registros vão somente para as coleções da operação ativa. Não repita em produção.

---

## 💰 Plano Spark (sem custo)

O projeto não usa Cloud Functions, Cloud Storage, banco nomeado, TTL, PITR nem backup automático. Interface e CAPTCHA rodam na Vercel.

Limites do Firestore **Standard / banco `(default)`**:

| Recurso | Cota gratuita |
| --- | --- |
| Leituras | 50.000 / dia |
| Escritas | 20.000 / dia |
| Exclusões | 20.000 / dia |
| Armazenamento | 1 GiB |
| Transferência de saída | 10 GiB / mês |

Boas práticas: use filtros de período, evite várias abas abertas (cada listener conta leituras), exporte CSV como backup manual e não rode seeds em produção.

---

## 🌐 Deploy na Vercel

1. Faça push do repositório para GitHub/GitLab/Bitbucket.
2. **Add New → Project** e importe o repositório. O Next.js é detectado automaticamente; não mexa no build command.
3. Em **Settings → Environment Variables**, cadastre todas as variáveis do `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_*` como **Config**;
   - `CAPTCHA_SECRET` como **Secret**.
   - Marque **Production, Preview e Development**.
4. **Deploy** e, se as variáveis foram adicionadas depois do primeiro build, faça **Redeploy** (variáveis `NEXT_PUBLIC_*` são embutidas no build).
5. Adicione o domínio da Vercel em **Firebase → Authentication → Settings → Authorized domains**.

> Aviso da Vercel sobre `NEXT_PUBLIC_...API_KEY`: é esperado. A chave Web do Firebase é pública; a segurança vem do Auth e das regras do Firestore.

---

## ✅ Checklist antes de tornar o repositório público

- [ ] Nenhum `.env`, `.env.local` ou arquivo `serviceAccount`/`adminsdk` no Git.
- [ ] `.env.example` sem valores reais.
- [ ] `CAPTCHA_SECRET` apenas no `.env.local` e na Vercel (tipo **Secret**).
- [ ] Regras do Firestore publicadas com restrição por UID (recomendado).
- [ ] Domínio da Vercel em **Authorized domains**.
- [ ] Segredo rotacionado caso tenha sido compartilhado em chat/e-mail.

---

## 🧰 Scripts e solução de problemas

```bash
npm run dev        # desenvolvimento (http://localhost:3000)
npm run build      # build de produção (validação para Vercel)
npm start          # serve o build localmente
npm run typecheck  # checagem TypeScript
```

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| “Firebase não configurado” na Vercel | Variáveis não cadastradas ou build antigo | Conferir Environment Variables e fazer Redeploy |
| “Firebase não configurado” no local | `.env.local` vazio ou servidor iniciado antes de preencher | Parar com `Ctrl+C`, preencher e rodar `npm run dev` |
| CAPTCHA não carrega | `CAPTCHA_SECRET` ausente ou rota `/api/captcha` indisponível | Conferir variável e logs da Vercel |
| Login recusa usuário | Usuário não criado ou Auth desativado | Firebase → Authentication → Usuários / Sign-in method |
| Dados não aparecem | Regras não publicadas ou domínio não autorizado | Publicar regras e adicionar domínio |

---

Feito para uso pessoal, com foco em simplicidade, isolamento entre os negócios e zero custo no Firebase.
