# 🚀 Fly Way Delivery — Guia de Configuração Completo

## Visão Geral do Sistema

O **Sistema de Gestão Logística Fly Way Delivery** é uma aplicação Web que usa:
- **Google Sheets** como base de dados
- **Google Apps Script** como backend (API)
- **HTML/CSS/JS** como frontend (interface do utilizador)

---

## PASSO 1 — Criar a Google Sheets

1. Aceda a [sheets.google.com](https://sheets.google.com)
2. Clique em **"+ Em branco"** para criar uma nova folha
3. Renomeie a planilha para: `Fly Way Delivery — Gestão`

---

## PASSO 2 — Criar as Abas da Planilha

A planilha precisa de **3 abas** com os nomes exactos abaixo:

### Aba 1: `Pedidos`
Clique no `+` na parte inferior e crie a aba `Pedidos`.
Na linha 1, insira os seguintes cabeçalhos (uma coluna cada):

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| ID | Data ou Hora | Cliente | Contacto | Localização | Tipo | PIN | Valor Taxa | Status | Motoboy | Observações |

### Aba 2: `Clientes`
Crie a aba `Clientes` com:

| A | B |
|---|---|
| Nome | Contacto |

### Aba 3: `Motoboys`
Crie a aba `Motoboys` com:

| A | B | C |
|---|---|---|
| Nome | Contacto | Status |

> 💡 **Dica rápida**: Depois do PASSO 4, pode usar o menu **"🚀 Fly Way Delivery → Inicializar Planilhas"** para criar todas as abas automaticamente!

---

## PASSO 3 — Abrir o Editor de Apps Script

1. Na planilha aberta, clique em **"Extensões"** (menu superior)
2. Clique em **"Apps Script"**
3. Irá abrir o editor de código numa nova aba

---

## PASSO 4 — Adicionar o Backend (Código.gs)

1. No editor de Apps Script, verá um ficheiro chamado `Código.gs`
2. **Apague todo o conteúdo** existente
3. **Cole todo o conteúdo** do ficheiro `Code_Backend_AppsScript.js` fornecido
4. Clique em **💾 (Guardar)** ou pressione `Ctrl+S`

---

## PASSO 5 — Adicionar o Frontend (Index.html)

1. No editor de Apps Script, clique em **"+"** à esquerda (junto a "Ficheiros")
2. Escolha **"HTML"**
3. Nomeie o ficheiro exactamente: `Index` (sem extensão — o Apps Script adiciona `.html` automaticamente)
4. **Apague todo o conteúdo** do ficheiro HTML criado
5. **Cole todo o conteúdo** do ficheiro `Index_Frontend.html` fornecido
6. Clique em **💾 (Guardar)**

> ⚠️ O nome do ficheiro HTML DEVE ser `Index` (com I maiúsculo), caso contrário o backend não o encontrará.

---

## PASSO 6 — Publicar como Web App

1. No editor de Apps Script, clique em **"Implementar"** (canto superior direito)
2. Clique em **"Nova implementação"**
3. Clique no ícone de engrenagem ⚙️ e escolha **"Web App"**
4. Configure as opções:
   - **Descrição**: `Fly Way Delivery v1.0`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem tem acesso**: `Qualquer pessoa` (para acesso interno) ou `Qualquer pessoa com conta Google`
5. Clique em **"Implementar"**
6. Autorize as permissões quando solicitado (clique em "Permitir")
7. Copie o **URL da Web App** fornecido — esse é o link do sistema!

---

## PASSO 7 — Inicializar as Planilhas (Opcional mas Recomendado)

1. Volte à Google Sheets
2. Recarregue a página (F5)
3. Verá um novo menu **"🚀 Fly Way Delivery"** na barra de menus
4. Clique em **"🚀 Fly Way Delivery → Inicializar Planilhas"**
5. As abas serão criadas e formatadas automaticamente

---

## Credenciais de Acesso

O sistema tem dois perfis de acesso:

| Perfil | Username | Senha | Permissões |
|--------|----------|-------|------------|
| **Administrador** | `admin` | `flyway@2025` | Acesso total: dashboard, pedidos, motoboys, relatório, eliminar registos |
| **Assistente** | `assistente` | `assist@123` | Dashboard, novo pedido, pedidos (sem eliminar), motoboys; sem acesso a relatório |

> 🔐 **Para alterar as credenciais**: No ficheiro `Code_Backend_AppsScript.js`, edite o bloco `CREDENTIALS` no início do ficheiro e reimplemente a Web App.

---

## Como Usar o Sistema

### 📊 Dashboard
- Mostra estatísticas em tempo real: total de pedidos, pendentes, em rota, entregues
- Gráfico de pedidos por tipo
- Lista dos últimos pedidos registados

### 📦 Novo Pedido
1. Preencha todos os campos obrigatórios (marcados com *)
2. Seleccione o tipo de pedido (Encomenda, Comida, Documento, Outro)
3. Seleccione o motoboy disponível (opcional, pode atribuir depois)
4. Clique em "Registar Pedido"
5. O sistema gera automaticamente um **PIN de 6 dígitos** — anote-o para o cliente

### 📋 Gestão de Pedidos
- **Pesquise** por cliente, ID ou contacto
- **Filtre** por status (Pendente, Em Rota, Entregue, Cancelado)
- Clique em ✏️ para actualizar o status e atribuir motoboy
- Administradores podem eliminar pedidos (🗑️)

### 🏍️ Central MotoBoy
- Adicione novos motoboys com nome e contacto
- Mude o status entre **Disponível** e **Ocupado** com um clique
- Apenas motoboys Disponíveis aparecem na lista de atribuição de pedidos

### 📈 Relatório *(apenas Administrador)*
- Filtre por intervalo de datas, status e tipo
- Veja totais de receita e contagem de pedidos
- Exporte mentalmente os dados ou use o botão "Gerar Relatório"

---

## Actualizar a Web App Após Alterações

Sempre que editar o código (backend ou frontend):
1. No editor de Apps Script, clique em **"Implementar"**
2. Clique em **"Gerir implementações"**
3. Clique no ✏️ (editar) da implementação existente
4. Em **"Versão"**, escolha **"Nova versão"**
5. Clique em **"Implementar"**

---

## Estrutura dos Ficheiros

```
📁 Apps Script Project
│
├── Código.gs          ← Backend: toda a lógica de servidor
│   ├── login()
│   ├── getPedidos(), addPedido(), updatePedidoStatus(), deletePedido()
│   ├── getClientes(), upsertCliente(), deleteCliente()
│   ├── getMotoboys(), addMotoboy(), updateMotoboyStatus(), deleteMotoboy()
│   ├── getDashboardData(), getRelatorio()
│   └── inicializarPlanilhas()
│
└── Index.html         ← Frontend: interface completa (HTML+CSS+JS)
    ├── Login Page
    ├── Dashboard
    ├── Novo Pedido
    ├── Gestão de Pedidos
    ├── Central MotoBoy
    └── Relatório
```

---

## Resolução de Problemas

| Problema | Solução |
|----------|---------|
| "Aba 'Pedidos' não encontrada" | Execute "Inicializar Planilhas" no menu da planilha |
| Login não funciona | Verifique se o código foi guardado e a Web App foi reimplementada |
| Dados não carregam | Verifique as permissões da Web App (deve ser "Qualquer pessoa") |
| Erro ao guardar pedido | Confirme que as abas têm exactamente os nomes: `Pedidos`, `Clientes`, `Motoboys` |
| Página em branco | Confirme que o ficheiro HTML se chama exactamente `Index` |

---

## Informações Técnicas

- **Plataforma**: Google Apps Script (serverless)
- **Base de dados**: Google Sheets (gratuito)
- **Autenticação**: Sistema próprio (username/password no código)
- **Compatibilidade**: Desktop (Chrome, Firefox, Edge) e Mobile (iOS/Android)
- **Custo**: Gratuito dentro dos limites do Google Workspace

---

*Sistema desenvolvido para Fly Way Delivery · Versão 1.0 · 2025*
