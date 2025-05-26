// ----------------------------------------------------------------------------------
// Configuração e inicialização da aplicação
// ----------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
initApp();
});

// ----------------------------------------------------------------------------------
// Chaves de API
// ----------------------------------------------------------------------------------
const GNEWS_API_KEY = 'f8bfa1bbc80090ef7784977d60dc3ba6';
const UNSPLASH_ACCESS_KEY = 'KCEkOtn8knGiMN5VuceAm6THNQcslVEoAbuc_uFeR_c';
const OPENWEATHER_API_KEY = '5d68e8037d1b1a9ecd20c8bc66f9a834';

// ----------------------------------------------------------------------------------
// Configurações da Aplicação
// ----------------------------------------------------------------------------------
const CONFIG = {
ARTICLES_PER_PAGE: 6,                  // Quantidade de artigos por página
CACHE_DURATION_MS: 15 * 60 * 1000,     // 15 minutos para o cache
DEFAULT_CATEGORY: 'technology',        // Categoria inicial
DEFAULT_LANGUAGE: 'pt',                // Idioma padrão
DEFAULT_COUNTRY: 'br',                 // País padrão
DEBOUNCE_DELAY: 400,                   // Delay para debounce de busca
MAX_ARTICLES_TO_FETCH: 10,             // Máximo de artigos para buscar (GNews free tier limit)
READING_SPEED_WPM: 200,                // Velocidade média de leitura (palavras por minuto)
VIEW_PREFERENCES_KEY: 'view_preferences',  // Key para localStorage de preferências de visualização
WEATHER_UPDATE_INTERVAL: 30 * 60 * 1000  // 30 minutos para atualizar dados do clima
};

// ----------------------------------------------------------------------------------
// Estado da Aplicação
// ----------------------------------------------------------------------------------
const AppState = {
currentCategory: CONFIG.DEFAULT_CATEGORY,
currentPage: 1,
allFetchedArticles: [],
searchTerm: '',
isLoading: false,
isGridView: true,
lastWeatherUpdate: null,
readingList: [],
fontSizeLevel: 'normal',  // 'small', 'normal', 'large'
weatherOpen: false
};

// ----------------------------------------------------------------------------------
// Elementos do DOM: seleção centralizada
// ----------------------------------------------------------------------------------
const DOM = {
newsContainer: document.getElementById('news-container'),
headerImage: document.getElementById('header-image'),
messagesContainer: document.getElementById('messages-container'),
categoryLinks: document.querySelectorAll('.category-link'),
currentCategoryTitle: document.getElementById('current-category-title'),
searchForm: document.getElementById('search-form'),
searchInput: document.getElementById('search-input'),
backToTopBtn: document.getElementById('back-to-top-btn'),
currentYearElement: document.getElementById('current-year'),
themeTogglerBtn: document.getElementById('theme-toggler-btn'),
paginationContainer: document.getElementById('pagination-container'),
loadMoreBtn: document.getElementById('load-more-btn'),
currentDateElement: document.getElementById('current-date'),
viewTogglers: {
    gridBtn: document.getElementById('grid-view-btn'),
    listBtn: document.getElementById('list-view-btn')
},
newsSkeleton: document.getElementById('news-loading-skeleton'),
notificationContainer: document.getElementById('notification-container'),
readingList: {
    container: document.getElementById('reading-list-container'),
    emptyMessage: document.getElementById('reading-list-empty'),
    badge: document.getElementById('reading-list-badge'),
    clearBtn: document.getElementById('clear-reading-list')
},
fontSizeControls: {
    increase: document.getElementById('font-size-increase'),
    decrease: document.getElementById('font-size-decrease'),
    reset: document.getElementById('font-size-reset')
},
weather: {
    widget: document.getElementById('weather-widget'),
    toggle: document.getElementById('weather-toggle'),
    loading: document.getElementById('weather-loading'),
    data: document.getElementById('weather-data'),
    temp: document.getElementById('weather-temp'),
    icon: document.getElementById('weather-icon'),
    location: document.getElementById('weather-location')
}
};

// ----------------------------------------------------------------------------------
// Inicialização da Aplicação
// ----------------------------------------------------------------------------------
function initApp() {
// Verificar e configurar chaves de API
if (!validateAPIKeys()) {
    showNotification('Chaves de API não configuradas corretamente', 'error');
    return;
}

// Carregar tema
loadTheme();

// Configurar tamanho da fonte
loadFontSize();

// Preencher ano atual no footer
if (DOM.currentYearElement) {
    DOM.currentYearElement.textContent = new Date().getFullYear();
}

// Mostrar data atual
updateCurrentDate();

// Preparar skeletons para carregamento
createLoadingSkeletons();

// Recuperar dados da lista de leitura do localStorage
loadReadingList();

// Carregar preferências de visualização (grid/lista)
loadViewPreference();

// Adicionar eventos para elementos da UI
setupEventListeners();

// Iniciar carregando a categoria padrão
loadInitialCategory();

// Verificar geolocalização e inicializar widget de clima
initWeatherWidget();
}

function validateAPIKeys() {
const isGNewsValid = GNEWS_API_KEY && GNEWS_API_KEY !== 'SUA_CHAVE_GNEWS';
const isUnsplashValid = UNSPLASH_ACCESS_KEY && UNSPLASH_ACCESS_KEY !== 'SUA_CHAVE_UNSPLASH';
const isWeatherValid = OPENWEATHER_API_KEY && OPENWEATHER_API_KEY !== 'SUA_CHAVE_OPENWEATHER';

if (!isGNewsValid) {
    console.error('Chave da API do GNews não configurada corretamente.');
}

if (!isUnsplashValid) {
    console.error('Chave da API do Unsplash não configurada corretamente.');
    if (DOM.headerImage) DOM.headerImage.style.display = 'none';
}

if (!isWeatherValid) {
    console.error('Chave da API do OpenWeather não configurada.');
    hideWeatherWidget();
}

return isGNewsValid; // A API GNews é a mais crítica para o funcionamento
}

function updateCurrentDate() {
if (!DOM.currentDateElement) return;

const now = new Date();
const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
};
DOM.currentDateElement.textContent = now.toLocaleDateString('pt-BR', options);
}

function loadInitialCategory() {
const activeCategoryLink = document.querySelector(`.category-link[data-category="${AppState.currentCategory}"]`);
if (activeCategoryLink) activeCategoryLink.classList.add('active');
else console.warn(`Link para categoria inicial "${AppState.currentCategory}" não encontrado.`);

fetchHeaderImage(AppState.currentCategory);
fetchNews(AppState.currentCategory);
}

// ----------------------------------------------------------------------------------
// Event Listeners
// ----------------------------------------------------------------------------------
function setupEventListeners() {
// Event listeners para links de categorias
if (DOM.categoryLinks) {
    DOM.categoryLinks.forEach(link => {
        link.addEventListener('click', handleCategoryClick);
    });
}

// Event listener para o formulário de busca
if (DOM.searchForm) {
    DOM.searchForm.addEventListener('submit', handleSearchSubmit);
}

// Event listener para o input de busca (com debounce)
if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', debounce(() => {
        if (!DOM.searchInput.value.trim()) {
            clearMessages();
            resetSearch();
        }
    }, CONFIG.DEBOUNCE_DELAY));
}

// Event listener para o botão de voltar ao topo
if (DOM.backToTopBtn) {
    window.addEventListener('scroll', handleScroll);
    DOM.backToTopBtn.addEventListener('click', scrollToTop);
}

// Event listener para o botão de alternar tema
if (DOM.themeTogglerBtn) {
    DOM.themeTogglerBtn.addEventListener('click', toggleTheme);
}

// Event listeners para botões de alternar visualização (grid/lista)
if (DOM.viewTogglers.gridBtn && DOM.viewTogglers.listBtn) {
    DOM.viewTogglers.gridBtn.addEventListener('click', () => switchView('grid'));
    DOM.viewTogglers.listBtn.addEventListener('click', () => switchView('list'));
}

// Event listener para botão "Carregar mais"
if (DOM.loadMoreBtn) {
    DOM.loadMoreBtn.addEventListener('click', loadMoreArticles);
}

// Event listeners para controles de tamanho de fonte
if (DOM.fontSizeControls.increase) {
    DOM.fontSizeControls.increase.addEventListener('click', () => changeFontSize('increase'));
}
if (DOM.fontSizeControls.decrease) {
    DOM.fontSizeControls.decrease.addEventListener('click', () => changeFontSize('decrease'));
}
if (DOM.fontSizeControls.reset) {
    DOM.fontSizeControls.reset.addEventListener('click', () => changeFontSize('reset'));
}

// Event listener para botão de limpar lista de leitura
if (DOM.readingList.clearBtn) {
    DOM.readingList.clearBtn.addEventListener('click', clearReadingList);
}

// Event listener para weather toggle
if (DOM.weather.toggle) {
    DOM.weather.toggle.addEventListener('click', toggleWeatherWidget);
}
}

function handleCategoryClick(e) {
e.preventDefault();
if (AppState.isLoading) return;

const newCategory = e.target.dataset.category;
if (newCategory === AppState.currentCategory) return; // Evita recarregar a mesma categoria

AppState.currentCategory = newCategory;
AppState.currentPage = 1;
AppState.searchTerm = '';

if (DOM.searchInput) DOM.searchInput.value = '';

fetchHeaderImage(AppState.currentCategory);
fetchNews(AppState.currentCategory);

// Atualiza classe active nos links
DOM.categoryLinks.forEach(l => l.classList.remove('active'));
e.target.classList.add('active');

// Rastreamento de Analytics (simulado)
trackEvent('category_changed', { category: AppState.currentCategory });
}

function handleSearchSubmit(e) {
e.preventDefault();
const searchTerm = DOM.searchInput ? DOM.searchInput.value.trim() : '';
if (searchTerm) {
    performSearch(searchTerm);
} else {
    resetSearch();
}
}

function handleScroll() {
// Mostrar/ocultar botão de voltar ao topo baseado na posição de rolagem
if (!DOM.backToTopBtn) return;

if (window.pageYOffset > 300) {
    DOM.backToTopBtn.style.display = 'block';
} else {
    DOM.backToTopBtn.style.display = 'none';
}
}

// ----------------------------------------------------------------------------------
// Funções de Tema
// ----------------------------------------------------------------------------------
function applyTheme(theme) {
document.documentElement.setAttribute('data-bs-theme', theme);

if (DOM.themeTogglerBtn) {
    const themeIcon = DOM.themeTogglerBtn.querySelector('i');
    const themeText = DOM.themeTogglerBtn.querySelector('span');
    
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'bi bi-moon-stars-fill me-2' : 'bi bi-sun-fill me-2';
    }
    
    if (themeText) {
        themeText.textContent = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
    }
}

localStorage.setItem('theme', theme);

// Rastreamento de Analytics (simulado)
trackEvent('theme_changed', { theme });
}

function toggleTheme() {
const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
const newTheme = currentTheme === 'light' ? 'dark' : 'light';
applyTheme(newTheme);
}

function loadTheme() {
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');
applyTheme(defaultTheme);
}

// ----------------------------------------------------------------------------------
// Funções de Cache
// ----------------------------------------------------------------------------------
function getCacheKey(category, searchTerm = null) {
return searchTerm 
    ? `gnews_search_cache_${category}_${searchTerm}`
    : `gnews_cache_${category}`;
}

function getCachedNews(category, searchTerm = null) {
const cacheKey = getCacheKey(category, searchTerm);
const cachedItem = localStorage.getItem(cacheKey);

if (cachedItem) {
    try {
        const { timestamp, articles } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < CONFIG.CACHE_DURATION_MS) {
            console.log(`Carregando dados do cache: ${cacheKey}`);
            return articles;
        } else {
            localStorage.removeItem(cacheKey); // Cache expirado
            console.log(`Cache expirado: ${cacheKey}`);
        }
    } catch (e) {
        console.error("Erro ao parsear cache:", e);
        localStorage.removeItem(cacheKey); // Remove cache corrompido
    }
}
return null;
}

function cacheNews(category, articles, searchTerm = null) {
const cacheKey = getCacheKey(category, searchTerm);
const itemToCache = {
    timestamp: Date.now(),
    articles: articles
};

try {
    localStorage.setItem(cacheKey, JSON.stringify(itemToCache));
    console.log(`Dados salvos no cache: ${cacheKey}`);
} catch (e) {
    console.error("Erro ao salvar no cache (provavelmente localStorage cheio):", e);
    // Tenta limpar caches antigos para liberar espaço
    cleanOldCaches();
}
}

function cleanOldCaches() {
const cacheKeysPattern = /^gnews_/;
const keysToRemove = [];

// Encontre todos os itens de cache no localStorage
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (cacheKeysPattern.test(key)) {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (Date.now() - data.timestamp > CONFIG.CACHE_DURATION_MS) {
                keysToRemove.push(key);
            }
        } catch (e) {
            // Se não conseguir parsear, é provavelmente um item corrompido
            keysToRemove.push(key);
        }
    }
}

// Remova os caches antigos ou corrompidos
keysToRemove.forEach(key => localStorage.removeItem(key));
console.log(`Limpou ${keysToRemove.length} itens antigos do cache`);
}

// ----------------------------------------------------------------------------------
// Funções de UI (Loading, Mensagens, Notificações)
// ----------------------------------------------------------------------------------
function showMessage(message, type = 'info') {
if (!DOM.messagesContainer) return;

DOM.messagesContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function clearMessages() {
if (DOM.messagesContainer) {
    DOM.messagesContainer.innerHTML = '';
}
}

function showLoading(message = 'Carregando...') {
AppState.isLoading = true;

if (DOM.newsContainer) {
    DOM.newsContainer.style.opacity = '0.5';
}

if (DOM.newsSkeleton) {
    DOM.newsSkeleton.style.display = 'flex';
}

if (DOM.paginationContainer) {
    DOM.paginationContainer.style.display = 'none';
}

if (DOM.loadMoreBtn) {
    DOM.loadMoreBtn.style.display = 'none';
}

showMessage(`<div class="spinner-border spinner-border-sm" role="status"></div> ${message}`, 'info');
}

function hideLoading() {
AppState.isLoading = false;

if (DOM.newsContainer) {
    DOM.newsContainer.style.opacity = '1';
}

if (DOM.newsSkeleton) {
    DOM.newsSkeleton.style.display = 'none';
}
}

function showNotification(message, type = 'info', duration = 4000) {
if (!DOM.notificationContainer) return;

const notificationId = 'notification-' + Date.now();
const notification = document.createElement('div');
notification.id = notificationId;
notification.className = `notification notification-${type}`;

// Ícone baseado no tipo
let icon = 'bi-info-circle';
if (type === 'success') icon = 'bi-check-circle';
if (type === 'warning') icon = 'bi-exclamation-triangle';
if (type === 'error') icon = 'bi-x-circle';

notification.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
DOM.notificationContainer.appendChild(notification);

// Remover notificação após duração especificada
setTimeout(() => {
    const notificationElement = document.getElementById(notificationId);
    if (notificationElement) {
        notificationElement.classList.add('hiding');
        setTimeout(() => {
            if (notificationElement.parentNode === DOM.notificationContainer) {
                DOM.notificationContainer.removeChild(notificationElement);
            }
        }, 300); // Tempo da animação de saída
    }
}, duration);

return notificationId;
}

function createLoadingSkeletons() {
if (!DOM.newsSkeleton) return;

let skeletonsHTML = '';
for (let i = 0; i < CONFIG.ARTICLES_PER_PAGE; i++) {
    skeletonsHTML += `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="skeleton-card">
                <div class="skeleton-img">
                    <div class="skeleton-wave"></div>
                </div>
                <div class="skeleton-body">
                    <div class="skeleton-title">
                        <div class="skeleton-wave"></div>
                    </div>
                    <div class="skeleton-text">
                        <div class="skeleton-wave"></div>
                    </div>
                    <div class="skeleton-footer">
                        <div class="skeleton-wave"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

DOM.newsSkeleton.innerHTML = skeletonsHTML;
}

// ----------------------------------------------------------------------------------
// Funções de Visualização (Grid/List)
// ----------------------------------------------------------------------------------
function switchView(viewType) {
if (!DOM.newsContainer || !DOM.viewTogglers.gridBtn || !DOM.viewTogglers.listBtn) return;

AppState.isGridView = viewType === 'grid';

// Atualiza a classe do container de notícias
if (AppState.isGridView) {
    DOM.newsContainer.classList.remove('list-view');
    DOM.viewTogglers.gridBtn.classList.add('active');
    DOM.viewTogglers.listBtn.classList.remove('active');
} else {
    DOM.newsContainer.classList.add('list-view');
    DOM.viewTogglers.gridBtn.classList.remove('active');
    DOM.viewTogglers.listBtn.classList.add('active');
}

// Salva preferência no localStorage
saveViewPreference();

// Rastreamento de Analytics (simulado)
trackEvent('view_changed', { view: viewType });
}

function saveViewPreference() {
const viewPreference = { isGridView: AppState.isGridView };
localStorage.setItem(CONFIG.VIEW_PREFERENCES_KEY, JSON.stringify(viewPreference));
}

function loadViewPreference() {
try {
    const savedPreference = localStorage.getItem(CONFIG.VIEW_PREFERENCES_KEY);
    if (savedPreference) {
        const { isGridView } = JSON.parse(savedPreference);
        switchView(isGridView ? 'grid' : 'list');
    }
} catch (e) {
    console.error('Erro ao carregar preferências de visualização:', e);
}
}

// ----------------------------------------------------------------------------------
// Funções de Busca e Paginação
// ----------------------------------------------------------------------------------
function performSearch(searchTerm) {
if (!searchTerm) return;

AppState.searchTerm = searchTerm;
AppState.currentPage = 1;

// Buscar nos artigos já carregados primeiro
searchLocalArticles(searchTerm);
}

function searchLocalArticles(searchTerm) {
clearMessages();
showLoading(`Buscando por "${searchTerm}"...`);

// Verificar cache de busca
const cachedResults = getCachedNews(AppState.currentCategory, searchTerm);
if (cachedResults) {
    AppState.allFetchedArticles = cachedResults;
    displayPaginatedNews();
    renderPaginationControls();
    hideLoading();
    return;
}

// Verificar no conjunto atual de artigos
const searchTermLower = searchTerm.toLowerCase();
const currentCategoryArticles = getCachedNews(AppState.currentCategory) || AppState.allFetchedArticles;

const filteredArticles = currentCategoryArticles.filter(article => 
    (article.title && article.title.toLowerCase().includes(searchTermLower)) ||
    (article.description && article.description.toLowerCase().includes(searchTermLower)) ||
    (article.content && article.content.toLowerCase().includes(searchTermLower)) ||
    (article.source?.name && article.source.name.toLowerCase().includes(searchTermLower))
);

if (filteredArticles.length > 0) {
    AppState.allFetchedArticles = filteredArticles;
    // Cachear os resultados da busca
    cacheNews(AppState.currentCategory, filteredArticles, searchTerm);
    
    displayPaginatedNews();
    renderPaginationControls();
    hideLoading();
    
    // Rastreamento de Analytics (simulado)
    trackEvent('search_performed', { 
        searchTerm, 
        resultsCount: filteredArticles.length,
        category: AppState.currentCategory
    });
} else {
    // Se não encontrou nos artigos já carregados, pode tentar buscar da API
    // ou simplesmente mostrar mensagem de que não encontrou resultados
    AppState.allFetchedArticles = [];
    if (DOM.newsContainer) DOM.newsContainer.innerHTML = '';
    if (DOM.paginationContainer) DOM.paginationContainer.innerHTML = '';
    if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = 'none';
    
    hideLoading();
    showMessage(`Nenhum resultado encontrado para "${searchTerm}".`, 'warning');
    
    // Rastreamento de Analytics (simulado)
    trackEvent('search_no_results', { searchTerm, category: AppState.currentCategory });
}
}

function resetSearch() {
AppState.searchTerm = '';
AppState.currentPage = 1;

if (DOM.searchInput) DOM.searchInput.value = '';

// Recarregar artigos da categoria atual
fetchNews(AppState.currentCategory);
}

function loadMoreArticles() {
AppState.currentPage++;
displayPaginatedNews(true); // true = append instead of replace

// Rastreamento de Analytics (simulado)
trackEvent('load_more', { page: AppState.currentPage, category: AppState.currentCategory });
}

// ----------------------------------------------------------------------------------
// Funções de API
// ----------------------------------------------------------------------------------
async function fetchHeaderImage(categoryQuery) {
if (!DOM.headerImage || !UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'SUA_CHAVE_UNSPLASH') {
    if (DOM.headerImage) DOM.headerImage.style.display = 'none';
    return;
}

try {
    const dynamicUnsplashUrl = `https://api.unsplash.com/photos/random?query=${categoryQuery},technology&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(dynamicUnsplashUrl);
    
    if (!response.ok) {
        throw new Error(`Erro Unsplash: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.urls && data.urls.regular) {
        // Pré-carregar a imagem para evitar flash
        const img = new Image();
        img.onload = function() {
            DOM.headerImage.src = data.urls.regular;
            DOM.headerImage.alt = data.alt_description || `Imagem sobre ${categoryQuery}`;
            DOM.headerImage.style.display = 'block';
            
            // Adicionar créditos do fotógrafo
            if (data.user && data.user.name) {
                const photographerName = data.user.name;
                const unsplashLink = data.links?.html || 'https://unsplash.com';
                console.log(`Foto por ${photographerName} no Unsplash`);
            }
        };
        img.src = data.urls.regular;
    } else {
        DOM.headerImage.style.display = 'none';
    }
} catch (error) {
    console.error('Falha ao carregar imagem de destaque:', error);
    DOM.headerImage.style.display = 'none';
}
}

async function fetchNews(category = CONFIG.DEFAULT_CATEGORY) {
if (AppState.isLoading) return;

const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);
if (DOM.currentCategoryTitle) {
    DOM.currentCategoryTitle.textContent = categoryDisplay;
}

AppState.currentCategory = category;
AppState.searchTerm = '';
AppState.currentPage = 1;

if (DOM.searchInput) DOM.searchInput.value = '';

showLoading(`Carregando notícias sobre ${categoryDisplay}...`);

// Verificar cache primeiro
const cachedArticles = getCachedNews(category);
if (cachedArticles) {
    AppState.allFetchedArticles = cachedArticles;
    displayPaginatedNews();
    renderPaginationControls();
    hideLoading();
    return;
}

// Se não houver cache, buscar da API
console.log(`Buscando notícias da API para '${category}'...`);

try {
    const gnewsUrl = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${CONFIG.DEFAULT_LANGUAGE}&country=${CONFIG.DEFAULT_COUNTRY}&max=${CONFIG.MAX_ARTICLES_TO_FETCH}&apikey=${GNEWS_API_KEY}`;
    const response = await fetch(gnewsUrl);
    
    if (!response.ok) {
        let errorData = null;
        try {
            errorData = await response.json();
        } catch (e) { /* Ignora erro se não conseguir parsear */ }
        
        const errorMessage = errorData?.errors?.join(', ') || 
                            errorData?.message || 
                            `Erro ${response.status}`;
        
        throw new Error(`Falha ao buscar notícias: ${errorMessage}`);
    }
    
    const data = await response.json();
    clearMessages();
    
    if (data.articles && data.articles.length > 0) {
        // Calcular tempo de leitura para cada artigo
        const articlesWithReadingTime = data.articles.map(article => {
            return {
                ...article,
                readingTime: calculateReadingTime(article.description || '', article.content || '')
            };
        });
        
        AppState.allFetchedArticles = articlesWithReadingTime;
        cacheNews(category, articlesWithReadingTime);
        
        displayPaginatedNews();
        renderPaginationControls();
        
        // Rastreamento de Analytics (simulado)
        trackEvent('news_loaded', { 
            category, 
            articlesCount: articlesWithReadingTime.length
        });
    } else {
        AppState.allFetchedArticles = [];
        
        if (DOM.newsContainer) DOM.newsContainer.innerHTML = '';
        if (DOM.paginationContainer) DOM.paginationContainer.innerHTML = '';
        if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = 'none';
        
        showMessage('Nenhuma notícia encontrada para esta categoria.', 'warning');
    }
} catch (error) {
    console.error('Erro ao buscar notícias:', error);
    
    if (DOM.newsContainer) DOM.newsContainer.innerHTML = '';
    if (DOM.paginationContainer) DOM.paginationContainer.innerHTML = '';
    if (DOM.loadMoreBtn) DOM.loadMoreBtn.style.display = 'none';
    
    showMessage(`Erro ao carregar notícias: ${error.message}`, 'danger');
    showNotification('Falha ao carregar notícias. Tente novamente mais tarde.', 'error');
} finally {
    hideLoading();
}
}

// ----------------------------------------------------------------------------------
// Funções de Renderização de Notícias
// ----------------------------------------------------------------------------------
function displayPaginatedNews(append = false) {
if (!DOM.newsContainer) return;

if (!append) {
    DOM.newsContainer.innerHTML = '';
}

if (!AppState.allFetchedArticles || AppState.allFetchedArticles.length === 0) {
    // Se não houver artigos, não faça nada (as mensagens são tratadas em fetchNews)
    return;
}

const startIndex = append ? 
    (AppState.currentPage - 2) * CONFIG.ARTICLES_PER_PAGE + 1 : // Se append, começar depois do último item já mostrado
    0;                                                       // Se não append, começar do início
    
const endIndex = append ?
    AppState.currentPage * CONFIG.ARTICLES_PER_PAGE :        // Se append, mostrar até o final da página atual
    CONFIG.ARTICLES_PER_PAGE;                               // Se não append, mostrar apenas a primeira página

const articlesToShow = AppState.allFetchedArticles.slice(startIndex, endIndex);

articlesToShow.forEach(article => {
    renderNewsCard(article);
});

// Decidir se mostra paginação ou botão "Carregar mais"
updatePaginationDisplay();
}

function renderNewsCard(article) {
if (!DOM.newsContainer || !article.title || !article.url) return;

const col = document.createElement('div');
col.className = 'col-md-6 col-lg-4 mb-4 d-flex align-items-stretch';

const card = document.createElement('div');
card.className = 'news-article-card position-relative';
card.dataset.articleId = getArticleId(article);

const imageUrl = article.image || 'https://via.placeholder.com/400x200.png?text=Indisponível';
const description = article.description || 'Descrição não disponível.';
const sourceName = article.source?.name || 'Fonte desconhecida';
const publishedAt = article.publishedAt ? 
    new Date(article.publishedAt).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    }) : '';

// Verificar se o artigo está na lista de leitura
const isInReadingList = isArticleInReadingList(article);

// Tag da categoria
const categoryBadgeClass = `category-badge category-${AppState.currentCategory}`;

card.innerHTML = `
    <span class="${categoryBadgeClass}">${getCategoryDisplayName(AppState.currentCategory)}</span>
    <div class="position-relative overflow-hidden">
        <img src="${imageUrl}" class="card-img-top" alt="${article.title}" 
            onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200.png?text=Erro Img';">
    </div>
    <div class="card-body">
        <div class="reading-time mb-2">
            <span class="reading-time-badge bg-light text-dark">
                <i class="bi bi-clock"></i> ${article.readingTime} min
            </span>
        </div>
        <h5 class="card-title">${article.title}</h5>
        <p class="card-text">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</p>
    </div>
    <div class="card-footer">
        <div class="source-time">
            <i class="bi bi-newspaper"></i> ${sourceName} · ${publishedAt}
        </div>
        <div class="card-actions">
            <button class="btn-bookmark ${isInReadingList ? 'active' : ''}" data-article-id="${getArticleId(article)}" title="Adicionar à lista de leitura">
                <i class="bi ${isInReadingList ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
            </button>
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                <i class="bi bi-book"></i> Ler
            </a>
            <button class="btn btn-sm btn-outline-secondary share-btn" data-article-url="${article.url}" data-article-title="${article.title}">
                <i class="bi bi-share"></i>
            </button>
        </div>
    </div>
`;

// Adicionar eventos aos botões
const bookmarkBtn = card.querySelector('.btn-bookmark');
if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', () => toggleReadingListItem(article));
}

const shareBtn = card.querySelector('.share-btn');
if (shareBtn) {
    shareBtn.addEventListener('click', () => shareArticle(article));
}

col.appendChild(card);
DOM.newsContainer.appendChild(col);
}

function updatePaginationDisplay() {
const totalArticles = AppState.allFetchedArticles.length;
const articlesDisplayed = Math.min(AppState.currentPage * CONFIG.ARTICLES_PER_PAGE, totalArticles);

// Se todos os artigos já estão sendo exibidos, esconda o botão "Carregar mais"
if (DOM.loadMoreBtn) {
    if (articlesDisplayed < totalArticles) {
        DOM.loadMoreBtn.style.display = 'block';
        DOM.loadMoreBtn.textContent = `Carregar mais (${articlesDisplayed} de ${totalArticles})`;
        DOM.loadMoreBtn.classList.remove('d-none');
    } else {
        DOM.loadMoreBtn.style.display = 'none';
        DOM.loadMoreBtn.classList.add('d-none');
    }
}
}

function renderPaginationControls() {
if (!DOM.paginationContainer) return;

// Optamos por um botão "Carregar mais" em vez de paginação numérica
DOM.paginationContainer.innerHTML = '';
}

// ----------------------------------------------------------------------------------
// Funções para Lista de Leitura
// ----------------------------------------------------------------------------------
function getArticleId(article) {
// Cria um ID único para o artigo baseado na URL ou título
return article.url ? 
    btoa(encodeURIComponent(article.url)).replace(/[=]/g, '') : 
    btoa(encodeURIComponent(article.title)).replace(/[=]/g, '');
}

function isArticleInReadingList(article) {
const articleId = getArticleId(article);
return AppState.readingList.some(item => getArticleId(item) === articleId);
}

function toggleReadingListItem(article) {
const articleId = getArticleId(article);
const isAlreadyInList = isArticleInReadingList(article);

if (isAlreadyInList) {
    // Remover da lista de leitura
    AppState.readingList = AppState.readingList.filter(item => getArticleId(item) !== articleId);
    showNotification('Artigo removido da lista de leitura', 'info');
} else {
    // Adicionar à lista de leitura
    AppState.readingList.push({
        id: articleId,
        title: article.title,
        url: article.url,
        image: article.image,
        source: article.source,
        publishedAt: article.publishedAt,
        addedAt: new Date().toISOString()
    });
    showNotification('Artigo adicionado à lista de leitura', 'success');
}

// Atualizar botões de favorito nos cartões
updateBookmarkButtons(articleId, !isAlreadyInList);

// Atualizar contador no badge
updateReadingListBadge();

// Atualizar lista de leitura na sidebar
renderReadingList();

// Salvar no localStorage
saveReadingList();

// Rastreamento de Analytics (simulado)
trackEvent(isAlreadyInList ? 'reading_list_remove' : 'reading_list_add', { 
    articleId, 
    articleTitle: article.title
});
}

function updateBookmarkButtons(articleId, isActive) {
const bookmarkButtons = document.querySelectorAll(`.btn-bookmark[data-article-id="${articleId}"]`);
bookmarkButtons.forEach(button => {
    const icon = button.querySelector('i');
    if (isActive) {
        button.classList.add('active');
        if (icon) icon.className = 'bi bi-bookmark-fill';
    } else {
        button.classList.remove('active');
        if (icon) icon.className = 'bi bi-bookmark';
    }
});
}

function updateReadingListBadge() {
if (!DOM.readingList.badge) return;

const count = AppState.readingList.length;
DOM.readingList.badge.textContent = count;

if (count > 0) {
    DOM.readingList.badge.style.display = 'inline-block';
} else {
    DOM.readingList.badge.style.display = 'none';
}
}

function renderReadingList() {
if (!DOM.readingList.container || !DOM.readingList.emptyMessage) return;

// Limpar lista atual
DOM.readingList.container.innerHTML = '';

if (AppState.readingList.length === 0) {
    DOM.readingList.container.style.display = 'none';
    DOM.readingList.emptyMessage.style.display = 'block';
    return;
}

DOM.readingList.container.style.display = 'block';
DOM.readingList.emptyMessage.style.display = 'none';

// Ordenar por data de adição (mais recente primeiro)
const sortedReadingList = [...AppState.readingList].sort((a, b) => 
    new Date(b.addedAt) - new Date(a.addedAt)
);

sortedReadingList.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'reading-list-item';
    
    const imageUrl = item.image || 'https://via.placeholder.com/80x80.png?text=Sem+Imagem';
    const sourceName = item.source?.name || 'Fonte desconhecida';
    
    itemElement.innerHTML = `
        <img src="${imageUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='https://via.placeholder.com/80x80.png?text=Erro';">
        <div class="reading-list-item-content">
            <h6 class="reading-list-item-title">${item.title}</h6>
            <div class="reading-list-item-source">${sourceName}</div>
        </div>
        <div class="reading-list-item-actions">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" title="Ler artigo" class="btn btn-sm btn-link">
                <i class="bi bi-box-arrow-up-right"></i>
            </a>
            <button class="btn btn-sm btn-link remove-reading-item" data-article-id="${item.id}" title="Remover da lista">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    const removeButton = itemElement.querySelector('.remove-reading-item');
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            // Encontrar o artigo correspondente
            const articleToRemove = AppState.readingList.find(a => a.id === item.id);
            if (articleToRemove) {
                toggleReadingListItem(articleToRemove);
            }
        });
    }
    
    DOM.readingList.container.appendChild(itemElement);
});
}

function loadReadingList() {
try {
    const savedList = localStorage.getItem('reading_list');
    if (savedList) {
        AppState.readingList = JSON.parse(savedList);
        updateReadingListBadge();
        renderReadingList();
    }
} catch (e) {
    console.error('Erro ao carregar lista de leitura:', e);
    AppState.readingList = [];
}
}

function saveReadingList() {
try {
    localStorage.setItem('reading_list', JSON.stringify(AppState.readingList));
} catch (e) {
    console.error('Erro ao salvar lista de leitura:', e);
    showNotification('Erro ao salvar sua lista de leitura', 'error');
}
}

function clearReadingList() {
if (AppState.readingList.length === 0) return;

if (confirm('Tem certeza que deseja limpar sua lista de leitura?')) {
    AppState.readingList = [];
    updateReadingListBadge();
    renderReadingList();
    saveReadingList();
    
    // Atualizar botões de favoritos nos cards
    const bookmarkButtons = document.querySelectorAll('.btn-bookmark');
    bookmarkButtons.forEach(button => {
        button.classList.remove('active');
        const icon = button.querySelector('i');
        if (icon) icon.className = 'bi bi-bookmark';
    });
    
    showNotification('Lista de leitura foi limpa', 'info');
    
    // Rastreamento de Analytics (simulado)
    trackEvent('reading_list_cleared', { itemCount: AppState.readingList.length });
}
}

// ----------------------------------------------------------------------------------
// Funções de Compartilhamento
// ----------------------------------------------------------------------------------
function shareArticle(article) {
// Verificar suporte à Web Share API
if (navigator.share) {
    navigator.share({
        title: article.title,
        text: article.description,
        url: article.url,
    })
    .then(() => {
        console.log('Artigo compartilhado com sucesso');
        showNotification('Artigo compartilhado com sucesso', 'success');
        
        // Rastreamento de Analytics (simulado)
        trackEvent('article_shared', { 
            method: 'web_share_api',
            title: article.title,
            url: article.url
        });
    })
    .catch((error) => {
        console.error('Erro ao compartilhar', error);
        fallbackShare(article);
    });
} else {
    fallbackShare(article);
}
}

function fallbackShare(article) {
// Fallback para copiar URL para a área de transferência
if (navigator.clipboard) {
    navigator.clipboard.writeText(article.url)
        .then(() => {
            showNotification('Link copiado para a área de transferência', 'success');
            
            // Rastreamento de Analytics (simulado)
            trackEvent('article_share_copy', { 
                title: article.title,
                url: article.url
            });
        })
        .catch(err => {
            console.error('Erro ao copiar: ', err);
            showNotification('Não foi possível copiar o link', 'error');
        });
} else {
    // Fallback para método alternativo de cópia
    const tempInput = document.createElement('input');
    document.body.appendChild(tempInput);
    tempInput.value = article.url;
    tempInput.select();
    
    try {
        document.execCommand('copy');
        showNotification('Link copiado para a área de transferência', 'success');
        
        // Rastreamento de Analytics (simulado)
        trackEvent('article_share_copy_fallback', { 
            title: article.title,
            url: article.url
        });
    } catch (err) {
        console.error('Falha ao copiar o link:', err);
        showNotification('Não foi possível copiar o link', 'error');
    }
    
    document.body.removeChild(tempInput);
}
}

// ----------------------------------------------------------------------------------
// Funções de Acessibilidade e Preferências
// ----------------------------------------------------------------------------------
function changeFontSize(action) {
const body = document.body;

switch (action) {
    case 'increase':
        if (AppState.fontSizeLevel === 'small') {
            AppState.fontSizeLevel = 'normal';
            body.classList.remove('font-size-small');
        } else if (AppState.fontSizeLevel === 'normal') {
            AppState.fontSizeLevel = 'large';
            body.classList.add('font-size-large');
        }
        break;
        
    case 'decrease':
        if (AppState.fontSizeLevel === 'large') {
            AppState.fontSizeLevel = 'normal';
            body.classList.remove('font-size-large');
        } else if (AppState.fontSizeLevel === 'normal') {
            AppState.fontSizeLevel = 'small';
            body.classList.add('font-size-small');
        }
        break;
        
    case 'reset':
        AppState.fontSizeLevel = 'normal';
        body.classList.remove('font-size-small', 'font-size-large');
        break;
}

// Salvar preferência
localStorage.setItem('font_size_level', AppState.fontSizeLevel);

// Rastreamento de Analytics (simulado)
trackEvent('font_size_changed', { size: AppState.fontSizeLevel });
}

function loadFontSize() {
const savedSize = localStorage.getItem('font_size_level') || 'normal';
AppState.fontSizeLevel = savedSize;

if (savedSize === 'small') {
    document.body.classList.add('font-size-small');
} else if (savedSize === 'large') {
    document.body.classList.add('font-size-large');
}
}

// ----------------------------------------------------------------------------------
// Funções de Clima
// ----------------------------------------------------------------------------------
function initWeatherWidget() {
if (!DOM.weather.widget || !OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'SUA_CHAVE_OPENWEATHER') {
    hideWeatherWidget();
    return;
}

// Carregar preferência do widget (aberto/fechado)
const weatherOpen = localStorage.getItem('weather_widget_open') === 'true';
if (weatherOpen) {
    toggleWeatherWidget(true);
}

// Tentar obter a localização do usuário
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            fetchWeatherData(latitude, longitude);
        },
        error => {
            console.error('Erro ao obter localização:', error);
            // Fallback para uma localização padrão (São Paulo)
            fetchWeatherData(-23.55, -46.64);
        }
    );
} else {
    console.warn('Geolocalização não suportada pelo navegador');
    // Fallback para uma localização padrão (São Paulo)
    fetchWeatherData(-23.55, -46.64);
}
}

async function fetchWeatherData(lat, lon) {
if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'SUA_CHAVE_OPENWEATHER') return;

// Verificar se precisamos atualizar o clima (baseado em intervalo de tempo)
const now = Date.now();
if (AppState.lastWeatherUpdate && 
    (now - AppState.lastWeatherUpdate < CONFIG.WEATHER_UPDATE_INTERVAL)) {
    console.log('Usando dados de clima em cache');
    showWeatherWidget(); // Mostrar widget se houver dados
    return;
}

try {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(weatherUrl);
    if (!response.ok) {
        throw new Error(`Erro ao buscar dados de clima: ${response.status}`);
    }
    
    const data = await response.json();
    updateWeatherDisplay(data);
    
    // Atualizar timestamp
    AppState.lastWeatherUpdate = now;
    
    // Salvar no localStorage para uso offline
    localStorage.setItem('weather_data', JSON.stringify({
        data: data,
        timestamp: now
    }));
} catch (error) {
    console.error('Erro ao buscar dados de clima:', error);
    
    // Tentar usar dados em cache
    try {
        const cachedWeather = localStorage.getItem('weather_data');
        if (cachedWeather) {
            const { data } = JSON.parse(cachedWeather);
            updateWeatherDisplay(data);
            showNotification('Usando dados de clima salvos', 'info');
        } else {
            hideWeatherWidget();
        }
    } catch (e) {
        hideWeatherWidget();
    }
}
}

function updateWeatherDisplay(data) {
if (!DOM.weather.data || !DOM.weather.temp || !DOM.weather.icon || !DOM.weather.location) return;

// Ocultar loading
DOM.weather.loading.classList.add('d-none');
DOM.weather.data.classList.remove('d-none');

// Preencher dados
DOM.weather.temp.textContent = `${Math.round(data.main.temp)}°C`;
DOM.weather.icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
DOM.weather.location.textContent = data.name;

// Mostrar o widget
showWeatherWidget();
}

function toggleWeatherWidget(force = null) {
if (!DOM.weather.widget) return;

const shouldOpen = force !== null ? force : !AppState.weatherOpen;
AppState.weatherOpen = shouldOpen;

if (shouldOpen) {
    DOM.weather.widget.classList.add('open');
} else {
    DOM.weather.widget.classList.remove('open');
}

// Salvar preferência
localStorage.setItem('weather_widget_open', shouldOpen);
}

function showWeatherWidget() {
if (!DOM.weather.widget) return;
DOM.weather.widget.style.display = 'flex';
}

function hideWeatherWidget() {
if (!DOM.weather.widget) return;
DOM.weather.widget.style.display = 'none';
}

// ----------------------------------------------------------------------------------
// Funções Utilitárias
// ----------------------------------------------------------------------------------
function calculateReadingTime(description = '', content = '') {
const text = description + ' ' + content;
const words = text.trim().split(/\s+/).length;
const readingTimeMinutes = Math.max(1, Math.round(words / CONFIG.READING_SPEED_WPM));
return readingTimeMinutes;
}

function getCategoryDisplayName(category) {
const categoryMap = {
    'technology': 'Tecnologia',
    'science': 'Ciência',
    'business': 'Negócios',
    'health': 'Saúde',
    'entertainment': 'Entretenimento',
    'sports': 'Esportes',
    'politics': 'Política',
    'world': 'Mundo'
};

return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function debounce(func, delay) {
let timer;
return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
        func.apply(this, args);
    }, delay);
};
}

function scrollToTop() {
window.scrollTo({ top: 0, behavior: 'smooth' });
}

function trackEvent(eventName, eventData = {}) {
// Simulação de rastreamento de analytics
console.log(`[Analytics] ${eventName}:`, eventData);

// Aqui você poderia integrar com Google Analytics, Plausible, etc.
// Exemplo: if (typeof gtag === 'function') { gtag('event', eventName, eventData); }
}

// ----------------------------------------------------------------------------------
// Service Worker para recursos offline
// ----------------------------------------------------------------------------------
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
    // Este é um comentário para simular o registro do Service Worker
    // No mundo real, você criaria um arquivo sw.js e o registraria:
    // navigator.serviceWorker.register('/sw.js')
    //    .then(reg => console.log('Service Worker registrado'))
    //    .catch(err => console.log('Erro no registro do Service Worker:', err));
});
}

// ----------------------------------------------------------------------------------
// Manifest.json para PWA - A ser criado separadamente
// ----------------------------------------------------------------------------------
/*
{
"name": "Tech Hub News",
"short_name": "TechNews",
"description": "Portal de notícias sobre tecnologia, ciência e inovação",
"start_url": "/",
"display": "standalone",
"background_color": "#f8f9fa",
"theme_color": "#17a2b8",
"icons": [
    {
        "src": "icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
    },
    {
        "src": "icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
    }
]
}
*/