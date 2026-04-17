document.addEventListener('DOMContentLoaded', () => {

    /* --- ESTADO GLOBAL (Base de datos Local) --- */
    const STORAGE_KEY = 'tiocode_products';

    // Productos por defecto si el LocalStorage está vacío
    const defaultProducts = [
        {
            id: '1',
            name: 'Tienda Completa',
            price: '75.00',
            category: 'planes',
            description: 'Obtén acceso a una tienda completa preconfigurada. Ideal para empezar tu servidor MTA con una base profesional.',
            images: ['tc.png'] // Fallback or placeholder
        },
        {
            id: '2',
            name: 'Plano Premium',
            price: '8.00',
            category: 'planes',
            description: 'Suscripción mensual para todos los productos de la tienda.',
            images: ['https://via.placeholder.com/400x400/110c18/ff3333?text=Plano+Premium']
        },
        {
            id: '3',
            name: 'Sistema de Notificaciones',
            price: '7.00',
            category: 'scripts',
            description: 'Notificaciones emergentes con múltiples estilos de diseño, iconos e integraciones.',
            images: ['https://via.placeholder.com/400x400/110c18/8a2be2?text=Notificaciones']
        }
    ];

    function getProducts() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            saveProducts(defaultProducts);
            return defaultProducts;
        }
        return JSON.parse(data);
    }

    function saveProducts(products) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }

    /* --- CARRITO ESTADO --- */
    const CART_KEY = 'tiocode_cart';
    
    function getCart() {
        const data = localStorage.getItem(CART_KEY);
        return data ? JSON.parse(data) : [];
    }
    
    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartBadge();
        const cartView = document.getElementById('view-carrito');
        if (cartView && cartView.classList.contains('active')) {
            renderCart();
        }
    }
    
    window.addToCart = function(productId) {
        let cart = getCart();
        if (!cart.includes(productId)) {
            cart.push(productId);
            saveCart(cart);
            alert("¡Producto añadido al carrito!");
        } else {
            alert("Este producto ya está en tu carrito.");
        }
    };
    
    window.removeFromCart = function(productId) {
        let cart = getCart();
        cart = cart.filter(id => id !== productId);
        saveCart(cart);
    };
    
    function updateCartBadge() {
        const cart = getCart();
        const badge = document.getElementById('cartBadgeCount');
        const headerBadge = document.getElementById('cartHeaderCount');
        if (badge) {
            badge.textContent = cart.length;
            badge.style.display = cart.length > 0 ? 'flex' : 'none';
        }
        if (headerBadge) {
            headerBadge.textContent = cart.length;
        }
    }
    
    window.renderCart = function() {
        const cart = getCart();
        const products = getProducts();
        const container = document.getElementById('cartItemsContainer');
        const subtotalEl = document.getElementById('cartSubtotal');
        const totalEl = document.getElementById('cartTotal');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!container) return;
        
        if (cart.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--card-border);">Tu carrito está vacío.</div>`;
            subtotalEl.textContent = '$0.00';
            totalEl.textContent = '$0.00';
            checkoutBtn.classList.add('disabled-checkout');
            return;
        }
        
        container.innerHTML = '';
        let total = 0;
        
        // Mostrar más recientes arriba
        [...cart].reverse().forEach(id => {
            const p = products.find(prod => prod.id === id);
            if (!p) return;
            
            const price = parseFloat(p.price);
            total += price;
            
            let mainImage = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/60x60/2a1f3d/ffffff?text=Sin+Imagen';
            
            const item = document.createElement('div');
            item.className = 'cart-item';
            item.innerHTML = `
                <img src="${mainImage}" class="cart-item-img" alt="${p.name}">
                <div class="cart-item-info">
                    <span>POR SOLO</span>
                    <h4>${p.name}</h4>
                    <div class="price">$${p.price}</div>
                </div>
                <button class="remove-cart-btn" onclick="removeFromCart('${p.id}')"><i class='bx bx-trash'></i></button>
            `;
            container.appendChild(item);
        });
        
        const formattedTotal = '$' + total.toFixed(2);
        subtotalEl.textContent = formattedTotal;
        totalEl.textContent = formattedTotal;
        
        // Checkout state logic
        if (window.currentUser) {
            checkoutBtn.classList.remove('disabled-checkout');
            document.querySelector('.auth-warning-box').style.display = 'none';
        } else {
            checkoutBtn.classList.add('disabled-checkout');
            document.querySelector('.auth-warning-box').style.display = 'flex';
        }
    }
    
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if(confirm("¿Seguro que quieres vaciar el carrito?")) {
                saveCart([]);
                renderCart();
            }
        });
    }

    /* --- PERFILES Y PURCHASES --- */
    window.currentUser = null;

    function getUserPurchases(discordId) {
        const data = localStorage.getItem('tiocode_purchases_' + discordId);
        return data ? JSON.parse(data) : [];
    }

    function saveUserPurchases(discordId, purchases) {
        localStorage.setItem('tiocode_purchases_' + discordId, JSON.stringify(purchases));
    }

    window.renderProfile = function() {
        if (!window.currentUser) {
            alert("Debes iniciar sesión para ver tu perfil.");
            navigateTo('inicio');
            return;
        }
        
        document.getElementById('profileUsername').textContent = window.currentUser.username;
        document.getElementById('profileDiscordId').textContent = window.currentUser.id;
        document.getElementById('profileBigAvatar').src = document.getElementById('userAvatar').src || 'tc.png';

        const grid = document.getElementById('profileProductsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const myPurchasesIds = getUserPurchases(window.currentUser.id);
        const products = getProducts();
        
        if (myPurchasesIds.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">No has adquirido ningún producto aún. En tu ticket un staff te los otorgará.</div>`;
            return;
        }

        myPurchasesIds.forEach(id => {
            const p = products.find(prod => prod.id === id);
            if (!p) return;
            
            let mainImage = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/400x200/2a1f3d/ffffff?text=Sin+Imagen';
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    <span class="badge badge-instant">ADQUIRIDO</span>
                    <img src="${mainImage}" alt="${p.name}">
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>Producto vinculado a tu cuenta para siempre.</p>
                    <div class="product-footer mt-2" style="margin-top: auto;">
                        <button class="btn btn-secondary" style="width: 100%; border: 1px solid var(--primary-red); color: var(--primary-red); justify-content: center;"><i class='bx bx-download'></i> Descargar</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    /* --- ADMIN OTORGAR PRODUCTOS --- */
    const grantProductBtn = document.getElementById('grantProductBtn');
    if (grantProductBtn) {
        grantProductBtn.addEventListener('click', () => {
            const userId = document.getElementById('grantDiscordId').value.trim();
            const prodId = document.getElementById('grantProductId').value;
            
            if (!userId) return alert("Ingresa un ID de Discord válido.");
            if (!prodId) return alert("Selecciona un producto.");
            
            const userP = getUserPurchases(userId);
            if (!userP.includes(prodId)) {
                userP.push(prodId);
                saveUserPurchases(userId, userP);
                alert("¡Producto otorgado exitosamente al ID " + userId + "!");
                document.getElementById('grantDiscordId').value = '';
            } else {
                alert("El usuario ya posee este producto.");
            }
        });
    }


    /* --- ENRUTADOR (SPA Router) --- */
    const views = document.querySelectorAll('.view');
    const navLinks = document.querySelectorAll('.nav-btn');

    function navigateTo(viewId) {
        // Ocultar todas las vistas
        views.forEach(view => view.classList.remove('active'));
        // Mostrar la solicitada
        const targetView = document.getElementById('view-' + viewId);
        if (targetView) {
            targetView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' });
            if (viewId === 'carrito') {
                renderCart();
            }
            if (viewId === 'perfil') {
                renderProfile();
            }
        }

        // Marcar navegación como activa (solo en el top navbar)
        document.querySelectorAll('.navbar .nav-links a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('data-link') === viewId) {
                a.classList.add('active');
            }
        });
    }

    // Escuchar clics en todos los botones que navegan
    document.querySelectorAll('[data-link]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = el.getAttribute('data-link');
            navigateTo(viewId);
            
            // Cerrar menú de perfil si estaba abierto
            const userProfile = document.getElementById('userProfile');
            if (userProfile && userProfile.classList.contains('active')) {
                userProfile.classList.remove('active');
            }
        });
    });


    /* --- RENDERIZADO DE LA TIENDA --- */
    function renderStore() {
        const products = getProducts();
        const grid = document.getElementById('dynamicProductsGrid');
        const countDisplay = document.getElementById('storeProductCount');
        const homeCountDisplay = document.getElementById('homeProductsCount');
        
        if (!grid) return;
        
        // Filtros (Simplificado para el ejemplo)
        const maxPrice = parseFloat(document.getElementById('priceRange')?.value || 150);
        
        // Checkboxes check
        const activeCategories = Array.from(document.querySelectorAll('.categories input[type="checkbox"]:checked')).map(cb => cb.value);

        const targetSearch = document.getElementById('searchInput')?.value.toLowerCase() || '';

        grid.innerHTML = '';
        let visibleCount = 0;

        products.forEach(p => {
            const prodPrice = parseFloat(p.price);
            
            // Lógica de Filtros
            if (prodPrice > maxPrice) return;
            if (activeCategories.length > 0 && !activeCategories.includes(p.category)) return;
            if (targetSearch && !p.name.toLowerCase().includes(targetSearch)) return;

            visibleCount++;

            let mainImage = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/400x200/2a1f3d/ffffff?text=Sin+Imagen';
            
            // Badge color based on category
            let categoryText = p.category.toUpperCase();
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.onclick = () => openProductDetail(p.id);

            card.innerHTML = `
                <div class="product-image">
                    <span class="badge badge-${p.category}">${categoryText}</span>
                    <img src="${mainImage}" alt="${p.name}">
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <div class="product-footer">
                        <div class="price">$${p.price}</div>
                        <div class="actions">
                            <button class="add-btn" onclick="event.stopPropagation(); window.addToCart('${p.id}');"><i class='bx bx-cart'></i> CARRO</button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        if (countDisplay) countDisplay.textContent = `${visibleCount} productos`;
        if (homeCountDisplay) homeCountDisplay.textContent = `+${products.length}`;
    }


    /* --- VISTA DE DETALLE DE PRODUCTO --- */
    function openProductDetail(productId) {
        const products = getProducts();
        const p = products.find(prod => prod.id === productId);
        if(!p) return;

        document.getElementById('detailBreadcrumbName').textContent = p.name;
        document.getElementById('detailTitle').textContent = p.name;
        document.getElementById('detailPrice').textContent = '$' + p.price;
        document.getElementById('detailDescription').textContent = p.description;
        
        let categoryText = p.category.toUpperCase();
        const catBadge = document.getElementById('detailCategory');
        catBadge.textContent = categoryText;
        catBadge.className = `badge detail-cat-badge badge-${p.category}`;

        // Renderizar Imágenes
        const mainImageBox = document.getElementById('detailMainImage');
        const thumbnailsContainer = document.getElementById('detailThumbnails');
        const galleryCount = document.getElementById('detailGalleryCount');

        let images = p.images && p.images.length > 0 ? p.images : ['https://via.placeholder.com/600x400/2a1f3d/ffffff?text=Sin+Imagen'];
        
        galleryCount.textContent = images.length;
        mainImageBox.src = images[0];
        thumbnailsContainer.innerHTML = '';

        images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = index === 0 ? 'thumb-img active' : 'thumb-img';
            thumb.onclick = () => {
                // Cambiar main image
                mainImageBox.src = imgSrc;
                // Quitar 'active' a todas
                document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbnailsContainer.appendChild(thumb);
        });

        const addToCartBtn = document.getElementById('detailAddToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.onclick = () => window.addToCart(p.id);
        }

        navigateTo('producto');
    }


    /* --- VISTA DEL ADMIN (Tabla) --- */
    function renderAdminTable() {
        const products = getProducts();
        const tbody = document.getElementById('adminProductsTable');
        if (!tbody) return;

        tbody.innerHTML = '';
        products.forEach(p => {
            let img = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/60x40/2a1f3d/ffffff';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="admin-td-img"><img src="${img}" alt="${p.name}"></td>
                <td class="admin-td-title">${p.name}</td>
                <td><span class="badge badge-${p.category}">${p.category.toUpperCase()}</span></td>
                <td style="font-weight: 700;">$${p.price}</td>
                <td class="admin-td-actions">
                    <button class="btn-small-action btn-secondary" onclick="editProduct('${p.id}')"><i class='bx bx-edit'></i> Editar</button>
                    <button class="btn-small-action btn-primary" onclick="deleteProduct('${p.id}')"><i class='bx bx-trash'></i> Borrar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Hacer funciones globales para onclick HTML
    window.deleteProduct = function(id) {
        if(confirm("¿Estás seguro de que quieres eliminar este producto?")) {
            let products = getProducts();
            products = products.filter(p => p.id !== id);
            saveProducts(products);
            renderAdminTable();
            renderStore();
        }
    };

    window.editProduct = function(id) {
        const products = getProducts();
        const p = products.find(prod => prod.id === id);
        if(!p) return;

        // Rellenar form modal
        document.getElementById('editProductId').value = p.id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodCategory').value = p.category;
        document.getElementById('prodDesc').value = p.description;

        document.getElementById('modalTitle').innerHTML = "<i class='bx bx-edit'></i> Editar Producto";
        document.getElementById('submitModalBtn').innerHTML = "<i class='bx bx-save'></i> Guardar Cambios";

        // Cargar miniaturas de previsualización
        uploadedImagesDataUrls = [...(p.images || [])];
        renderUploadPreviews();

        adminModal.classList.add('active');
    };


    /* --- LOGICA DEL MODAL DE CREACION/EDICION --- */
    const adminModal = document.getElementById('adminModal');
    const openAddModalBtn = document.getElementById('openAddModalBtn');
    const closeAdminModal = document.getElementById('closeAdminModal');
    const addProductForm = document.getElementById('addProductForm');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const prodImages = document.getElementById('prodImages');
    const imagePreviewGrid = document.getElementById('imagePreviewGrid');

    let uploadedImagesDataUrls = [];

    // Open Modal para NUEVO producto
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            addProductForm.reset();
            document.getElementById('editProductId').value = '';
            uploadedImagesDataUrls = [];
            renderUploadPreviews();
            
            document.getElementById('modalTitle').innerHTML = "<i class='bx bx-plus'></i> Subir Nuevo Producto";
            document.getElementById('submitModalBtn').innerHTML = "<i class='bx bx-check'></i> Publicar Producto";
            
            adminModal.classList.add('active');
        });
    }

    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', (e) => {
            e.preventDefault();
            adminModal.classList.remove('active');
        });
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) adminModal.classList.remove('active');
        });
    }

    if (imageUploadArea && prodImages) {
        imageUploadArea.addEventListener('click', () => prodImages.click());
    }

    if (prodImages && imagePreviewGrid) {
        prodImages.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            files.forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImagesDataUrls.push(event.target.result);
                    renderUploadPreviews();
                };
                reader.readAsDataURL(file);
            });
            prodImages.value = '';
        });
    }

    function renderUploadPreviews() {
        if(!imagePreviewGrid) return;
        imagePreviewGrid.innerHTML = '';
        uploadedImagesDataUrls.forEach((dataUrl, index) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${dataUrl}" alt="Preview">
                <button type="button" class="remove-img" data-index="${index}"><i class='bx bx-x'></i></button>
            `;
            imagePreviewGrid.appendChild(div);
        });

        document.querySelectorAll('.remove-img').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-index'));
                uploadedImagesDataUrls.splice(index, 1);
                renderUploadPreviews();
            });
        });
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const eId = document.getElementById('editProductId').value;
            const name = document.getElementById('prodName').value;
            const price = parseFloat(document.getElementById('prodPrice').value).toFixed(2);
            const category = document.getElementById('prodCategory').value;
            const desc = document.getElementById('prodDesc').value;

            let products = getProducts();

            if (eId) {
                // Modo Edición
                const idx = products.findIndex(p => p.id === eId);
                if(idx !== -1) {
                    products[idx] = {
                        ...products[idx], name, price, category, description: desc, images: [...uploadedImagesDataUrls]
                    };
                }
            } else {
                // Modo Creación
                const newProduct = {
                    id: Date.now().toString(), // Generar ID único
                    name: name,
                    price: price,
                    category: category,
                    description: desc,
                    images: [...uploadedImagesDataUrls]
                };
                // Agregar al inicio del arreglo para que aparezca primero
                products.unshift(newProduct);
            }

            saveProducts(products);
            
            // Actualizar la interfaz
            renderAdminTable();
            renderStore();
            
            // Reset y cerrar
            addProductForm.reset();
            uploadedImagesDataUrls = [];
            renderUploadPreviews();
            adminModal.classList.remove('active');
        });
    }


    /* --- FILTROS DE TIENDA EN VIVO --- */
    const searchInput = document.getElementById('searchInput');
    const priceSlider = document.getElementById('priceRange');
    const categoryChecks = document.querySelectorAll('.categories input[type="checkbox"]');

    if (searchInput) searchInput.addEventListener('input', renderStore);
    if (priceSlider) {
        const priceDisplay = document.querySelector('.price-labels span:nth-child(2)');
        priceSlider.addEventListener('input', (e) => {
            if(priceDisplay) priceDisplay.textContent = `$${parseFloat(e.target.value).toFixed(2)}`;
            renderStore();
        });
    }
    if (categoryChecks.length > 0) {
        categoryChecks.forEach(cb => cb.addEventListener('change', renderStore));
    }


    /* --- AUTENTICACION Y LOGIN --- */
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPanelLink = document.getElementById('adminPanelLink');
    const CLIENT_ID = '1489102435363323944'; 
    const REDIRECT_URI = window.location.href.split('#')[0];

    if (loginBtn && userProfile) {
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        const [accessToken, tokenType] = [fragment.get('access_token'), fragment.get('token_type')];

        if (accessToken) {
            fetch('https://discord.com/api/users/@me', {
                headers: { authorization: `${tokenType} ${accessToken}` }
            })
            .then(result => result.json())
            .then(response => {
                const { id, username, avatar } = response;
                window.currentUser = { id, username, avatar };
                
                loginBtn.style.display = 'none';
                userProfile.style.display = 'flex';
                
                if (avatar) {
                    userAvatar.src = `https://cdn.discordapp.com/avatars/${id}/${avatar}.webp?size=128`;
                } else {
                    const defaultAvatarNum = (BigInt(id) >> 22n) % 6n;
                    userAvatar.src = `https://cdn.discordapp.com/embed/avatars/${Number(defaultAvatarNum)}.png`;
                }

                if (id === '1368858573685395488') {
                    if (adminPanelLink) adminPanelLink.style.display = 'flex';
                }

                window.history.replaceState(null, null, window.location.pathname + window.location.search);
                
                // Si la vista actual es el carrito, renderizar para cambiar el checkoutBtn
                const cartView = document.getElementById('view-carrito');
                if (cartView && cartView.classList.contains('active')) renderCart();
                
            }).catch(console.error);
        }

        loginBtn.addEventListener('click', () => {
            const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=identify`;
            window.location.href = oauthUrl;
        });

        userProfile.addEventListener('click', (e) => {
            if (e.target.closest('.user-dropdown') && e.target.id !== 'logoutBtn') return;
            userProfile.classList.toggle('active');
        });

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.currentUser = null;
            userProfile.style.display = 'none';
            userProfile.classList.remove('active');
            loginBtn.style.display = 'flex';
            if (adminPanelLink) adminPanelLink.style.display = 'none';
            
            const cartView = document.getElementById('view-carrito');
            if (cartView && cartView.classList.contains('active')) renderCart();
                
            navigateTo('inicio'); // Volver al inicio si se desloguea
        });

        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                userProfile.classList.remove('active');
            }
        });
    }

/* ====================== CHECKOUT - CONEXIÓN CON EL BOT ====================== */
const checkoutBtn = document.getElementById('checkoutBtn');

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        // Verificaciones
        if (!window.currentUser) {
            alert("❌ Debes iniciar sesión con Discord primero.");
            return;
        }

        const tosCheck = document.getElementById('tosCheck');
        if (!tosCheck || !tosCheck.checked) {
            alert("❌ Debes aceptar los Términos de Uso.");
            return;
        }

        const cart = getCart();
        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        // Preparar datos
        const products = getProducts();
        const orderItems = cart.map(id => {
            const p = products.find(prod => prod.id === id);
            return p ? `${p.name} ($${p.price})` : 'Producto desconocido';
        });

        const totalAmount = document.getElementById('cartTotal').textContent || '$0.00';

        // Feedback visual
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Creando ticket...`;
        checkoutBtn.disabled = true;

        try {
            const response = await fetch('http://5.78.180.254:5021/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    discordId: window.currentUser.id,
                    username: window.currentUser.username,
                    items: orderItems,
                    total: totalAmount
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Éxito
                saveCart([]);
                updateCartBadge();

                // Mensaje bonito dentro del carrito
                const container = document.getElementById('cartItemsContainer');
                container.innerHTML = `
                    <div style="text-align:center; padding:60px 20px; background:var(--card-bg); border-radius:16px; border:2px solid #22c55e;">
                        <h2 style="color:#22c55e; margin-bottom:15px;">✅ ¡Ticket creado correctamente!</h2>
                        <p style="margin-bottom:25px;">Se ha abierto tu ticket de compra en Discord.</p>
                        <a href="${data.ticketUrl}" target="_blank" 
                           class="btn btn-primary-full" style="font-size:18px; padding:14px 32px;">
                            🗣️ Ir a mi Ticket en Discord
                        </a>
                        <p style="margin-top:30px; color:var(--text-muted);">
                            Un staff te atenderá pronto para procesar el pago.
                        </p>
                    </div>
                `;
            } else {
                alert("❌ Error del bot: " + (data.error || "Inténtalo de nuevo"));
            }
        } catch (e) {
            console.error(e);
            alert("❌ No se pudo conectar con el bot.\n\nVerifica que el bot esté Online en Cybrancee.");
        } finally {
            // Restaurar botón
            checkoutBtn.innerHTML = originalText;
            checkoutBtn.disabled = false;
        }
    });
}

    /* --- FAQ Accordion --- */
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        header.addEventListener('click', () => {
            const activeItem = document.querySelector('.faq-item.active');
            if (activeItem && activeItem !== item) {
                activeItem.classList.remove('active');
                activeItem.querySelector('.faq-content').style.maxHeight = null;
            }
            item.classList.toggle('active');
            const content = item.querySelector('.faq-content');
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    // INICIALIZACIÓN
    renderStore();
    renderAdminTable();
    updateCartBadge();
});
