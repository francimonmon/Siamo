// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, collection, addDoc, onSnapshot, serverTimestamp, setDoc, deleteDoc, getDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Inicialización de la aplicación
console.log("Iniciando aplicación...");

// Variables globales proporcionadas por el entorno de Canvas
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Referencias a elementos del DOM
const productsGrid = document.getElementById('products-grid');
const cartCountEl = document.getElementById('cart-count');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartModal = document.getElementById('cart-modal');
const messageModal = document.getElementById('message-modal');
const messageTitle = document.getElementById('message-title');
const messageBody = document.getElementById('message-body');
const userInfoEl = document.getElementById('user-info');
const productForm = document.getElementById('product-form');
const filterTypeEl = document.getElementById('filter-type');
const filterSizeEl = document.getElementById('filter-size');
const filterPriceEl = document.getElementById('filter-price');

let db, auth, userId;

// Función para mostrar mensajes personalizados (modal)
function showMessage(title, body) {
    if (messageTitle && messageBody && messageModal) {
        messageTitle.textContent = title;
        messageBody.textContent = body;
        messageModal.style.display = 'flex';
    }
}

// Inicializar Firebase
if (Object.keys(firebaseConfig).length > 0) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Autenticar al usuario
    const signIn = async () => {
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Error de autenticación:", error);
            showMessage('Error de Autenticación', 'No se pudo iniciar sesión. Por favor, recargue la página.');
        }
    };
    
    signIn();

    // Escuchar el estado de autenticación para obtener el ID de usuario
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;
            if (userInfoEl) userInfoEl.textContent = `Usuario: ${userId}`;
            
            // Suscribirse a los cambios del carrito solo cuando el usuario está autenticado
            onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/cart`), (snapshot) => {
                const cartItems = [];
                snapshot.forEach(doc => {
                    cartItems.push({ id: doc.id, ...doc.data() });
                });
                updateCartUI(cartItems);
            });
        } else {
            if (userInfoEl) userInfoEl.textContent = "Usuario anónimo";
        }
    });

} else {
    console.error("Error: Configuración de Firebase no proporcionada.");
    if (userInfoEl) userInfoEl.textContent = "Error: Configuración de Firebase faltante";
}

// Renderiza un producto en la página
function renderProduct(product) {
    if (!productsGrid) return; // Salir si no estamos en la página de productos
    const productCard = document.createElement('div');
    productCard.classList.add('product-card');
    productCard.innerHTML = `
        <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=No+Imagen'">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">$${product.price.toFixed(2)}</p>
        <button class="btn add-to-cart-btn" data-id="${product.id}">Añadir al carrito</button>
    `;
    productsGrid.appendChild(productCard);
}

// Actualiza el carrito en la UI desde Firestore
function updateCartUI(cartItems) {
    if (!cartCountEl || !cartItemsEl || !cartTotalEl) return;
    
    cartCountEl.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
    cartItemsEl.innerHTML = '';
    let total = 0;

    cartItems.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('cart-item');
        li.innerHTML = `
            <div class="cart-item-info">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                </div>
            </div>
            <div class="cart-item-actions">
                <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
                <i class="fas fa-trash-alt remove-item" data-id="${item.id}"></i>
            </div>
        `;
        cartItemsEl.appendChild(li);
        total += item.price * item.quantity;
    });

    cartTotalEl.textContent = `$${total.toFixed(2)}`;
    
    // Agregar eventos para actualizar cantidad y eliminar
    cartItemsEl.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const newQuantity = parseInt(e.target.value);
            if (newQuantity < 1) {
                 e.target.value = 1;
                 return;
            }
            try {
                const cartRef = doc(db, `artifacts/${appId}/users/${userId}/cart`, id);
                await setDoc(cartRef, { quantity: newQuantity }, { merge: true });
            } catch (e) {
                console.error("Error al actualizar la cantidad:", e);
            }
        });
    });

    cartItemsEl.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            try {
                const cartRef = doc(db, `artifacts/${appId}/users/${userId}/cart`, id);
                await deleteDoc(cartRef);
            } catch (e) {
                console.error("Error al eliminar el producto:", e);
            }
        });
    });
}

// Lógica de los botones del carrito y checkout
if (document.getElementById('cart-icon')) {
    document.getElementById('cart-icon').addEventListener('click', () => {
        if (cartModal) cartModal.classList.add('show');
    });
}
if (document.getElementById('close-cart')) {
    document.getElementById('close-cart').addEventListener('click', () => {
        if (cartModal) cartModal.classList.remove('show');
    });
}
if (document.getElementById('checkout-btn')) {
    document.getElementById('checkout-btn').addEventListener('click', async () => {
        const cartItems = await getDocs(collection(db, `artifacts/${appId}/users/${userId}/cart`));
        if (cartItems.empty) {
            showMessage('Carrito Vacío', 'No hay productos en tu carrito para finalizar la compra.');
            return;
        }

        try {
            const cartDocs = await getDocs(collection(db, `artifacts/${appId}/users/${userId}/cart`));
            cartDocs.forEach(async d => { await deleteDoc(d.ref); });

            if (cartModal) cartModal.classList.remove('show');
            showMessage('¡Compra Exitosa!', 'Tu pedido ha sido procesado. ¡Gracias por tu compra!');
        } catch (e) {
            console.error("Error al finalizar la compra:", e);
            showMessage('Error', 'Hubo un problema al procesar tu compra. Por favor, inténtalo de nuevo.');
        }
    });
}

// Lógica para añadir productos al carrito en Firestore
if (productsGrid) {
    productsGrid.addEventListener('click', async (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.id;
            const productCard = e.target.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = parseFloat(productCard.querySelector('.price').textContent.replace('$', ''));
            const productImage = productCard.querySelector('img').src;
            
            if (!userId) {
                showMessage('Error', 'No se pudo agregar el producto. Intenta recargar la página.');
                return;
            }

            try {
                const cartRef = doc(db, `artifacts/${appId}/users/${userId}/cart`, productId);
                const existingItem = await getDoc(cartRef);
                
                let newQuantity = 1;
                if (existingItem.exists()) {
                    newQuantity = existingItem.data().quantity + 1;
                }
                
                await setDoc(cartRef, {
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: newQuantity,
                    createdAt: serverTimestamp()
                }, { merge: true });
                
                showMessage('Producto Añadido', `Has añadido "${productName}" a tu carrito.`);
            } catch (e) {
                console.error("Error al añadir al carrito:", e);
                showMessage('Error', 'No se pudo añadir el producto al carrito. Por favor, inténtalo de nuevo.');
            }
        }
    });
}

// Lógica para el formulario de gestión de productos (solo en index.html)
if (productForm) {
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const type = document.getElementById('product-type').value;
        const size = document.getElementById('product-size').value;
        const image = document.getElementById('product-image').value;
        const description = document.getElementById('product-description').value;

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/products`), {
                name,
                price,
                type,
                size,
                image,
                description,
                createdAt: serverTimestamp()
            });
            productForm.reset();
            showMessage('Producto Agregado', `El producto "${name}" se ha añadido a la base de datos.`);
        } catch (e) {
            console.error("Error al agregar documento: ", e);
            showMessage('Error', 'No se pudo agregar el producto. Por favor, inténtalo de nuevo.');
        }
    });
}

// Lógica de los filtros y carga de productos (solo en products.html)
if (productsGrid && filterTypeEl && filterSizeEl && filterPriceEl) {
    let unsubscribeProducts = null;

    const applyFilters = () => {
        if (unsubscribeProducts) unsubscribeProducts();

        const type = filterTypeEl.value;
        const size = filterSizeEl.value;
        const price = parseFloat(filterPriceEl.value);

        let productsQuery = collection(db, `artifacts/${appId}/public/data/products`);
        let filters = [];

        if (type !== 'all') {
            filters.push(where('type', '==', type));
        }
        if (size !== 'all') {
            filters.push(where('size', '==', size));
        }
        if (!isNaN(price) && price > 0) {
            filters.push(where('price', '<=', price));
        }

        productsQuery = query(productsQuery, ...filters);

        unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            productsGrid.innerHTML = '';
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            // Ordenamos en el cliente para evitar el error de índice de Firestore
            products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            products.forEach(product => renderProduct(product));
        }, (error) => {
            console.error("Error al obtener productos:", error);
        });
    };

    filterTypeEl.addEventListener('change', applyFilters);
    filterSizeEl.addEventListener('change', applyFilters);
    filterPriceEl.addEventListener('input', applyFilters);

    // Carga inicial de productos sin filtros
    applyFilters();
}
