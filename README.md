# Sistema de Gestão de Planos de Ação

Sistema web para controle, acompanhamento e organização de grupos de trabalho e planos de ação. O projeto oferece uma interface interativa rica e um dashboard gerencial completo para visualizar o progresso, prazos e responsáveis por diversas iniciativas.

## Tecnologias Utilizadas

O sistema foi desenvolvido focado em leveza, performance e facilidade de manutenção no front-end, integrado a um ecossistema Microsoft para o back-end e armazenamento de dados.

### Front-end
- **HTML5** e **Vanilla JavaScript**: Estrutura e lógica do sistema, sem frameworks.
- **Tailwind CSS** e **IonIcons**: Estilização do sistema feita através de classes utilitárias diretamente pelo html.

### Back-end & Integração
- **Power Automate Cloud**: Atua como a "API" do sistema. Diferentes fluxos recebem as requisições HTTP do front-end para buscar ou salvar dados.
- **OneDrive**: Utilizados para o armazenamento persistente dos dados (arquivos como `planos.txt`, `acoes.txt` e `notificacoes.txt`).
- **Inteligência Artificial**: Endpoints para resumo de dados e chatbot, potencializados por trás dos fluxos do Power Automate Cloud.

## Arquitetura do Sistema

O projeto segue uma arquitetura baseada em componentes visuais e páginas, de forma modular, acessando APIs centralizadas para os dados. A raiz do sistema redireciona para a página principal de `/pages/planos/index.html`.

### Estrutura de Diretórios
- **/pages**: Contém os módulos principais do sistema (cada um com seu próprio HTML e scripts).
  - `/planos`: Dashboard principal com estatísticas, gráficos de Gantt e resumo dos planos de ação.
  - `/acoes`: Visão detalhada das ações (tabelas, filtros e status).
  - `/detalhes_plano`: Visão específica do andamento de um único plano.
  - `/calendario`: Visão temporal das entregas.
  - `/log`: Histórico de ações e auditoria do sistema.

- **/components**: Componentes reutilizáveis importados nas páginas.
  - `/core`: Lógicas de negócios e conexões externas (ex: `apiConnection.js` faz as chamadas ao Power Automate).
  - `/layout`: Elementos compartilhados da interface (ex: `chatbot.js` e navbars).
  - `/modals`: Modais criação ou edição de dados.
  - `/ui`: Elementos de interface.

### Fluxo de Dados e Cache
Para reduzir carregamentos e chamadas redundantes, o sistema utiliza o **`sessionStorage`** do navegador. Requisições feitas via `apiConnection.js` buscam arquivos do servidor e os espelham no cache local. Atualizações no sistema disparam atualizações simultâneas para o Power Automate (persistência) e para o *session mirror* no front-end.