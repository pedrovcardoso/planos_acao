const fetchApiUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9019b15756f14c698b3ea71554389290/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dQ6jIWoruotdgenr1yJs3KBeW2U-DXndp99PKaYAq0U";
const saveApiUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/95292f9f4d384f34bd8e385ea59997d3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=yXpJccQL1RD_UVZ60_MlBVGmUJlIzWyon4rgX9kL8QM";
const photoApiUrl = "https://default4c86fd71d0164231a16057311d68b9.51.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/9a780c43ac3a47238ba67aca60a5aa37/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jBde7qj8if_Kb1YS9lptTceBiEdslV4Bf5agwZ7JjIE";

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

    window[jsonArrayName] = resultado.dados
    sessionStorage.setItem(arquivo, JSON.stringify(resultado.dados))

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

function ordenarJsonPlanos(jsonPlanos) {
  jsonPlanos.forEach(plano => {
    if (Array.isArray(plano.objPessoas) && plano.objPessoas.length > 0) {
      plano.objPessoas.sort((a, b) => {
        const unidadeA = String(a.Unidade || "");
        const unidadeB = String(b.Unidade || "");
        const compUnidade = unidadeA.localeCompare(unidadeB, "pt-BR");
        if (compUnidade !== 0) {
          return compUnidade;
        }

        const nomeA = String(a.Nome || "");
        const nomeB = String(b.Nome || "");
        return nomeA.localeCompare(nomeB, "pt-BR");
      });
    }
  });

  jsonPlanos.sort((a, b) => {
    const nomeA = String(a.Nome || "");
    const nomeB = String(b.Nome || "");
    return nomeA.localeCompare(nomeB, "pt-BR");
  });

  return jsonPlanos;
}

window.getUserColor = function (email) {
  if (!email) return '#E2E8F0';

  const colors = [
    '#DBEAFE', '#E0E7FF', '#EDE9FE',
    '#FAE8FF', '#F3E8FF', '#FAF5FF',
    '#DCFCE7', '#ECFCCB', '#F0FDFA',
    '#FEF9C3', '#FEF3C7', '#FFEDD5',
    '#F1F5F9', '#F8FAFC'
  ];

  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

window.getInitialsFirstLast = function (name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
};

const userPhotoCache = {};

async function fetchUserPhoto(email) {
  if (!email || !email.includes('@')) return null;
  const cleanEmail = email.trim().toLowerCase();

  if (userPhotoCache[cleanEmail]) return userPhotoCache[cleanEmail];

  const photoPromise = (async () => {
    try {
      const response = await fetch(photoApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      if (blob && blob.size > 100) {
        const url = URL.createObjectURL(blob);
        userPhotoCache[cleanEmail] = url;
        return url;
      }
    } catch (error) {
      console.warn(`[PhotoAPI] Erro ao carregar foto para ${cleanEmail}:`, error);
    }

    delete userPhotoCache[cleanEmail];
    return null;
  })();

  userPhotoCache[cleanEmail] = photoPromise;
  return photoPromise;
}

window.fetchUserPhoto = fetchUserPhoto;

window.loadUserPhotos = async function (container = document) {
  const allWithEmail = container.querySelectorAll('[data-user-email]');
  const elements = container.querySelectorAll('[data-user-email]:not([data-photo-loaded]):not([data-initials-only])');

  if (elements.length === 0) return;

  for (const el of elements) {
    const emailRaw = el.dataset.userEmail;
    if (!emailRaw) continue;

    const email = emailRaw.trim().toLowerCase();
    el.setAttribute('data-photo-loaded', 'true');

    if (el.tagName !== 'IMG') {
      const bgColor = window.getUserColor(email);
      el.style.backgroundColor = bgColor;
      el.style.color = '#475569';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontWeight = '700';
      el.style.fontSize = '10px';
    }

    fetchUserPhoto(email).then(url => {
      if (typeof url === 'string' && (url.startsWith('blob:') || url.startsWith('http'))) {
        if (el.tagName === 'IMG') {
          el.src = url;
          el.classList.remove('hidden');
        } else {
          el.style.backgroundImage = `url('${url}')`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.style.color = 'transparent';
          el.innerText = '';
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.loadUserPhotos();
});