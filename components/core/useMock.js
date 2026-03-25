const MOCK_DATA_PATH = "../../assets/mockdata/";

async function fetchFromApi(fileNames) {
  sessionStorage.clear(); 
  
  try {
    const results = await Promise.all(
      fileNames.map(async (fileName) => {
        const fullPath = `${MOCK_DATA_PATH}${fileName.replace('.txt', '.json')}`;
        const response = await fetch(fullPath);
        if (!response.ok) throw new Error(`Erro ao carregar: ${fileName}`);
        return response.json();
      })
    );

    return fileNames.reduce((accumulator, fileName, index) => {
      accumulator[fileName] = results[index];
      return accumulator;
    }, {});

  } catch (error) {
    console.error(error);
    return null;
  }
}

async function obterDados(requiredFiles) {
  const newDataFromApi = await fetchFromApi(requiredFiles);

  if (!newDataFromApi) return null;

  for (const fileName in newDataFromApi) {
    sessionStorage.setItem(fileName, JSON.stringify(newDataFromApi[fileName]));
  }

  return newDataFromApi;
}

async function salvarArquivoNoOneDrive(uuid, arquivo, evento, conteudo, jsonArrayName) {
  setSessionMirror(evento, uuid, conteudo, jsonArrayName, arquivo);
  await new Promise(resolve => setTimeout(resolve, 300));
  return { status: 200, data: { status: "success" } };
}

function setSessionMirror(evento, uuid, conteudo, jsonArrayName, arquivo) {
  let arr = window[jsonArrayName] || [];

  if (evento === 'create') {
    conteudo.ID = uuid || `mock_${Math.random().toString(36).substr(2, 9)}`;
    arr.push(conteudo);
  } else if (evento === 'update') {
    arr = arr.map(item => item.ID === uuid ? { ...item, ...conteudo } : item);
  } else if (evento === 'delete') {
    arr = arr.filter(item => item.ID !== uuid);
  }
  
  window[jsonArrayName] = arr;
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

function ordenarJsonPlanos(jsonPlanos) {
  jsonPlanos.forEach(plano => {
    if (Array.isArray(plano.objPessoas)) {
      plano.objPessoas.sort((a, b) => {
        const uA = String(a.Unidade || "");
        const uB = String(b.Unidade || "");
        return uA.localeCompare(uB, "pt-BR") || String(a.Nome || "").localeCompare(String(b.Nome || ""));
      });
    }
  });

  return jsonPlanos.sort((a, b) => String(a.Nome || "").localeCompare(String(b.Nome || "")));
}

window.getUserColor = function (email) {
  if (!email) return '#E2E8F0';
  const colors = ['#DBEAFE', '#E0E7FF', '#EDE9FE', '#FAE8FF', '#F3E8FF', '#DCFCE7', '#FEF3C7', '#FFEDD5'];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

window.getInitialsFirstLast = function (name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const userPhotoCache = {};

async function fetchUserPhoto(email) {
  if (!email || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();

  if (userPhotoCache[cleanEmail] !== undefined) return userPhotoCache[cleanEmail];

  let hash = 0;
  for (let i = 0; i < cleanEmail.length; i++) hash = cleanEmail.charCodeAt(i) + ((hash << 5) - hash);
  
  const shouldShowPhoto = Math.abs(hash) % 2 === 0;

  if (shouldShowPhoto) {
    const url = `https://i.pravatar.cc/150?u=${cleanEmail}`;
    userPhotoCache[cleanEmail] = url;
    return url;
  }

  userPhotoCache[cleanEmail] = null;
  return null;
}

window.fetchUserPhoto = fetchUserPhoto;

window.loadUserPhotos = async function (container = document) {
  const elements = container.querySelectorAll('[data-user-email]:not([data-photo-loaded])');

  for (const el of elements) {
    const email = el.dataset.userEmail?.trim().toLowerCase();
    if (!email) continue;

    el.setAttribute('data-photo-loaded', 'true');

    if (el.tagName !== 'IMG') {
      el.style.backgroundColor = window.getUserColor(email);
      el.style.color = '#475569';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = '700';
    }

    const url = await fetchUserPhoto(email);
    
    if (url) {
      if (el.tagName === 'IMG') {
        el.src = url;
      } else {
        el.style.backgroundImage = `url('${url}')`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.color = 'transparent';
        el.innerText = '';
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.loadUserPhotos();
});

window.fetchAiSummaryApi = async function () {
  await new Promise(resolve => setTimeout(resolve, 400));

  return `
    <div>
      <div>
        Este é um resumo gerado por inteligência artificial apenas para fins de teste da interface.
      </div>
      <div>
        O conteúdo aqui apresentado não possui valor real e serve apenas como exemplo simulado.
      </div>
      <ul>
        <li>Resumo automático de dados</li>
        <li>Geração fictícia de conteúdo</li>
        <li>Simulação de resposta de API</li>
      </ul>
      <ol>
        <li>Processamento inicial</li>
        <li>Análise simulada</li>
        <li>Retorno do resultado</li>
      </ol>
      <div>
        Para mais informações acesse 
        <a href="#">documentação fictícia</a>.
      </div>
    </div>
  `;
}

window.callChatApi = async function (message) {
  await new Promise(resolve => setTimeout(resolve, 300));

  const respostas = [
    "Essa é uma resposta simulada da IA para testes.",
    "Entendi sua mensagem, mas isso é apenas um mock.",
    "Resposta automática gerada para simular o chat.",
    "Este conteúdo não é real, apenas um placeholder.",
    "Simulação de resposta baseada na sua entrada.",
    "Mock de IA: processamento concluído com sucesso.",
    "Essa resposta foi gerada apenas para testes de interface."
  ];

  const randomIndex = Math.floor(Math.random() * respostas.length);

  return {
    "type": "text",
    "content": respostas[randomIndex]
  }
}
