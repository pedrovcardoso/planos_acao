document.addEventListener("DOMContentLoaded", function () {
    const loadComponent = (componentPath, elementId) => {
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

    loadComponent('../../components/layout/header.html', 'header')

    loadComponent('../../components/layout/footer.html', 'footer');
});