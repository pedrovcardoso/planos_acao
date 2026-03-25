# DADOS_SCHEMA.md

Este documento descreve a estrutura de dados (schema) utilizada no sistema de gestão de planos de ação e monitoramento.

## 1. Planos (`planos.json`)
Armazena as informações principais dos planos de ação macro.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `ID` | UUID | Identificador único do plano. | `0a9f0d27...` |
| `Nome` | String | Título descritivo do plano. | `Contabilização` |
| `Status` | String | Estado atual do plano. | `Em desenvolvimento`, `Planejado`, `Em curso`, `Pendente`, `Implementado`, `Em revisão` |
| `Resolução` | String | Norma ou resolução legal que fundamenta o plano. | `RESOLUÇÃO CONJUNTA SEF/SEPLAG Nº 5895...` |
| `Data início` | Date (ISO) | Data prevista para início das atividades. | `2026-01-01` |
| `Data fim` | Date (ISO) | Data prevista para conclusão. | `2026-03-31` |
| `Observações` | String | Notas adicionais sobre o plano. | `Textos complementares...` |
| `Processo SEI` | String | Número do processo no Sistema Eletrônico de Informações. | `1190.01.0003884/2025-05` |
| `SEI relacionados`| String | Outros processos SEI vinculados. | `1190...` |
| `Documento TCE` | String | Referência a relatórios ou documentos do Tribunal de Contas. | `Relatório 105569558 TCE...` |
| `Documentos relacionados` | String | Links ou nomes de outros documentos de suporte. | `...` |
| `objPessoas` | Array[Obj] | Lista de pessoas responsáveis ou interessadas. | (Ver sub-estrutura abaixo) |

### Sub-estrutura: `objPessoas`
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `Nome` | String | Nome completo da pessoa. |
| `Email` | String | E-mail institucional. |
| `Unidade` | String | Sigla da unidade/setor. |
| `Coordenador`| Boolean | Define se a pessoa é a coordenadora do plano. |

---

## 2. Ações (`acoes.json`)
Atividades específicas vinculadas aos planos de ação.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `ID` | UUID | Identificador único da ação. | `6522271d...` |
| `Atividade` | String | Título resumido da atividade. | `Resenha com Contabilistas` |
| `Descrição da atividade` | String | Detalhamento da recomendação ou tarefa. | `Capacitar anualmente as comissões...` |
| `Número da atividade` | String | Código hierárquico da ação. | `1.1` |
| `Status` | String | Estado atual da ação específica. | `Em desenvolvimento`, `Planejado`, `Em curso`, `Pendente`, `Implementado`, `Em revisão` |
| `Plano de ação` | String | Nome ou ID do plano pai ao qual pertence. | `CGE: restos a pagar...` |
| `Data de início` | Date (ISO) | Início da execução da atividade. | `2025-10-15` |
| `Data fim` | Date (ISO) | Término da execução da atividade. | `2025-11-12` |
| `Observações` | String | Comentários sobre a execução. | `...` |
| `Unidades` | Array[Str] | Lista de siglas das unidades envolvidas. | `["SCCG / DCCG", ...]` |

---

## 3. Notificações (`notificacoes.json`)
Registro de avisos e alertas disparados pelo sistema.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `ID` | UUID | Identificador único da notificação. | `456475d...` |
| `idAcao` | UUID | Referência ao ID da Ação que gerou o alerta. | `22a65ea7...` |
| `tipo` | String | Categoria do alerta. | `inicio`, `aviso`, `pendencia` |
| `data` | Date (ISO) | Data do disparo ou agendamento. | `2025-05-23` |
| `mailList` | Array[Str] | Lista de e-mails que receberam a notificação. | `["email@mg.gov.br"]` |
| `status` | String | Resultado do envio. | `enviado`, `pendente`, `cancelado` |

---

## 4. Log (`log.json`)
Histórico de auditoria e alterações no sistema.

| Campo | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Identificador único do registro de log. | `a6f3d61b...` |
| `arquivo` | String | Nome do arquivo/entidade afetada. | `acoes.txt` |
| `dataHora` | Timestamp | Data e hora exata do evento. | `2025-09-04 14:52:26` |
| `evento` | String | Tipo de operação realizada. | `create`, `update`, `delete` |
| `novoConteudo`| Object | Snapshot dos dados após a alteração. | (Objeto JSON completo) |