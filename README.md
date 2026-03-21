# 🏆 Honra ao Mérito

> _"Porque todo dev merece ser lembrado pelas suas façanhas — sejam elas gloriosas ou deploráveis."_

**Honra ao Mérito** é um sistema web de conquistas e méritos engraçados para equipes de desenvolvimento de software. Funciona 100% estático hospedado no **GitHub Pages**, usando a **GitHub Contents API** para persistir os dados diretamente no repositório — sem backend, sem banco de dados externo, sem dependências pagas.

---

## 🎖️ Méritos Padrão

| Emoji | Nome | Descrição |
|-------|------|-----------|
| 🖥️ | Works on my Machine | A desculpa padrão de todos os tempos. |
| 🔥 | Testador em Produção | Para quem sempre pula o ambiente de homologação. |
| 🗄️ | Senhor do Cache | Sempre acusa o Redis e acha que flush resolve tudo. |
| 🐍 | Pythonista Purista | Quer resolver absolutamente tudo com um script Python. |
| 💀 | Sobrevivente do MySQL | Fez um UPDATE ou DELETE sem WHERE e continua empregado. |
| 📅 | Commitador de Sexta | O corajoso que adora deploy no fim do expediente. |
| 📋 | Ctrl+C / Ctrl+V | Sênior especializado em respostas do Stack Overflow e do Gepeto. |
| ♾️ | Refatorador Infinito | Reescreve o código três vezes e nunca entrega a feature. |
| 🎰 | GDD - Gambiarra Driven Dev | Especialista em soluções temporárias que duram para sempre. |

Você também pode criar méritos customizados pela interface de admin!

---

## 🚀 Como Configurar

### Passo 1 — Fazer fork do repositório

1. Acesse a página do repositório original no GitHub
2. Clique no botão **"Fork"** no canto superior direito
3. Escolha sua conta pessoal ou organização
4. Clique em **"Create fork"**

---

### Passo 2 — Criar um GitHub Personal Access Token (PAT)

O sistema precisa de um PAT para escrever no `data/db.json` via API.

1. No GitHub, clique na sua **foto de perfil** (canto superior direito)
2. Vá em **"Settings"**
3. No menu lateral esquerdo, role até o final e clique em **"Developer settings"**
4. Clique em **"Personal access tokens"** > **"Tokens (classic)"**
5. Clique em **"Generate new token"** > **"Generate new token (classic)"**
6. Em **"Note"**, escreva algo como `honra-ao-merito`
7. Em **"Expiration"**, escolha o prazo desejado (recomendado: 90 dias ou sem expiração)
8. Em **"Select scopes"**, marque:
   - ✅ `repo` — necessário para repositórios **privados**
   - ✅ `public_repo` — suficiente para repositórios **públicos**
9. Clique em **"Generate token"**
10. **Copie o token imediatamente** — ele não será exibido novamente

> ⚠️ **Segurança:** Guarde o token em local seguro. Veja a seção [Aviso de Segurança](#-aviso-de-segurança) abaixo.

---

### Passo 3 — Configurar o `js/config.js`

```bash
# Clone o repositório (substitua SEU-USUARIO pelo seu usuário do GitHub)
git clone https://github.com/SEU-USUARIO/honra-ao-merito.git
cd honra-ao-merito

# Copie o template de configuração
cp config.example.js js/config.js
```

Abra o arquivo `js/config.js` no seu editor e preencha todos os campos:

```javascript
const CONFIG = {
  GITHUB_OWNER: "seu-usuario",        // Seu usuário ou organização no GitHub
  GITHUB_REPO: "honra-ao-merito",     // Nome do repositório após o fork
  GITHUB_BRANCH: "main",
  GITHUB_PAT: "ghp_SEU_TOKEN_AQUI",  // Token gerado no Passo 2

  TEAM_PASSWORD: "suasenha123",       // Senha para acessar o admin

  MEMBERS: [
    { id: "joao",  name: "João Silva",  avatar: "🧑‍💻" },
    { id: "maria", name: "Maria Costa", avatar: "👩‍💻" }
    // Adicione um objeto por membro da equipe
  ]
};
```

> **Importante:** O `id` de cada membro deve ser único e sem espaços ou caracteres especiais.

---

### Passo 4 — Inicializar o `data/db.json`

O banco de dados precisa existir no repositório antes do primeiro uso. Escolha um dos métodos:

#### Método 1 — Pela interface do GitHub (recomendado)

1. Acesse o repositório **forkado** no GitHub
2. Clique em **"Add file"** > **"Create new file"**
3. No campo de nome, digite exatamente: `data/db.json`
   - A barra `/` faz o GitHub criar a pasta `data` automaticamente
4. No editor de texto, cole:
   ```json
   {
     "members": [],
     "customMerits": [],
     "merits": []
   }
   ```
5. Em **"Commit new file"**, escreva a mensagem: `chore: inicializa banco de dados`
6. Confirme que está commitando na branch `main`
7. Clique em **"Commit changes"**

#### Método 2 — Via linha de comando

```bash
# Crie a pasta e o arquivo
mkdir -p data
cat > data/db.json << 'EOF'
{
  "members": [],
  "customMerits": [],
  "merits": []
}
EOF

# Commit e push
git add data/db.json
git commit -m "chore: inicializa banco de dados"
git push origin main
```

#### Regras de integridade do `db.json`

- O arquivo **deve existir** antes do primeiro uso — o sistema não o cria automaticamente
- Os campos `members`, `customMerits` e `merits` são **obrigatórios**, mesmo que vazios
- Em caso de corrupção, restaure via histórico do Git:
  ```bash
  git log -- data/db.json           # Ver histórico do arquivo
  git show HASH:data/db.json        # Inspecionar uma versão específica
  git checkout HASH -- data/db.json # Restaurar uma versão específica
  ```
- **Nunca edite o `db.json` diretamente no GitHub** enquanto alguém estiver usando o sistema — há risco de conflito de SHA

---

### Passo 5 — Ativar o GitHub Pages

1. No repositório forkado, acesse **"Settings"** (engrenagem no menu superior)
2. No menu lateral esquerdo, clique em **"Pages"**
3. Em **"Build and deployment"**, no campo **"Source"**, selecione **"GitHub Actions"**
   - ⚠️ **Não** selecione "Deploy from a branch" — use obrigatoriamente "GitHub Actions"
4. Não é necessário selecionar nenhum workflow — o arquivo `.github/workflows/deploy.yml` já cuida de tudo
5. Salve e aguarde o primeiro deploy

---

### Passo 6 — Fazer o primeiro deploy

```bash
# Commite o js/config.js (que está no .gitignore por segurança)
# ATENÇÃO: só faça isso em repositório PRIVADO
git add js/config.js
git commit -m "chore: adiciona configuração do sistema"
git push origin main
```

> **Para repositórios públicos:** Não commite o `js/config.js` com o PAT real. Configure o arquivo localmente e acesse o sistema pelo GitHub Pages — o browser carrega o `js/config.js` do servidor e não expõe o arquivo ao Git.

Após o push, acesse a aba **"Actions"** do repositório para acompanhar o deploy.

---

## 🔧 Como Usar

### Acessar o sistema

Após o deploy, a URL do seu site será:
```
https://SEU-USUARIO.github.io/honra-ao-merito/
```

### Dar um mérito

1. Clique no botão flutuante **"+ Dar Mérito"** na página principal
2. Digite a senha da equipe (configurada em `TEAM_PASSWORD`)
3. Na aba **"Conceder Mérito"**:
   - Selecione quem está recebendo
   - Selecione o mérito
   - Adicione um comentário (opcional)
   - Informe seu nome
4. Clique em **"Conceder Mérito 🏅"**
5. Aproveite a animação de confetti! 🎉

### Criar um mérito customizado

1. Acesse `/admin.html` e autentique-se
2. Vá para a aba **"✨ Criar Mérito"**
3. Preencha nome, descrição, emoji, cores e formato
4. O preview é atualizado em tempo real
5. Clique em **"Criar Mérito ✨"**

### Ver o perfil de um membro

- Clique no card do membro no ranking da página principal
- Ou acesse diretamente: `profile.html?id=ID_DO_MEMBRO`

---

## ⚙️ GitHub Actions — Deploys Automáticos

### Comportamento esperado

- Qualquer `git push` na branch `main` dispara automaticamente um novo deploy (~30–60 segundos)
- Alterações no `db.json` feitas via sistema **não** disparam o workflow — o site lê o JSON em runtime, não no build
- O histórico de todos os deploys fica na aba **"Actions"**

### Diagnóstico de erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `HttpError: Resource not accessible by integration` | GitHub Pages não ativado ou Source não está como "GitHub Actions" | Veja o Passo 5 |
| `Error: No such file or directory` | Arquivo referenciado no workflow não existe | Verifique se todos os arquivos foram commitados |
| `Deployment failed` | Erro genérico | Clique no job na aba Actions para ver o log completo |

### Redeploy manual

Para forçar um redeploy sem alterar código:
1. Acesse a aba **"Actions"** do repositório
2. Clique em **"Deploy Honra ao Mérito"** no menu lateral
3. Clique em **"Run workflow"** > **"Run workflow"**

---

## 🎨 Como os Badges Funcionam

Os badges são gerados dinamicamente como **SVG inline** pelo módulo `badge-generator.js`, sem imagens estáticas.

### Formatos disponíveis

| Valor | Visual |
|-------|--------|
| `hexagon` | Hexágono (padrão) |
| `shield` | Escudo |
| `circle` | Círculo |
| `star` | Estrela de 5 pontas |

### Estados dos badges

- **Normal:** cores configuradas + efeito glow na borda via SVG filter
- **Locked (não conquistado):** `filter: grayscale(1); opacity: 0.35` — aparece desbloqueado na vitrine de perfil
- **Com contador:** pill dourado sobreposto no canto superior direito (ex: `×3`)

### Adicionando méritos padrão

Para adicionar à lista padrão (presente em todos os forks), edite o array `MERITS` em `js/config.js`:

```javascript
{
  key: "meu_merit",            // Chave única (snake_case)
  emoji: "🚀",
  title: "Nome do Mérito",
  description: "Descrição engraçada.",
  badge: {
    backgroundColor: "#0d1117",
    borderColor: "#39d353",
    textColor: "#e6edf3",
    shape: "hexagon"           // hexagon | shield | circle | star
  }
}
```

---

## ⚠️ Aviso de Segurança

**O PAT do GitHub fica exposto no arquivo `js/config.js` servido pelo GitHub Pages.** Qualquer pessoa que acesse o código-fonte do site pode ver o token.

**Recomendações:**

1. **Use um repositório privado** — o código não fica visível publicamente
2. **Use o escopo mínimo necessário:**
   - Repositório público: escopo `public_repo`
   - Repositório privado: escopo `repo`
3. **Configure expiração no PAT** — prefira tokens com prazo de validade
4. **Nunca commite o `js/config.js`** em repositórios públicos — ele está no `.gitignore` por padrão
5. Se o token for comprometido: acesse GitHub > Settings > Developer settings > Personal access tokens > Revogue o token imediatamente

---

## 📁 Estrutura de Arquivos

```
/
├── index.html              # Página principal: feed e ranking
├── profile.html            # Perfil individual com vitrine de badges
├── admin.html              # Admin: dar méritos, criar e gerenciar (protegido por senha)
├── css/
│   └── style.css           # Estilos globais (dark mode, tema GitHub)
├── js/
│   ├── config.js           # ⚠️ Configurações com PAT e senha (não commitar)
│   ├── github-api.js       # Leitura e escrita via GitHub Contents API
│   ├── auth.js             # Autenticação por senha de equipe (sessionStorage)
│   ├── app.js              # Lógica da página principal
│   ├── profile.js          # Lógica da página de perfil
│   ├── admin.js            # Lógica do painel de admin (3 abas)
│   ├── badge-generator.js  # Geração de badges SVG dinâmicos
│   └── celebration.js      # Animação de confetti + modal de celebração
├── data/
│   └── db.json             # Banco de dados (lido e escrito via API em runtime)
├── .github/
│   └── workflows/
│       └── deploy.yml      # Deploy automático no GitHub Pages
├── config.example.js       # Template de configuração (commitado, sem dados reais)
├── .gitignore              # Ignora js/config.js
└── README.md               # Esta documentação
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga o padrão de **Conventional Commits**:

| Tipo | Quando usar |
|------|-------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Alteração na documentação |
| `chore:` | Tarefas de manutenção, configuração |
| `style:` | Alterações de CSS/visual sem mudança de lógica |
| `refactor:` | Refatoração sem mudança de comportamento |

Exemplos:
```bash
git commit -m "feat: adiciona suporte a avatar personalizado no perfil"
git commit -m "fix: corrige conflito de SHA ao conceder mérito simultâneo"
git commit -m "docs: atualiza passo a passo de configuração do PAT"
```

---

## 📄 Licença

MIT — faça bom uso e que seus deploys de sexta sejam sempre seguros. 🙏
