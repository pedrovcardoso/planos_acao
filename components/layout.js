document.addEventListener("DOMContentLoaded", function() {
    // Função para carregar um componente. Agora ela retorna a Promise.
    const loadComponent = (componentPath, elementId) => {
        // Retorna a promise para que possamos encadear ações
        return fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao buscar o componente: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                document.getElementById(elementId).innerHTML = data;
            })
            .catch(error => console.error('Falha ao carregar componente:', error));
    };

    loadComponent('../../components/header.html', 'header')

    loadComponent('../../components/footer.html', 'footer');
});