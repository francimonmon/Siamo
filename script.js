/**
 * Archivo de JavaScript para la página web de Siamo Indumentaria.
 * Incluye la lógica para la pantalla de carga, el encabezado fijo y las funcionalidades dinámicas.
 */

// Mensaje de depuración para confirmar que el script se está ejecutando.
console.log('Script cargado y en ejecución.');

// URL y clave para la API de Gemini
// NOTA: La clave API se proporcionará automáticamente en el entorno de Canvas.
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=';
const API_KEY = ""; // La clave se inyectará en tiempo de ejecución.

/**
 * Muestra una caja de mensajes personalizada en lugar de `alert()`.
 * @param {string} message El mensaje a mostrar.
 */
function showCustomMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.classList.add('custom-message-box');
    messageBox.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
            <button class="btn btn-small" onclick="this.parentNode.parentNode.remove()">Cerrar</button>
        </div>
    `;
    document.body.appendChild(messageBox);

    // Estilos para la caja de mensajes
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-message-box {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            text-align: center;
            color: white;
        }
        .message-content {
            background: #fff;
            padding: 20px 30px;
            border-radius: 8px;
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Función para generar eslóganes de productos utilizando la API de Gemini.
 * @param {string} productName El nombre del producto.
 * @returns {Promise<string>} El eslogan generado.
 */
async function generateSlogan(productName) {
    const prompt = `Crea un eslogan corto y llamativo de 10 palabras o menos para el producto de ropa: "${productName}".`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(API_URL + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const slogan = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Calidad y estilo en cada prenda.';
            return slogan;
        } catch (error) {
            console.error(`Error al generar eslogan (Intento ${attempts + 1}):`, error);
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }
    }
    return 'Calidad y estilo en cada prenda.';
}

/**
 * Función para calcular la talla de ropa usando la API de Gemini.
 * @param {number} height Altura del usuario en cm.
 * @param {number} weight Peso del usuario en kg.
 * @param {string} bodyShape Forma del cuerpo del usuario.
 * @returns {Promise<string>} La recomendación de talla generada.
 */
async function calculateSize(height, weight, bodyShape) {
    const prompt = `Basado en los siguientes datos: Altura: ${height} cm, Peso: ${weight} kg, Forma del cuerpo: ${bodyShape}, por favor, recomienda una talla de ropa (ej. S, M, L, XL) y justifica brevemente tu recomendación en una sola frase. El resultado debe ser solo la talla recomendada y la justificación.`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
    };

    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(API_URL + API_KEY, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const recommendation = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una recomendación de talla en este momento. Por favor, intente de nuevo más tarde.';
            return recommendation;
        } catch (error) {
            console.error(`Error al calcular talla (Intento ${attempts + 1}):`, error);
            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
            }
        }
    }
    return 'No se pudo generar una recomendación de talla en este momento. Por favor, intente de nuevo más tarde.';
}

window.onload = function() {
    console.log('Página completamente cargada.');

    const splashScreen = document.getElementById('splash-screen');
    const mainHeader = document.getElementById('main-header');
    const mainContent = document.getElementById('main-content');
    const splashLogo = document.getElementById('splash-logo-img');
    const splashSlogan = document.getElementById('splash-slogan');

    // Efecto de la pantalla de inicio
    if (splashScreen && mainContent) {
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainContent.style.opacity = '1';
                mainHeader.style.transform = 'translateY(0)';
                mainHeader.style.opacity = '1';
            }, 1000); // Coincide con la duración de la transición en CSS
        }, 2000); // 2 segundos para mostrar el logo y el eslogan
    }

    // Lógica para el encabezado fijo
    if (mainHeader) {
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100 && window.scrollY < lastScrollY) {
                // Desplazamiento hacia arriba y ya hemos bajado un poco
                mainHeader.style.transform = 'translateY(0)';
            } else if (window.scrollY > lastScrollY || window.scrollY < 100) {
                // Desplazamiento hacia abajo o al inicio de la página
                mainHeader.style.transform = 'translateY(-100%)';
            }
            lastScrollY = window.scrollY;
        });
    }

    // Funcionalidad de generación de eslóganes para los productos
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length > 0) {
        productCards.forEach(async card => {
            const productName = card.getAttribute('data-product-name');
            const sloganElement = card.querySelector('.product-description');
            const loadingElement = card.querySelector('.slogan-loading');
            
            if (sloganElement && productName) {
                loadingElement.style.display = 'block';
                const slogan = await generateSlogan(productName);
                sloganElement.textContent = slogan;
                loadingElement.style.display = 'none';
            }
        });
    }

    // Funcionalidad del asistente de tallas
    const sizeAssistantForm = document.getElementById('size-assistant-form');
    if (sizeAssistantForm) {
        sizeAssistantForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const height = document.getElementById('height').value;
            const weight = document.getElementById('weight').value;
            const bodyShape = document.getElementById('body-shape').value;
            const resultDiv = document.getElementById('size-result');
            const loadingSpan = document.getElementById('size-loading');

            if (!height || !weight || !bodyShape) {
                showCustomMessage('Por favor, completa todos los campos para obtener tu recomendación.');
                return;
            }

            loadingSpan.style.display = 'block';
            resultDiv.textContent = ''; // Limpiar el resultado anterior

            const recommendation = await calculateSize(height, weight, bodyShape);
            
            resultDiv.textContent = recommendation;
            loadingSpan.style.display = 'none';
        });
    }
};
