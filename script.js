// script.js
window.onload = function() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const mainHeader = document.getElementById('main-header');
    
    // Ocultar la splash screen y mostrar el contenido principal
    setTimeout(() => {
        splashScreen.style.opacity = '0'; // Inicia la transición de opacidad
        
        setTimeout(() => {
            splashScreen.style.display = 'none'; // Oculta completamente después de la transición
            mainContent.style.opacity = '1'; // Muestra el contenido principal
            mainHeader.style.opacity = '1'; // Muestra el header
            mainHeader.style.transform = 'translateY(0)'; // Desliza el header hacia abajo
        }, 1200); // Coincide con la duración de 'opacity' en CSS (.splash-screen)

    }, 2800); // Tiempo total antes de que la splash screen empiece a desaparecer (2s anim + 0.8s extra)

    // Smooth scroll para los enlaces de navegación
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - mainHeader.offsetHeight, // Ajusta para el header fijo
                    behavior: 'smooth'
                });
            }
        });
    });
};
