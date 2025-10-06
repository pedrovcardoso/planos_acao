const fetchApiUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9019b15756f14c698b3ea71554389290/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VNrk0XHX2XqG_nLsuzcYmPJP4kGUFifRX2c4FC_sc4w";
const saveApiUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95292f9f4d384f34bd8e385ea59997d3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xpnrIZmY0PJU-hDBaxRwn8w7RpVR5AdlDyx2rl7QSLc";

async function fetchFromApi(fileNames) {
  try {
    const response = await fetch(fetchApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: fileNames })
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição HTTP: ${response.status} ${response.statusText}`);
    }

    const dataArray = await response.json();

    return fileNames.reduce((accumulator, fileName, index) => {
      accumulator[fileName] = dataArray[index];
      return accumulator;
    }, {});

  } catch (error) {
    console.error("Falha ao obter os dados do Power Automate:", error);
    return null;
  }
}

async function obterDados(requiredFiles) {
  const dataFromCache = {};
  const filesToFetch = [];

  for (const file of requiredFiles) {
    const cachedItem = sessionStorage.getItem(file);
    if (cachedItem) {
      console.log(`${file}: Resgatado do Cache`);
      dataFromCache[file] = JSON.parse(cachedItem);
    } else {
      filesToFetch.push(file);
    }
  }

  if (filesToFetch.length === 0) {
    return dataFromCache;
  }

  const newDataFromApi = await fetchFromApi(filesToFetch);

  if (!newDataFromApi) {
    console.error("A chamada à API para buscar os arquivos faltantes falhou.");
    return null;
  }

  for (const fileName in newDataFromApi) {
    console.log(`${fileName}: Buscado da API`);
    sessionStorage.setItem(fileName, JSON.stringify(newDataFromApi[fileName]));
  }

  return { ...dataFromCache, ...newDataFromApi };
}

async function salvarArquivoNoOneDrive(uuid, arquivo, evento, conteudo, jsonArrayName) {
  const dadosParaEnviar = {
    "id": uuid,
    "arquivo": arquivo,
    "evento": evento,
    "conteudo": JSON.stringify(conteudo),
  };

  try {
    const response = await fetch(saveApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosParaEnviar)
    });

    const resultado = await response.json().catch(() => null);

    const finalId = evento === 'create' && resultado && resultado.id ? resultado.uuid : uuid;
    setSessionMirror(evento, finalId, conteudo, jsonArrayName, arquivo)

    return { status: response.status, data: resultado };

  } catch (error) {
    console.error("Falha ao enviar os dados para o Power Automate:", error);
    alert('Erro ao salvar os dados.');
    return { status: null, data: null };
  }
}

function setSessionMirror(evento, uuid, conteudo, jsonArrayName, arquivo) {
  let arr = window[jsonArrayName] || [];

  if (evento === 'create') {
    conteudo.ID = uuid;
    arr.push(conteudo);
  } else if (evento === 'update') {
    conteudo.ID = uuid;
    arr = arr.map(item => item.ID === uuid ? { ...item, ...conteudo } : item);
  } else if (evento === 'delete') {
    arr = arr.filter(item => item.ID !== uuid);
  }
  sessionStorage.setItem(arquivo, JSON.stringify(arr));
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