// Configurações da API TMDB
const API_KEY = '1c9a1eba6cfd5259fc9e29a24ffb80cc';
const BASE_URL = 'https://api.themoviedb.org/3/';
const IMG_URL = 'https://image.tmdb.org/t/p/w500/';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original/';

// Elementos DOM
const moviesGrid = document.getElementById('movies-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sectionTitle = document.getElementById('section-title');
const navBtns = document.querySelectorAll('.nav-btn');
const movieModal = document.getElementById('movie-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

// Variáveis globais
let currentCategory = 'popular';
let currentPage = 1;
let isLoading = false;

// Inicializa o aplicativo
function init() {
    fetchMovies(currentCategory);
    setupEventListeners();
}

// Configura os event listeners
function setupEventListeners() {
    // Navegação por categoria
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            sectionTitle.textContent = getCategoryTitle(currentCategory);
            fetchMovies(currentCategory);
        });
    });

    // Busca de filmes
    searchBtn.addEventListener('click', searchMovies);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMovies();
    });

    // Modal
    closeModal.addEventListener('click', () => {
        movieModal.classList.remove('show');
    });

    // Fechar modal ao clicar fora
    movieModal.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            movieModal.classList.remove('show');
        }
    });

    // Carregar mais filmes ao rolar
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isLoading) {
            currentPage++;
            if (searchInput.value.trim()) {
                searchMovies(false);
            } else {
                fetchMovies(currentCategory, false);
            }
        }
    });
}

// Obtém filmes por categoria
async function fetchMovies(category, reset = true) {
    try {
        isLoading = true;
        if (reset) {
            currentPage = 1;
            moviesGrid.innerHTML = createSkeletons(6);
        }

        const response = await fetch(`${BASE_URL}movie/${category}?api_key=${API_KEY}&page=${currentPage}&language=pt-BR`);
        const data = await response.json();

        if (reset) {
            moviesGrid.innerHTML = '';
        }

        displayMovies(data.results);
    } catch (error) {
        console.error('Error fetching movies:', error);
        moviesGrid.innerHTML = '<p class="error">Erro ao carregar filmes. Tente novamente.</p>';
    } finally {
        isLoading = false;
    }
}

// Busca filmes por termo
async function searchMovies(reset = true) {
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        fetchMovies(currentCategory);
        return;
    }

    try {
        isLoading = true;
        if (reset) {
            currentPage = 1;
            moviesGrid.innerHTML = createSkeletons(6);
        }

        const response = await fetch(`${BASE_URL}search/movie?api_key=${API_KEY}&query=${searchTerm}&page=${currentPage}&language=pt-BR`);
        const data = await response.json();

        if (reset) {
            moviesGrid.innerHTML = '';
            sectionTitle.textContent = `Resultados para: "${searchTerm}"`;
        }

        if (data.results.length === 0 && reset) {
            moviesGrid.innerHTML = '<p class="error">Nenhum filme encontrado. Tente outro termo.</p>';
            return;
        }

        displayMovies(data.results);
    } catch (error) {
        console.error('Error searching movies:', error);
        moviesGrid.innerHTML = '<p class="error">Erro na busca. Tente novamente.</p>';
    } finally {
        isLoading = false;
    }
}

// Exibe filmes no grid
function displayMovies(movies) {
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card animate__animated animate__fadeIn';
        movieCard.innerHTML = `
            <img src="${movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=Poster+Indispon%C3%ADvel'}" 
                 alt="${movie.title}" 
                 class="movie-poster"
                 loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-details">
                    <span>${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                    <span class="movie-rating">${movie.vote_average.toFixed(1)}</span>
                </div>
            </div>
        `;
        
        movieCard.addEventListener('click', () => openMovieModal(movie.id));
        moviesGrid.appendChild(movieCard);
    });
}

// Abre o modal com detalhes do filme
async function openMovieModal(movieId) {
    try {
        movieModal.classList.add('show');
        modalBody.innerHTML = '<div class="loading-modal">Carregando...</div>';

        // Busca detalhes do filme
        const movieResponse = await fetch(`${BASE_URL}movie/${movieId}?api_key=${API_KEY}&language=pt-BR`);
        const movie = await movieResponse.json();

        // Busca elenco do filme
        const creditsResponse = await fetch(`${BASE_URL}movie/${movieId}/credits?api_key=${API_KEY}&language=pt-BR`);
        const credits = await creditsResponse.json();

        // Formata dados
        const genres = movie.genres.map(g => `<span class="genre">${g.name}</span>`).join('');
        const cast = credits.cast.slice(0, 6).map(actor => `
            <div class="cast-member">
                <img src="${actor.profile_path ? IMG_URL + actor.profile_path : 'https://via.placeholder.com/100x100?text=Ator'}" 
                     alt="${actor.name}" 
                     class="cast-photo">
                <p class="cast-name">${actor.name}</p>
                <p class="cast-character">${actor.character || 'N/A'}</p>
            </div>
        `).join('');

        // Exibe no modal
        modalBody.innerHTML = `
            <img src="${movie.backdrop_path ? BACKDROP_URL + movie.backdrop_path : 'https://via.placeholder.com/800x450?text=Imagem+Indispon%C3%ADvel'}" 
                 alt="${movie.title}" 
                 class="modal-poster">
            <div class="modal-info">
                <h2>${movie.title}</h2>
                <div class="modal-meta">
                    <span>${movie.release_date || 'Data desconhecida'}</span>
                    <span class="modal-rating">⭐ ${movie.vote_average.toFixed(1)}</span>
                    <span>${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min</span>
                </div>
                <div class="modal-genres">
                    ${genres}
                </div>
                <h3>Sinopse</h3>
                <p class="modal-overview">${movie.overview || 'Sinopse não disponível.'}</p>
                
                <div class="modal-cast">
                    <h3 class="cast-title">Elenco Principal</h3>
                    <div class="cast-grid">
                        ${cast}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        modalBody.innerHTML = '<p class="error">Erro ao carregar detalhes do filme.</p>';
    }
}

// Funções auxiliares
function getCategoryTitle(category) {
    const titles = {
        'popular': 'Filmes Populares',
        'top_rated': 'Melhores Avaliados',
        'upcoming': 'Em Breve'
    };
    return titles[category] || 'Filmes';
}

function createSkeletons(count) {
    return Array(count).fill('<div class="skeleton-movie"></div>').join('');
}

// Inicializa o app
document.addEventListener('DOMContentLoaded', init);