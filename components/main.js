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
    setupHeader()
});


function setupHeader(){
    const navLinks = document.querySelectorAll('.nav-link');
    console.log(navLinks)
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        console.log(link)
        if (currentPath.startsWith(link.getAttribute('href'))) {
            link.classList.remove('text-slate-500', 'hover:bg-slate-100', 'hover:text-slate-700');
            link.classList.add('bg-sky-100', 'text-sky-700');
            link.setAttribute('aria-current', 'page');
        }
    });
    
    // 2. Lógica para o menu mobile
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Verifica se os elementos do menu mobile existem antes de adicionar o listener
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');

            const icons = mobileMenuButton.querySelectorAll('svg');
            icons.forEach(icon => icon.classList.toggle('hidden'));
        });
    }
};