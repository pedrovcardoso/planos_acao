# Documentação Completa - Modal de Ações (modalAcoes.js)

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura e Estrutura](#arquitetura-e-estrutura)
3. [Estados Globais](#estados-globais)
4. [Modos de Operação](#modos-de-operação)
5. [Fluxos Principais](#fluxos-principais)
6. [Sistema de Notificações](#sistema-de-notificações)
7. [Histórico de Datas](#histórico-de-datas)
8. [Modais Secundários](#modais-secundários)
9. [Validações e Regras de Negócio](#validações-e-regras-de-negócio)
10. [Integração com APIs](#integração-com-apis)
11. [Referência de Funções](#referência-de-funções)

---

## Visão Geral

O **modalAcoes.js** é um componente modal complexo responsável pela criação, visualização e edição de ações dentro do sistema de Planos de Ação. Este modal oferece:

- **Dois modos principais**: Visualização e Edição
- **Sistema de notificações**: Criação e gerenciamento de alertas automáticos
- **Histórico de datas**: Rastreamento de mudanças em prazos
- **Validações inteligentes**: Sugestões automáticas baseadas em datas
- **Sincronização com OneDrive**: Persistência de dados via API

---

## Arquitetura e Estrutura

### Estrutura HTML

O modal é composto por 7 seções principais:

```
task-modal-root/
├── task-container (Modal Principal)
│   ├── Header (Dinâmico: View/Edit)
│   ├── task-view-mode-content (Modo Visualização)
│   ├── task-edit-mode-content (Modo Edição)
│   └── Footer (Botões de ação)
├── task-confirmation-modal (Confirmação de Descarte)
├── task-delete-confirmation-modal (Confirmação de Exclusão)
├── task-date-change-confirmation-modal (Confirmação de Notificações)
├── task-history-modal (Gestão de Histórico)
└── task-history-prompt-modal (Prompt para Salvar Histórico)
```

### Hierarquia de Z-Index

- **Modal Principal**: z-50
- **Confirmação de Descarte**: z-60
- **Confirmação de Exclusão**: z-60
- **Confirmação de Notificações**: z-70
- **Modal de Histórico**: z-80
- **Prompt de Histórico**: z-90

---

## Estados Globais

O modal mantém 7 variáveis de estado globais:

### 1. `task_current` (Object | null)
Armazena os dados da ação sendo visualizada/editada:
```javascript
{
  ID: string,
  Atividade: string,
  "Descrição da atividade": string,
  "Número da atividade": string,
  Status: string,
  "Plano de ação": string,
  "Data de início": string (YYYY-MM-DD),
  "Data fim": string (YYYY-MM-DD),
  Observações: string,
  Unidades: Array<string>,
  "Datas anteriores": Array<{inicio, fim, motivo}>
}
```

### 2. `task_hasChanges` (Boolean)
Controla se houve alterações no formulário.
- **Inicializado**: `false`
- **Ativado**: Ao modificar qualquer campo ou notificação
- **Usado**: Para exibir modal de confirmação ao cancelar

### 3. `task_isNewMode` (Boolean)
Indica se está criando uma nova ação.
- `true`: Modo criação (sem ID)
- `false`: Modo edição (com ID existente)

### 4. `task_deletedNotificationIds` (Array<string>)
Armazena IDs de notificações excluídas para deleção no backend.

### 5. `task_initialDates` (Object)
Preserva as datas originais para detectar mudanças:
```javascript
{
  inicio: string,
  fim: string
}
```

### 6. `task_editHistoryIndex` (Number)
Controla se está editando entrada do histórico:
- `-1`: Adicionando nova entrada
- `>= 0`: Editando entrada existente

### 7. `task_pendingSaveData` (Object | null)
Armazena dados durante o fluxo de prompt de histórico.

---

## Modos de Operação

### Modo 1: Visualização (View Mode)

**Ativado por**: `openTaskModal(taskId)` ou `task_switchToViewMode()`

**Elementos Visíveis**:
- ✅ `task-view-mode-content`
- ✅ `task-header-view`
- ✅ `task-view-mode-buttons` (Fechar, Editar)
- ✅ `task-btn-delete-task`

**Elementos Ocultos**:
- ❌ `task-edit-mode-content`
- ❌ `task-header-edit`
- ❌ `task-edit-mode-buttons`

**Funcionalidades Disponíveis**:
1. Visualização de dados formatados
2. Exibição de status com cores
3. Lista de unidades responsáveis
4. Visualização de notificações (editable + sent)
5. Acesso ao histórico (se existir)
6. Botões: **Editar** e **Excluir**

**Renderização de Dados**:
```javascript
// Status com cores dinâmicas
- Concluído: bg-green-100 text-green-800
- Em Andamento: bg-blue-100 text-blue-800
- Atrasado: bg-red-100 text-red-800
- Planejado: bg-yellow-100 text-yellow-800

// Datas formatadas
Formato: DD/MM/YYYY (pt-BR)

// Notificações
Ordenadas por data crescente
Exibe: Tipo, Data, Status, Destinatários
```

### Modo 2: Edição (Edit Mode)

**Ativado por**: `task_switchToEditMode()` ou `openCreateTaskModal()`

**Elementos Visíveis**:
- ✅ `task-edit-mode-content`
- ✅ `task-header-edit`
- ✅ `task-edit-mode-buttons` (Cancelar, Salvar)
- ✅ `task-btn-delete-task`

**Elementos Ocultos**:
- ❌ `task-view-mode-content`
- ❌ `task-header-view`
- ❌ `task-view-mode-buttons`

**Funcionalidades Disponíveis**:
1. Edição de todos os campos da ação
2. Seleção de plano de ação (dropdown dinâmico)
3. Multi-seleção de unidades (baseado no plano)
4. Adição/edição/exclusão de notificações
5. Acesso ao gerenciamento de histórico
6. Validações em tempo real

**Campos Editáveis**:
- Atividade (text)
- Descrição (textarea)
- Número da atividade (text)
- Status (select)
- Plano de ação (select)
- Data de início (date)
- Data fim (date)
- Observações (textarea)
- Unidades (multi-select customizado)

---

## Fluxos Principais

### Fluxo 1: Abrir Modal para Visualização

```
[Trigger] Clique em elemento com data-open-task="<taskId>"
    ↓
[setupTaskModalLogic] Event listener detecta o clique
    ↓
[openTaskModal(taskId)] 
    ↓
Busca ação em window.jsonAcoes
    ↓
Define estados globais:
    - task_current = action
    - task_isNewMode = false
    - task_hasChanges = false
    - task_deletedNotificationIds = []
    - task_initialDates = {inicio, fim}
    ↓
[task_switchToViewMode()]
    ↓
Renderiza:
    - Dados da ação
    - Status com cor
    - Unidades
    - Notificações (task_renderNotificationsViewList)
    - Botão de histórico (condicional)
    ↓
Exibe modal (remove class 'hidden')
Bloqueia scroll (add 'overflow-hidden' no body)
```

### Fluxo 2: Criar Nova Ação

```
[Trigger] openCreateTaskModal(defaultPlanoName)
    ↓
Cria objeto task_current com valores vazios
Status padrão: 'Planejado'
    ↓
Define estados:
    - task_isNewMode = true
    - task_hasChanges = false
    - task_deletedNotificationIds = []
    - task_initialDates = {inicio: '', fim: ''}
    ↓
[task_switchToEditMode()]
    ↓
Renderiza formulário vazio
Popula dropdown de planos
    ↓
Exibe modal em modo edição
```

### Fluxo 3: Editar Ação Existente

```
[Visualização] Usuário clica em "Editar"
    ↓
[task_switchToEditMode()]
    ↓
Preenche formulário com dados de task_current:
    - Campos de texto
    - Selects
    - Datas
    ↓
[task_atualizarUnidades(planoNome, unidadesIniciais)]
    ↓
Cria multi-select de unidades baseado no plano
Marca unidades selecionadas
    ↓
[task_renderNotificationsEditList(taskId)]
    ↓
Renderiza notificações editáveis
Define task_hasChanges = false
    ↓
Usuário pode editar campos
    ↓
Event listener 'input' no form → task_hasChanges = true
```

### Fluxo 4: Salvar Ação

```
[Edição] Usuário clica em "Salvar"
    ↓
[task_handleSave()]
    ↓
Coleta dados do FormData
Adiciona valores do multi-select
    ↓
[task_getNotificationsDataFromDOM()]
Valida: todas notificações têm data?
    ↓
NÃO → Exibe erro e para
SIM → Continua
    ↓
Verifica mudança de datas (task_initialDates vs novas)
    ↓
[SE MUDOU]
    task_pendingSaveData = updatedTask
    [task_showHistoryPromptModal()]
        ↓
    Usuário decide: Registrar mudança?
        ↓
    [task_handleHistoryPrompt(confirmed)]
        ↓
    SE SIM: Adiciona entrada em "Datas anteriores"
    SE NÃO: Não adiciona
        ↓
[CONTINUA]
    ↓
[task_performSave(updatedTask)]
    ↓
Desabilita interatividade (task_togglePageInteractivity)
Muda texto do botão → "Salvando..."
    ↓
Prepara "Datas anteriores":
    - Novo: Cria array com registro inicial
    - Edição: Preserva existente
    ↓
Define action: 'create' ou 'update'
    ↓
[API] salvarArquivoNoOneDrive(id, 'acoes.txt', action, updatedTask, 'jsonAcoes')
    ↓
SUCESSO?
    ↓
Obtém newTaskId
    ↓
Salva notificações:
    FOR cada notificação SEM ID:
        API create
    FOR cada notificação COM ID (se mudou):
        Compara originalData vs currentData
        SE diferente: API update
    FOR cada ID em task_deletedNotificationIds:
        API delete
    ↓
window.location.reload()
    ↓
ERRO?
    ↓
Exibe erro
Reabilita interatividade
Restaura botão
```

### Fluxo 5: Cancelar Edição

```
[Edição] Usuário clica em "Cancelar"
    ↓
[task_switchToViewMode(force=false)]
    ↓
task_hasChanges === true?
    ↓
SIM:
    Exibe modal de confirmação
    "Descartar Alterações?"
        ↓
    Usuário clica "Sim" → task_switchToViewMode(force=true)
    Usuário clica "Não" → Fecha modal de confirmação
    ↓
NÃO:
    ↓
task_isNewMode === true?
    ↓
SIM: Fecha modal completamente (task_closeModal)
NÃO: Volta para modo visualização
```

### Fluxo 6: Excluir Ação

```
[Visualização/Edição] Clique em "Excluir"
    ↓
[openDeleteConfirmationModalTask(task)]
    ↓
Exibe modal de confirmação
Mostra nome da ação
    ↓
Usuário escolhe:
    "Cancelar" → Fecha modal de confirmação
    "Sim, Excluir" → [task_handleDeleteTask()]
        ↓
    Desabilita interatividade
        ↓
    [API] salvarArquivoNoOneDrive(id, 'acoes.txt', 'delete', '', 'jsonAcoes')
        ↓
    SUCESSO: window.location.reload()
    ERRO: Alert + Reabilita interatividade
```

### Fluxo 7: Fechar Modal

```
Usuário clica em "Fechar" ou "X"
    ↓
[task_closeModal(force=false)]
    ↓
task_hasChanges === true?
    ↓
SIM: Exibe modal de confirmação
    Usuário confirma? → task_closeModal(force=true)
    ↓
NÃO (ou force=true):
    ↓
Esconde modal
Reseta form
Limpa estados globais
Remove 'overflow-hidden' do body
```

---

## Sistema de Notificações

### Tipos de Notificação

1. **Alerta de Início** (`inicio`)
   - Cor: Verde (bg-green-100 text-green-700)
   - Ícone: Seta para cima em círculo
   - Dispara: Na data de início da ação

2. **Alerta de Aviso** (`aviso`)
   - Cor: Azul céu (bg-sky-100 text-sky-700)
   - Ícone: Sino
   - Dispara: 7 dias antes da data fim (para ações > 30 dias)

3. **Alerta de Pendência** (`pendencia`)
   - Cor: Âmbar (bg-amber-100 text-amber-600)
   - Ícone: Triângulo de alerta
   - Dispara: 1 dia APÓS a data fim

### Estados de Notificação

- **`planejado`**: Editável, pode ser modificada/excluída
- **`enviado`**: Somente leitura, não pode ser editada
- **`cancelado`**: Somente leitura, exibe badge vermelho

### Fluxo: Adicionar Notificação Manual

```
[Edição] Clique em "Adicionar Notificação"
    ↓
[task_addNotificationItem({})]
    ↓
Clona template (#task-notification-template)
    ↓
Configura elementos editáveis:
    - Select de tipo (padrão: 'aviso')
    - Input de data (vazio)
    - Lista de destinatários (vazia inicialmente)
    - Botão "Excluir"
    - Botão "Marcar todos"
    ↓
[task_updateNotificationIcon('aviso', container)]
Aplica ícone e cores
    ↓
Anexa ao container
Define task_hasChanges = true
```

### Fluxo: Sugestão Automática de Notificações

#### Ao mudar Data de Início:
```
[focusout] no input #task-edit-data-inicio
    ↓
[task_gerenciarNotificacaoPorData(id, novaData, 'inicio')]
    ↓
Obtém notificações do DOM
    ↓
Existe notificação tipo 'inicio' com data idêntica?
    SIM → Retorna (nada a fazer)
    NÃO → Continua
    ↓
Existe alguma notificação tipo 'inicio'?
    ↓
SIM:
    Modal: "Atualizar Notificação?"
    "Deseja atualizar a data para [nova data]?"
        ↓
    Confirmado?
        [task_handleUpdateAndPruneNotifications('inicio', novaData)]
        - Atualiza primeira notificação do tipo
        - Remove duplicatas
        - Marca IDs excluídos
        ↓
NÃO:
    Modal: "Criar Notificação?"
    "Deseja criar uma nova com a data [nova data]?"
        ↓
    Confirmado?
        [task_addNotificationItem({tipo, data, ...})]
```

#### Ao mudar Data Fim:
```
[focusout] no input #task-edit-data-fim
    ↓
Calcula data de pendência: dataFim + 1 dia
    ↓
[task_gerenciarNotificacaoPorData(id, calculado, 'pendencia', fn)]
(Mesmo fluxo acima)
    ↓
[task_verificarNotificacaoLongoPrazo(id, dataInicio, dataFim)]
    ↓
Calcula diferença em dias
    ↓
> 30 dias?
    ↓
SIM:
    Calcula data aviso: dataFim - 7 dias
        ↓
    Existe notificação 'aviso' com essa data?
        SIM → Retorna
        NÃO → Prompt para criar/atualizar
```

### Fluxo: Excluir Notificação

```
[Edição] Clique no botão "Lixeira" em notificação
    ↓
Event bubbling detectado em #task-notifications-edit-list
    ↓
Identifica .btn-delete-notification mais próximo
    ↓
Encontra .container-notificacao
    ↓
[task_deleteNotification(el)]
    ↓
Tem ID? 
    SIM → Adiciona a task_deletedNotificationIds
    NÃO → (Notificação nova, apenas remove do DOM)
    ↓
el.remove()
Define task_hasChanges = true
```

### Fluxo: Popular Destinatários

```
[Seleção de Unidades ou Plano muda]
    ↓
window.onCustomSelectChange('task-unidades-multi-select')
    ↓
Para cada notificação editável:
    [task_populateTabelaNotificacoes(listEl, mailList)]
        ↓
    Obtém unidades selecionadas
    Obtém plano selecionado
        ↓
    Busca plano em window.jsonPlanos
    Filtra pessoas por unidades selecionadas
        ↓
    Sem plano? → "Selecione um plano primeiro."
    Sem pessoas? → "Selecione unidades para ver destinatários."
        ↓
    COM PESSOAS:
        Renderiza lista de checkboxes
        Para cada pessoa:
            - Nome
            - Email
            - Checkbox (checked se mailList vazio OU email está em mailList)
```

### Coleta de Dados de Notificações

```javascript
// task_getNotificationsDataFromDOM()

Seleciona: #task-notifications-edit-list .container-notificacao
Filtra: Apenas notificações com .status-slot.hidden (editáveis)

Para cada:
    Extrai:
        - ID (dataset.notificationId ou undefined)
        - idAcao (task_current.ID)
        - tipo (valor do select)
        - data (valor do input date)
        - mailList (emails dos checkboxes marcados)
        - status ('planejado')

Retorna array de objects
```

---

## Histórico de Datas

### Estrutura de Dados

```javascript
"Datas anteriores": [
  {
    inicio: "2024-01-15",
    fim: "2024-02-28",
    motivo: "Atraso devido a falta de recursos"
  },
  {
    inicio: "2024-02-01",
    fim: "2024-03-15",
    motivo: "Reprogramação acordada com a equipe"
  }
]
```

### Fluxo: Visualizar Histórico (Somente Leitura)

```
[Visualização] Clique em "Histórico de Datas"
(Botão visível apenas se existir histórico)
    ↓
[openTaskHistoryModal(isEditMode=false)]
    ↓
Define título: "Histórico de alteração de datas"
Oculta: #task-history-edit-content
    ↓
[task_renderHistoryModalContent(isEditMode=false)]
    ↓
Renderiza lista de registros:
    - Timeline vertical
    - Estado Atual no topo (bg-sky-50)
    - Registros anteriores abaixo
    - Cada item mostra: Início → Fim, Motivo
    - SEM botões de ação
    ↓
Exibe modal
```

### Fluxo: Gerenciar Histórico (Modo Edição)

```
[Edição] Clique em "Gerenciar Histórico de Datas"
    ↓
[openTaskHistoryModal(isEditMode=true)]
    ↓
Define título: "Gerenciar Linha do Tempo"
Exibe: #task-history-edit-content
    ↓
[task_renderHistoryModalContent(isEditMode=true)]
    ↓
Renderiza lista de registros COM botões:
    - Seta para cima (mover registro)
    - Seta para baixo (mover registro)
    - Ícone editar
    - Ícone deletar
    ↓
Exibe formulário de adição:
    - Input: Data Início
    - Input: Data Fim
    - Input: Motivo
    - Botão: Adicionar (+)
```

### Fluxo: Adicionar Entrada no Histórico

```
[Histórico - Edit] Preenche campos e clica no botão "+"
    ↓
[task_addHistoryEntryFromModal()]
    ↓
Valida: Tem pelo menos uma data?
    NÃO → [task_showHistoryError("Preencha...")]
    SIM → Continua
    ↓
task_editHistoryIndex >= 0?
    (Está editando entrada existente?)
    ↓
SIM:
    task_current["Datas anteriores"][index] = {inicio, fim, motivo}
    task_editHistoryIndex = -1
    Muda botão: Ícone de checkmark → Ícone de +
    Muda cor: bg-amber-500 → bg-sky-600
    ↓
NÃO:
    task_current["Datas anteriores"].push({inicio, fim, motivo})
    ↓
Define task_hasChanges = true
[task_renderHistoryModalContent(true)]
Limpa campos
Foca no primeiro input
```

### Fluxo: Editar Entrada do Histórico

```
[Histórico - Edit] Clique no botão "Editar" de um registro
    ↓
[task_editHistoryItem(index)]
    ↓
Obtém entrada: task_current["Datas anteriores"][index]
    ↓
Preenche formulário com dados da entrada
    ↓
Define: task_editHistoryIndex = index
    ↓
Modifica botão "Adicionar":
    - Ícone: + → checkmark
    - Cor: bg-sky-600 → bg-amber-500
    - Hover: hover:bg-sky-700 → hover:bg-amber-600
    ↓
Foca no primeiro input
    ↓
[Próximo clique no botão atualiza em vez de adicionar]
```

### Fluxo: Remover Entrada do Histórico

```
[Histórico - Edit] Clique no botão "Deletar" de um registro
    ↓
[task_removeHistoryItem(index)]
    ↓
task_current["Datas anteriores"].splice(index, 1)
    ↓
Define task_hasChanges = true
    ↓
[task_renderHistoryModalContent(true)]
```

### Fluxo: Reordenar Histórico

```
[Histórico - Edit] Clique em seta (↑ ou ↓)
    ↓
[task_moveHistoryItem(index, direction)]
    direction: -1 (subir) ou +1 (descer)
    ↓
Calcula newIndex = index + direction
    ↓
Valida limites (0 <= newIndex < length)
    NÃO → Retorna
    SIM → Continua
    ↓
Faz swap:
    temp = history[index]
    history[index] = history[newIndex]
    history[newIndex] = temp
    ↓
Define task_hasChanges = true
    ↓
[task_renderHistoryModalContent(true)]
```

### Fluxo: Prompt de Histórico ao Salvar

```
[Salvamento] Detecta mudança em datas
    ↓
task_initialDates.inicio !== novaInicio OU
task_initialDates.fim !== novaFim
    ↓
task_pendingSaveData = updatedTask
    ↓
[task_showHistoryPromptModal()]
    ↓
Exibe modal:
    "Deseja salvar as datas anteriores no histórico?"
    Input: Motivo
    ↓
Usuário escolhe:
    "Não Registrar" → [task_handleHistoryPrompt(false)]
    "Confirmar e Salvar" → [task_handleHistoryPrompt(true)]
        ↓
    [task_handleHistoryPrompt(confirmed)]
        ↓
    SE confirmed:
        Adiciona a task_current["Datas anteriores"]:
            {
                inicio: task_pendingSaveData["Data de início"],
                fim: task_pendingSaveData["Data fim"],
                motivo: input.value.trim()
            }
        ↓
    Fecha modal
    task_performSave(task_pendingSaveData)
    task_pendingSaveData = null
```

### Sincronização do Estado Atual

```
[Histórico - Modal Aberto] Usuário muda datas no formulário principal
    ↓
Event listener 'input' em #task-edit-data-inicio / #task-edit-data-fim
    ↓
[task_syncHistoryCurrentState()]
    ↓
Lê valores atuais dos inputs
    ↓
Atualiza elementos no timeline:
    #task-history-current-start-card
    #task-history-current-end-card
    ↓
Formata: formatDate(valor) ou "Não definida"
```

---

## Modais Secundários

### 1. Modal de Confirmação de Descarte

**ID**: `task-confirmation-modal`  
**Z-Index**: 60  
**Trigger**: Cancelar ou fechar com mudanças não salvas

**Elementos**:
- Título: "Descartar Alterações?"
- Mensagem: "Você fez alterações que não foram salvas. Tem certeza de que deseja sair?"
- Botões: "Não", "Sim, Descartar"

**Fluxo**:
```
task_hasChanges && (!force)
    ↓
Remove 'hidden'
    ↓
Usuário clica:
    "Não" → Adiciona 'hidden'
    "Sim, Descartar" → task_switchToViewMode(force=true)
```

### 2. Modal de Confirmação de Exclusão

**ID**: `task-delete-confirmation-modal`  
**Z-Index**: 60  
**Trigger**: Clique no botão "Excluir"

**Elementos**:
- Ícone: Triângulo vermelho de alerta
- Título: "Confirmar Exclusão"
- Mensagem: "Tem certeza de que deseja excluir a ação **[Nome]**?"
- Alerta: "Esta ação é permanente e não poderá ser revertida pelo usuário."
- Botões: "Cancelar", "Sim, Excluir"

**Fluxo**:
```
openDeleteConfirmationModalTask(task)
    ↓
#task-to-delete-name.textContent = task.Atividade
Remove 'hidden'
    ↓
Usuário clica:
    "Cancelar" → Adiciona 'hidden'
    "Sim, Excluir" → task_handleDeleteTask()
```

### 3. Modal de Confirmação de Notificações

**ID**: `task-date-change-confirmation-modal`  
**Z-Index**: 70  
**Trigger**: Sugestões automáticas de notificações

**Elementos**:
- Título: Dinâmico
- Mensagem: Dinâmica (HTML)
- Botões: Dinâmicos

**Uso**:
```javascript
const confirmed = await task_showConfirmationNotificacaoModal({
  title: 'Atualizar Notificação?',
  message: 'Encontramos notificações do tipo...',
  confirmText: 'Sim, Atualizar',
  cancelText: 'Cancelar'
});

// Retorna Promise<boolean>
```

**Implementação**:
- Promise-based
- Event listeners removidos após escolha
- Resolve com true/false

### 4. Modal de Histórico

**ID**: `task-history-modal`  
**Z-Index**: 80  
**Trigger**: "Histórico de Datas" ou "Gerenciar Histórico"

**Seções**:
1. **Header**: Título dinâmico
2. **Timeline Container**: Estado atual + registros
3. **Edit Content** (condicional): Formulário de adição
4. **Footer**: Botão "Concluído"

**Modos**:
- **Somente Leitura**: Visualização da timeline
- **Edição**: Adicionar/Editar/Remover/Reordenar

### 5. Modal de Prompt de Histórico

**ID**: `task-history-prompt-modal`  
**Z-Index**: 90  
**Trigger**: Salvamento com mudança de datas

**Elementos**:
- Ícone: Círculo de informação
- Título: "Registrar Mudança?"
- Mensagem: "Deseja salvar as datas anteriores no histórico? Se sim, informe o motivo:"
- Input: Motivo (placeholder: "Ex: Novo cronograma acordado...")
- Botões: "Não Registrar", "Confirmar e Salvar"

---

## Validações e Regras de Negócio

### 1. Validação ao Salvar

```javascript
// Todas as notificações devem ter data
const hasEmptyDate = notifications.some(n => !n.data);
if (hasEmptyDate) {
  task_showMainError("Preencha todas as datas...");
  return; // PARA execução
}
```

### 2. Detecção de Mudança de Datas

```javascript
const dateChanged = !task_isNewMode && (
  updatedTask["Data de início"] !== task_initialDates.inicio ||
  updatedTask["Data fim"] !== task_initialDates.fim
);

// Se mudou: Exibe prompt de histórico ANTES de salvar
```

### 3. Registro Inicial de Histórico

```javascript
// Ao criar nova ação
if (task_isNewMode) {
  updatedTask["Datas anteriores"] = [{
    inicio: updatedTask["Data de início"],
    fim: updatedTask["Data fim"],
    motivo: 'Registro Inicial'
  }];
}
```

### 4. Preservação de Histórico

```javascript
// Ao editar ação existente
if (task_current["Datas anteriores"]) {
  updatedTask["Datas anteriores"] = task_current["Datas anteriores"];
}
```

### 5. Notificações de Longo Prazo

```javascript
// Tarefa > 30 dias → Sugere aviso 7 dias antes
const diffDays = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));

if (diffDays > 30) {
  const dataNotificacao = new Date(dataFim);
  dataNotificacao.setDate(dataNotificacao.getDate() - 7);
  // Sugere criação/atualização de aviso
}
```

### 6. Cálculo de Data de Pendência

```javascript
const calcularDataPendencia = (dataFim) => {
  const data = new Date(dataFim + 'T00:00:00');
  data.setDate(data.getDate() + 1);
  return data.toISOString().split('T')[0];
};

// Usado ao atualizar Data Fim
```

### 7. Comparação de Notificações

```javascript
// Verifica se notificação mudou (para evitar update desnecessário)
const originalDataStr = el.dataset.originalData;
const originalData = JSON.parse(originalDataStr);
const currentData = {
  tipo: notif.tipo,
  data: notif.data,
  mailList: [...notif.mailList].sort()
};

if (JSON.stringify(originalData) !== JSON.stringify(currentData)) {
  // API update necessário
}
```

### 8. Atualização Inteligente de Unidades

```javascript
// Ao mudar plano: Atualiza lista de unidades disponíveis
planSelect.onchange = (e) => {
  task_atualizarUnidades(e.target.value);
  task_hasChanges = true;
};

// Ao mudar unidades: Atualiza destinatários de todas notificações
window.onCustomSelectChange('task-unidades-multi-select', () => {
  document.querySelectorAll('.recipients-list-editable').forEach(list => {
    if (/* editável */) {
      task_populateTabelaNotificacoes(list, []);
    }
  });
});
```

### 9. Prevenção de Duplicatas

```javascript
// task_handleUpdateAndPruneNotifications
// Mantém apenas a PRIMEIRA notificação do tipo
// Remove todas as demais e marca IDs para deleção

const matchingCards = Array.from(allNotificationCards).filter(...);
const cardToKeep = matchingCards[0];
const cardsToDelete = matchingCards.slice(1);

cardsToDelete.forEach(card => {
  const notificationId = card.dataset.notificationId;
  if (notificationId) {
    task_deletedNotificationIds.push(notificationId);
  }
  card.remove();
});
```

---

## Integração com APIs

### Função Principal: `window.salvarArquivoNoOneDrive`

```javascript
window.salvarArquivoNoOneDrive(
  id,        // string: ID do registro (vazio para create)
  arquivo,   // string: Nome do arquivo ('acoes.txt', 'notificacoes.txt')
  action,    // string: 'create', 'update', 'delete'
  data,      // object: Dados a serem salvos
  jsonKey    // string: 'jsonAcoes', 'jsonNotificacoes'
)

// Retorna: Promise<{ status: number, data?: object, message?: string }>
```

### Operações Suportadas

#### 1. Criar Ação
```javascript
await window.salvarArquivoNoOneDrive(
  '',
  'acoes.txt',
  'create',
  updatedTask,
  'jsonAcoes'
);

// Resposta: { status: 200, data: { ID: "novo-id-gerado", ...} }
```

#### 2. Atualizar Ação
```javascript
await window.salvarArquivoNoOneDrive(
  task_current.ID,
  'acoes.txt',
  'update',
  updatedTask,
  'jsonAcoes'
);

// Resposta: { status: 200 }
```

#### 3. Deletar Ação
```javascript
await window.salvarArquivoNoOneDrive(
  task_current.ID,
  'acoes.txt',
  'delete',
  '',
  'jsonAcoes'
);

// Resposta: { status: 200 }
```

#### 4. Criar Notificação
```javascript
await window.salvarArquivoNoOneDrive(
  '',
  'notificacoes.txt',
  'create',
  { tipo, data, mailList, idAcao, status },
  'jsonNotificacoes'
);
```

#### 5. Atualizar Notificação
```javascript
await window.salvarArquivoNoOneDrive(
  notif.ID,
  'notificacoes.txt',
  'update',
  { ...notif, idAcao: newTaskId },
  'jsonNotificacoes'
);
```

#### 6. Deletar Notificação
```javascript
await window.salvarArquivoNoOneDrive(
  notifId,
  'notificacoes.txt',
  'delete',
  {},
  'jsonNotificacoes'
);
```

### Sequência de Salvamento Completa

```javascript
try {
  // 1. Salva ação principal
  const response = await window.salvarArquivoNoOneDrive(...);
  
  if (response?.status === 200) {
    const newTaskId = task_isNewMode ? response.data.ID : task_current.ID;
    
    // 2. Atualiza notificações existentes (se mudaram)
    for (const notif of notificationsToUpdate) {
      // Compara original vs atual
      if (changed) {
        await window.salvarArquivoNoOneDrive(...update...);
      }
    }
    
    // 3. Cria notificações novas
    for (const notif of notificationsToSave) {
      await window.salvarArquivoNoOneDrive(...create...);
    }
    
    // 4. Deleta notificações removidas
    for (const notifId of notificationsToDelete) {
      await window.salvarArquivoNoOneDrive(...delete...);
    }
    
    // 5. Recarrega página
    window.location.reload();
  }
  
} catch (error) {
  console.error('Erro ao salvar:', error);
  task_showMainError('Falha ao salvar: ' + error.message);
  // Reabilita interface
}
```

### Dados Globais Requeridos

O modal depende de 3 variáveis globais:

```javascript
window.jsonAcoes      // Array de ações
window.jsonPlanos     // Array de planos
window.jsonNotificacoes  // Array de notificações
```

---

## Referência de Funções

### Funções de Inicialização

#### `initTaskModal()`
**Descrição**: Inicializa o modal injetando HTML no DOM e configurando event listeners.

**Execução**:
1. Cria estrutura HTML completa
2. Anexa ao `document.body`
3. Chama `setupTaskModalLogic()`

**Quando chamar**: Uma vez, no carregamento da página.

---

#### `setupTaskModalLogic()`
**Descrição**: Configura todos os event listeners do modal.

**Event Listeners**:
- **Body click**: Delegação para `[data-open-task]`
- **Botões**: 15+ botões mapeados
- **Form input**: Detecta mudanças
- **Notificações**: Delegação para delete/change
- **Datas**: focusout e change em inputs de data

---

### Funções de Abertura

#### `openTaskModal(taskId)`
**Parâmetros**:
- `taskId` (string): ID da ação em `window.jsonAcoes`

**Comportamento**:
1. Busca ação
2. Define estados globais
3. Chama `task_switchToViewMode()`
4. Exibe modal

---

#### `openCreateTaskModal(defaultPlanoName = '')`
**Parâmetros**:
- `defaultPlanoName` (string, opcional): Nome do plano padrão

**Comportamento**:
1. Cria objeto vazio
2. Define `task_isNewMode = true`
3. Chama `task_switchToEditMode()`
4. Exibe modal

---

### Funções de Modo

#### `task_switchToViewMode(force = false)`
**Parâmetros**:
- `force` (boolean): Se true, ignora confirmação

**Comportamento**:
```
Se task_hasChanges && !force:
  Exibe modal de confirmação
  Retorna

Se task_isNewMode:
  Fecha modal completamente
  Retorna

Caso contrário:
  Renderiza visualização
  Oculta edição
  Renderiza notificações (view)
  Renderiza histórico (condicional)
```

---

#### `task_switchToEditMode()`
**Comportamento**:
```
Oculta visualização
Exibe edição
Preenche formulário com task_current
Popula dropdown de planos
Atualiza unidades
Renderiza notificações (edit)
Define task_hasChanges = false
```

---

### Funções de Renderização

#### `task_renderNotificationsViewList(taskId)`
**Descrição**: Renderiza notificações em modo visualização.

**Processo**:
1. Filtra notificações por `idAcao`
2. Ordena por data crescente
3. Para cada notificação:
   - Renderiza card com ícone colorido
   - Exibe tipo, data, status
   - Lista destinatários com iniciais
4. Se vazio: "Nenhuma notificação configurada."

---

#### `task_renderNotificationsEditList(taskId)`
**Descrição**: Renderiza notificações em modo edição.

**Processo**:
1. Filtra notificações por `idAcao`
2. Ordena por data crescente
3. Chama `task_addNotificationItem()` para cada

---

#### `task_addNotificationItem(notificacao = {})`
**Parâmetros**:
- `notificacao` (object, opcional): Dados da notificação

**Comportamento**:
```
Clona template
Configura dataset (ID, originalData)
Verifica status (enviado/cancelado/planejado)

Se locked (enviado/cancelado):
  Oculta elementos editáveis
  Exibe badge de status
  Renderiza ícone e tipo (locked)
  Renderiza data formatada
  Lista destinatários (somente leitura)

Se editável (planejado):
  Configura selects e inputs
  Popula destinatários editáveis
  Adiciona event listeners (change → task_hasChanges)
  Configura botão "Marcar todos"

Anexa ao container
```

---

#### `task_populateTabelaNotificacoes(listEl, mailList = [])`
**Descrição**: Popula lista de destinatários em notificação.

**Processo**:
```
Obtém unidades selecionadas
Obtém plano selecionado
Busca plano em window.jsonPlanos
Filtra pessoas por unidades

Se sem plano: "Selecione um plano primeiro."
Se sem pessoas: "Selecione unidades para ver destinatários."

Com pessoas:
  Para cada pessoa:
    Renderiza checkbox
    Marca se: mailList vazio OU email em mailList
```

---

### Funções de Salvamento

#### `task_handleSave()`
**Descrição**: Inicia processo de salvamento.

**Fluxo**:
```
1. Coleta FormData
2. Adiciona multi-select values
3. Obtém notificações do DOM
4. Valida datas de notificações
5. Detecta mudança de datas
6. Se mudou: Exibe prompt de histórico
7. Senão: Chama task_performSave()
```

---

#### `task_performSave(updatedTask)`
**Descrição**: Executa salvamento com API.

**Processo**:
```
1. Prepara "Datas anteriores"
2. Desabilita interface
3. Muda botão → "Salvando..."
4. API: Salva ação
5. API: Atualiza notificações modificadas
6. API: Cria notificações novas
7. API: Deleta notificações removidas
8. Reload página

Em caso de erro:
  - Exibe mensagem
  - Reabilita interface
  - Restaura botão
```

---

### Funções de Histórico

#### `openTaskHistoryModal(isEditMode)`
**Parâmetros**:
- `isEditMode` (boolean): Modo de gerenciamento ou visualização

**Comportamento**:
```
Se isEditMode:
  Título: "Gerenciar Linha do Tempo"
  Exibe formulário de adição
  Renderiza com botões de ação

Se !isEditMode:
  Título: "Histórico de alteração de datas"
  Oculta formulário
  Renderiza somente leitura
```

---

#### `task_renderHistoryModalContent(isEditMode = false)`
**Descrição**: Renderiza conteúdo do modal de histórico.

**Processo**:
```
Obtém task_current["Datas anteriores"]

Se vazio: "Nenhum registro anterior encontrado."

Para cada registro:
  Renderiza card com:
    - Datas (início → fim)
    - Motivo
    - Se isEditMode: Botões (↑, ↓, editar, deletar)

Chama task_syncHistoryCurrentState()
```

---

#### `task_addHistoryEntryFromModal()`
**Descrição**: Adiciona ou atualiza entrada de histórico.

**Validação**:
```
Se !start && !end:
  Exibe erro: "Preencha pelo menos uma data"
  Retorna
```

**Comportamento**:
```
Se task_editHistoryIndex >= 0:
  Atualiza entrada existente
  Reseta índice e botão
Senão:
  Adiciona nova entrada

Define task_hasChanges = true
Renderiza lista
Limpa formulário
```

---

### Funções de Notificação Automática

#### `task_gerenciarNotificacaoPorData(idAcao, novaData, tipoNotificacao, calculoDataFn = null)`
**Descrição**: Sugere criação ou atualização de notificação.

**Fluxo**:
```
Calcula data da notificação (usa calculoDataFn se fornecido)
Obtém notificações do DOM

Se existe notificação idêntica (tipo + data):
  Retorna (nada a fazer)

Se existe notificação do mesmo tipo (data diferente):
  Modal: "Atualizar Notificação?"
  Se confirmado: task_handleUpdateAndPruneNotifications()

Se não existe notificação do tipo:
  Modal: "Criar Notificação?"
  Se confirmado: task_addNotificationItem()
```

---

#### `task_verificarNotificacaoLongoPrazo(idAcao, dataInicioStr, dataFimStr)`
**Descrição**: Sugere aviso para tarefas longas (> 30 dias).

**Cálculo**:
```
diffDays = (dataFim - dataInicio) / 1 dia

Se diffDays > 30:
  dataNotificacao = dataFim - 7 dias
  Sugere criação/atualização de aviso
```

---

### Funções Utilitárias

#### `task_updateNotificationIcon(type, container)`
**Descrição**: Atualiza ícone e cor de notificação.

**Mapeamento**:
```
inicio    → Verde, seta para cima
aviso     → Azul céu, sino
pendencia → Âmbar, triângulo de alerta
```

---

#### `task_getNotificationsDataFromDOM()`
**Retorna**: Array de objetos de notificação

**Processo**:
```
Seleciona todas .container-notificacao editáveis
Extrai dados de cada uma:
  - ID, idAcao, tipo, data, mailList, status
```

---

#### `task_togglePageInteractivity(enabled)`
**Descrição**: Desabilita/habilita interatividade da página.

**Efeito**:
```
inputs, selects, textareas, buttons → disabled
.custom-select-container → pointer-events-none, opacity-70, grayscale
```

---

#### `formatDate(dateString)`
**Descrição**: Formata data ISO para pt-BR.

**Entrada**: "2024-01-15"  
**Saída**: "15/01/2024"

---

#### `task_showMainError(msg)`
**Descrição**: Exibe erro principal no formulário.

**Comportamento**:
```
Exibe #task-main-msg
Define texto
Auto-oculta após 5 segundos
```

---

#### `task_showHistoryError(msg)`
**Descrição**: Exibe erro no modal de histórico.

**Comportamento**:
```
Exibe #task-history-msg
Define texto
Auto-oculta após 5 segundos
```

---

### Funções Expostas Globalmente

```javascript
window.openTaskModal = openTaskModal;
window.initTaskModal = initTaskModal;
window.openCreateTaskModal = openCreateTaskModal;
window.openModalForNewAction = openCreateTaskModal;
window.task_moveHistoryItem = task_moveHistoryItem;
window.task_editHistoryItem = task_editHistoryItem;
window.task_removeHistoryItem = task_removeHistoryItem;
```

---

## Diagrama de Estados

```
┌──────────────────────────────────────────────────────────┐
│                     MODAL FECHADO                        │
│                  (Estado Inicial)                        │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
    openTaskModal(id)          openCreateTaskModal()
             │                            │
             v                            v
┌────────────────────────┐    ┌──────────────────────────┐
│   MODO VISUALIZAÇÃO    │    │     MODO EDIÇÃO          │
│   (Ação Existente)     │    │     (Nova Ação)          │
│                        │    │                          │
│ - Dados somente leitura│    │ - Formulário editável    │
│ - Botões: Editar,      │    │ - Botões: Cancelar,      │
│   Excluir, Fechar      │    │   Salvar, Excluir        │
└────────┬───────────────┘    └───────┬──────────────────┘
         │                            │
         │ Editar                     │ Cancelar (com changes)
         v                            │
┌────────────────────────┐            │
│     MODO EDIÇÃO        │            │
│   (Ação Existente)     │            │
│                        │            │
│ - Formulário preenchido│            │
│ - Notificações edit    │            │
│ - Histórico editável   │            │
└────────┬───────────────┘            │
         │                            │
         │ Salvar                     │
         v                            v
     ┌───────────────┐         ┌──────────────┐
     │ Mudou datas?  │         │ Confirmação  │
     └───┬───────┬───┘         │  Descarte    │
         │       │             └──────┬───────┘
        SIM     NÃO                   │
         │       │                    │ Sim
         v       │                    │
    ┌────────────┴──┐                 │
    │ Prompt        │                 │
    │ Histórico     │                 │
    └────┬──────────┘                 │
         │                            │
         │ Confirma                   │
         v                            v
    ┌────────────────┐         ┌─────────────┐
    │ API Salvamento │         │ Volta para  │
    └────────┬───────┘         │ Visualização│
             │                 └─────────────┘
             v
       ┌──────────┐
       │  Reload  │
       │  Página  │
       └──────────┘
```

---

## Boas Práticas e Recomendações

### 1. Sempre Validar Dados do Usuário
- Verifique campos obrigatórios
- Valide formatos de data
- Confirme seleções críticas

### 2. Gerenciar Estados Consistentemente
- Sempre limpe estados globais ao fechar modal
- Use `task_hasChanges` para evitar perda de dados
- Preserve `task_initialDates` para detectar mudanças

### 3. Feedback Visual Claro
- Desabilite interface durante operações assíncronas
- Mostre mensagens de erro temporárias
- Use modais de confirmação para ações destrutivas

### 4. Otimizar Chamadas de API
- Compare dados antes de atualizar (evite updates desnecessários)
- Agrupe operações relacionadas
- Trate erros graciosamente

### 5. Manter Histórico Completo
- Sempre registre mudanças de datas importantes
- Permita justificativas opcionais
- Preserve ordem cronológica ou manual

### 6. Sincronização de Dados
- Mantenha notificações sincronizadas com datas da ação
- Atualize destinatários ao mudar unidades/plano
- Valide consistência antes de salvar

---

## Troubleshooting

### Problema: Modal não abre
**Possíveis causas**:
- `initTaskModal()` não foi chamado
- `window.jsonAcoes` não está definido
- Element com `[data-open-task]` não tem ID válido

**Solução**:
```javascript
// Verificar no console
console.log(window.jsonAcoes);
console.log(document.getElementById('task-container'));
```

---

### Problema: Notificações não aparecem
**Possíveis causas**:
- `window.jsonNotificacoes` vazio/indefinido
- `idAcao` não corresponde

**Solução**:
```javascript
// Verificar filtro
const taskNotifications = window.jsonNotificacoes.filter(
  n => n.idAcao === taskId
);
console.log(taskNotifications);
```

---

### Problema: Unidades não carregam
**Possíveis causas**:
- Plano não selecionado
- `window.jsonPlanos` sem dados de pessoas
- Campo `Unidade` vazio ou `-`

**Solução**:
```javascript
// Verificar estrutura
const plan = window.jsonPlanos.find(p => p.Nome === nomePlano);
console.log(plan?.objPessoas);
```

---

### Problema: Salvamento falha
**Possíveis causas**:
- `window.salvarArquivoNoOneDrive` indefinido
- Problema de conectividade
- Dados inválidos

**Solução**:
```javascript
// Verificar função
console.log(typeof window.salvarArquivoNoOneDrive);

// Testar chamada
try {
  const res = await window.salvarArquivoNoOneDrive(...);
  console.log(res);
} catch (err) {
  console.error(err);
}
```

---

## Conclusão

O **modalAcoes.js** é um componente robusto e feature-rich que gerencia todo o ciclo de vida de ações no sistema. Com seus múltiplos modos, sistema inteligente de notificações, rastreamento de histórico e validações automáticas, ele oferece uma experiência de usuário completa e profissional.

Para refatorações futuras, considere:
1. **Modularização**: Separar lógica de notificações e histórico em módulos
2. **TypeScript**: Adicionar tipagem para maior segurança
3. **Testes**: Implementar testes unitários para funções críticas
4. **Performance**: Lazy loading de modais secundários
5. **Acessibilidade**: Adicionar ARIA labels e keyboard navigation

---

**Versão**: 1.0  
**Data**: 2026-02-10  
**Arquivo Fonte**: `modalAcoes.js` (1629 linhas)
