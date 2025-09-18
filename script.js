// script.js
window.onload = function() {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const mainHeader = document.getElementById('main-header');
    
    setTimeout(() => {
        splashScreen.style.opacity = '0';
        mainContent.style.opacity = '1';
        mainHeader.style.opacity = '1';
        mainHeader.style.transform = 'translateY(0)';
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 1500); 
    }, 2500);
};
