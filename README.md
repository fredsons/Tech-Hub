Tech Hub News

Um portal de notícias moderno e responsivo focado em tecnologia, ciência, negócios e saúde. O Tech Hub News oferece uma experiência de usuário rica com recursos avançados como tema claro/escuro, lista de leitura, widget de clima e muito mais.


🚀 Demonstração
Screenshots
📸 Ver screenshots do projeto
Live Demo
Link para demo ao vivo do Tech Hub News (https://tech-hub-omega-orcin.vercel.app/)

✨ Funcionalidades
Interface e Navegação
✅ Design responsivo para todos os dispositivos
✅ Alternância entre tema claro e escuro
✅ Navegação por categorias (Tecnologia, Ciência, Negócios, Saúde)
✅ Alternância entre visualização em grid e lista
✅ Cabeçalho dinâmico com imagens relacionadas à categoria
✅ Busca de notícias em tempo real
Conteúdo e Interação
✅ Exibição de notícias com imagens, descrições e fontes
✅ Tempo estimado de leitura para cada artigo
✅ Sistema de lista de leitura para salvar artigos
✅ Compartilhamento de notícias (Web Share API)
✅ Widget de clima baseado na localização do usuário
✅ Cálculo automático do tempo de leitura dos artigos
✅ Sistema "Carregar mais" para paginação contínua
Tecnologia e Performance
✅ Cache inteligente para reduzir requisições de API
✅ Skeletons de carregamento para melhor UX
✅ Suporte offline com caching de dados
✅ Preparado para PWA (Progressive Web App)
✅ Otimização de imagens e recursos
Acessibilidade e UX
✅ Controles de tamanho de fonte
✅ Alto contraste em temas claro/escuro
✅ Navegação por teclado otimizada
✅ Notificações toast para feedback ao usuário
✅ Estilos de impressão otimizados
🛠 Tecnologias Utilizadas
Frontend:

HTML5

CSS3 com variáveis (Design System)

JavaScript ES6+

Bootstrap 5.3.3

Bootstrap Icons

APIs:

GNews API (notícias)

Unsplash API (imagens)

OpenWeather API (clima)

Persistência de Dados:

LocalStorage (cache, preferências e lista de leitura)

Recursos Avançados:

Service Worker (configuração PWA)

Web Share API

Geolocation API

📂 Estrutura do Projeto
tech-hub-news/
│
├── index.html               # Página principal
├── style.css                # Estilos CSS
├── script.js                # JavaScript principal
├── manifest.json            # Manifest para PWA
├── sw.js                    # Service Worker para recursos offline
│
├── assets/                  # Recursos estáticos
│   ├── icons/               # Ícones para PWA
│   └── images/              # Imagens da aplicação
│
└── README.md                # Documentação
📋 Requisitos
Servidor web (local ou hospedagem)
Navegador moderno com suporte a ES6+ (Chrome, Firefox, Safari, Edge)
Chaves de API para:
GNews API
Unsplash API
OpenWeather API (opcional)
🔧 Instalação e Configuração
Clone o repositório:
git clone https://github.com/seu-usuario/tech-hub-news.git
cd tech-hub-news
Configure as chaves de API:
Abra o arquivo script.js e substitua as chaves de API pelos seus valores:

const GNEWS_API_KEY = 'SUA_CHAVE_GNEWS';
const UNSPLASH_ACCESS_KEY = 'SUA_CHAVE_UNSPLASH';
const OPENWEATHER_API_KEY = 'SUA_CHAVE_OPENWEATHER';
⚠️ Nota: Para projetos em produção, recomenda-se não expor as chaves API diretamente no front-end. Utilize um proxy de servidor ou APIs serverless.

Obtenção das chaves de API:
GNews API - Necessária para buscar notícias
Unsplash API - Para imagens do cabeçalho
OpenWeather API - Para o widget de clima
Inicie a aplicação:
Utilize um servidor local como Live Server (VS Code) ou similar
Ou faça upload para sua hospedagem
🌐 APIs Utilizadas
GNews API
Uso: Busca de notícias por categoria
Endpoint: https://gnews.io/api/v4/top-headlines
Parâmetros utilizados: category, lang, country, max, apikey
Documentação: GNews API Docs
Limitações: A versão gratuita tem limites de requisições e de artigos retornados
Unsplash API
Uso: Imagens dinâmicas para o cabeçalho
Endpoint: https://api.unsplash.com/photos/random
Parâmetros utilizados: query, orientation, client_id
Documentação: Unsplash API Docs
Limitações: 50 requisições/hora na versão gratuita
OpenWeather API
Uso: Dados climáticos para o widget
Endpoint: https://api.openweathermap.org/data/2.5/weather
Parâmetros utilizados: lat, lon, units, lang, appid
Documentação: OpenWeather API Docs
Limitações: 60 chamadas/minuto, 1.000.000 chamadas/mês no plano gratuito
♿ Recursos de Acessibilidade
O Tech Hub News foi construído com foco em acessibilidade:

Contraste: Alto contraste entre texto e fundo nos temas claro e escuro
Teclado: Navegação completa via teclado
Tamanho de Fonte: Controles para aumentar/diminuir/restaurar o tamanho da fonte
Textos Alternativos: Imagens com descrições adequadas
Semântica: Uso adequado de tags semânticas HTML5
Estados Focáveis: Indicadores visuais claros para elementos focados
Aria Labels: Uso apropriado de atributos ARIA quando necessário
⚡ Performance
O Tech Hub News implementa várias técnicas para otimizar a performance:

Caching Inteligente: Armazenamento em cache de notícias para reduzir chamadas de API
Lazy Loading: Carregamento preguiçoso de imagens fora da viewport
Debouncing: Implementação de debounce na busca para reduzir chamadas
Skeletons: Feedback visual durante o carregamento
Minificação: CSS e JS minificados para produção
Reuso de Dados: Reutilização de dados em cache entre categorias
🔄 Customização
Modificando Categorias
Para adicionar ou modificar categorias, edite as seguintes partes:

HTML: Adicione novos links na navbar
<li class="nav-item">
  <a class="nav-link category-link" href="#" data-category="nova-categoria">Nova Categoria</a>
</li>
CSS: Adicione estilo para a nova categoria no CSS
.category-nova-categoria { background-color: #seu-codigo-cor; }
JavaScript: Atualize o objeto de mapeamento de categorias
function getCategoryDisplayName(category) {
  const categoryMap = {
      // Categorias existentes...
      'nova-categoria': 'Nome da Nova Categoria'
  };
  // ...
}
Personalizando Cores e Temas
Modifique as variáveis CSS no :root para personalizar as cores do tema:

:root {
  --ds-primary-color: #sua-cor-primaria;
  --ds-secondary-color: #sua-cor-secundaria;
  /* outras variáveis... */
}
📱 Recursos Offline e PWA
O Tech Hub News foi preparado para funcionar como um Progressive Web App (PWA):

Service Worker: Configurado para caching de recursos
Manifest: Permite instalação como aplicativo
Offline Mode: Acesso a notícias previamente carregadas quando offline
Sincronização: Atualização automática quando a conexão é restaurada
Para habilitar completamente os recursos PWA:


👥 Contribuição
Contribuições são bem-vindas! Para contribuir:

Faça um fork do projeto
Crie uma branch para sua feature (git checkout -b feature/AmazingFeature)
Faça commit das mudanças (git commit -m 'Add some AmazingFeature')
Push para a branch (git push origin feature/AmazingFeature)
Abra um Pull Request
Áreas para Melhorias Futuras
Implementação de testes automatizados
Sistema de comentários
Autenticação de usuários
Personalização de feeds
Notificações push
📄 Licença
Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

