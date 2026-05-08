document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const isEmbedded = urlParams.get('embedded') === 'true';

    if (isEmbedded) {
        document.body.classList.add('is-embedded');
        
        const main = document.querySelector('main');
        if (main) {
            main.style.paddingTop = '0';
            main.classList.remove('pt-16', 'pt-20', 'pt-24');
        }
        
        const headerContainer = document.getElementById('header');
        const footerContainer = document.getElementById('footer');
        if (headerContainer) headerContainer.style.display = 'none';
        if (footerContainer) footerContainer.style.display = 'none';

        document.addEventListener('click', function (e) {
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
                const url = new URL(anchor.href);
                if (!url.searchParams.has('embedded')) {
                    url.searchParams.set('embedded', 'true');
                    anchor.href = url.toString();
                }
            }
        }, true);
    } else {
        const loadComponent = (componentPath, elementId) => {
            return fetch(componentPath)
                .then(response => {
                    if (!response.ok) throw new Error(`Erro: ${response.statusText}`);
                    return response.text();
                })
                .then(data => {
                    const el = document.getElementById(elementId);
                    if (el) el.innerHTML = data;
                })
                .catch(error => console.error('Falha ao carregar componente:', error));
        };

        loadComponent('../../components/layout/header.html', 'header');
        loadComponent('../../components/layout/footer.html', 'footer');
    }
});