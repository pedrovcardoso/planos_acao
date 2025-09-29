var jsonAcoes
var jsonPlanos
var jsonNotificacoes

async function obterDadosDoOneDrive() {
  // Cole a URL do seu fluxo do Power Automate aqui
  const powerAutomateUrl = "https://prod-38.westus.logic.azure.com:443/workflows/6ff0e17beffa412d9fc6fbf256861ea8/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_w4h7w76Nqxz1GjX-fqN4x6rQpE1aW8RRposrxufrzw";

  try {
    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Verifica se a requisição foi bem-sucedida
    if (!response.ok) {
      throw new Error(`Erro na requisição HTTP: ${response.status} ${response.statusText}`);
    }

    // Converte a resposta para JSON
    const dados = await response.json();

    jsonAcoes = JSON.parse(dados.acoes);
    jsonAcoes = ordenarJsonAcoes(jsonAcoes)
    jsonPlanos = JSON.parse(dados.planos);

  } catch (error) {
    console.error("Falha ao obter os dados do Power Automate:", error);
    return null;
  }
}

async function obterDadosDoOneDriveNew(arrFiles) {
  const powerAutomateUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9019b15756f14c698b3ea71554389290/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VNrk0XHX2XqG_nLsuzcYmPJP4kGUFifRX2c4FC_sc4w";
  const dadosParaEnviar = { files: arrFiles };

  try {
    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosParaEnviar)
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    const data = await response.json();
    jsonNotificacoes = data[0];

    console.log('ok')
    return jsonNotificacoes
  } catch (error) {
    console.error("Falha ao obter os dados do Power Automate:", error);
  }
}

async function salvarArquivoNoOneDrive(id, arquivo, evento, conteudo) {
    console.log('enviando')

    const powerAutomateUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95292f9f4d384f34bd8e385ea59997d3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xpnrIZmY0PJU-hDBaxRwn8w7RpVR5AdlDyx2rl7QSLc";

    const dadosParaEnviar = 
        {
            "id":        id,
            "arquivo":   arquivo,
            "evento":    evento,
            "conteudo":  JSON.stringify(conteudo),
        };
    
    try {
        const response = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaEnviar)
        });

        const resultado = await response.json().catch(() => null); // caso não tenha JSON na resposta

        return {
            status: response.status,  // retorna o status code
            data: resultado           // retorna o JSON (ou null se não tiver)
        };
        
    } catch (error) {
        console.error("Falha ao enviar os dados para o Power Automate:", error);
        alert('Erro ao salvar os dados.');
        return { status: null, data: null }; // retorna status null em caso de erro
    }
}

function setSessionMirror(event, uuid, data, jsonArrayName) {
  let arr = window[jsonArrayName] || [];

  if (event === 'create') {
    data.ID = uuid;
    arr.push(data);
  } else if (event === 'update') {
    data.ID = uuid;
    arr = arr.map(item => item.ID === uuid ? { ...item, ...data } : item);
  } else if (event === 'delete') {
    arr = arr.filter(item => item.ID !== uuid);
  }

  window[jsonArrayName] = arr;
  sessionStorage.setItem(jsonArrayName, JSON.stringify(arr));
}

function ordenarJsonAcoes(jsonAcoes) {
  return jsonAcoes.sort((a, b) => {
    const planoA = String(a["Plano de ação"] || "");
    const planoB = String(b["Plano de ação"] || "");
    const compPlano = planoA.localeCompare(planoB, "pt-BR");
    if (compPlano !== 0) return compPlano;

    const numA = String(a["Número da atividade"] || "");
    const numB = String(b["Número da atividade"] || "");
    return numA.localeCompare(numB, "pt-BR", { numeric: true });
  });
}