
// Функция для загрузки хедера
function loadHeader() {
    fetch('header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки: ' + response.status);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('header-container').innerHTML = data;
            highlightActiveLink(); // Вызываем highlightActiveLink после загрузки хедера
        })
        .catch(error => console.error('Ошибка при загрузке header.html:', error));
}

// Функция для загрузки туров
async function loadTours() {
    try {
        const response = await fetch('http://localhost:5502/api/tours'); // Замените на ваш API-эндпоинт
        const tours = await response.json();
        const toursContainer = document.getElementById('tours-container');

        // Проверка на наличие данных
        if (tours.length === 0) {
            toursContainer.innerHTML = '<p class="text-center">Нет доступных туров.</p>';
            return;
        }

        tours.forEach(tour => {
            const col = document.createElement('div');
            col.className = 'col-md-3 mb-4';
            col.innerHTML = `
                <div class="card text-center hover-effect" onclick="location.href='tour.html?id=${tour.id}'">
                    <img src="${window.location.origin}/${tour.image}" class="card-img-top" alt="${tour.name}">
                    <div class="card-body">
                        <h5 class="card-title">${tour.name}</h5>
                        <p class="card-text">${tour.short_description}</p>
                        <p class="card-text"><strong>${tour.price} ₽</strong></p>
                        <p><strong>Доступно:</strong> ${tour.available}</p>
                    </div>
                </div>
            `;
            toursContainer.appendChild(col);
        });
    } catch (error) {
        console.error('Ошибка при загрузке туров:', error);
        const toursContainer = document.getElementById('tours-container');
        toursContainer.innerHTML = '<p class="text-center">Ошибка при загрузке туров.</p>';
    }
}

// Функция для выделения активной ссылки
function highlightActiveLink() {
    const currentUrl = window.location.pathname; // Получаем текущий путь
    const navLinks = document.querySelectorAll(".navbar-nav .nav-link");

    navLinks.forEach(link => {
        // Если href заканчивается на текущий URL и не является ссылкой на аккаунт
        if (link.href.includes(currentUrl) && !link.classList.contains('account-link')) {
            link.classList.add("active-link");
        }
    });
}

// Добавляем обработчики события load
window.addEventListener('load', function() {
    loadHeader();
    loadTours(); // Загружаем туры только на странице каталога

    // Проверяем, находимся ли мы на странице тура
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id');

    if (tourId) {
        loadTourDetails(tourId); // Загружаем детали тура только если есть ID
    }
});

// Функция для загрузки деталей тура
async function loadTourDetails(tourId) {
    try {
        const response = await fetch(`http://localhost:5502/api/tours/${tourId}`); // Замените на ваш API-эндпоинт
        const tour = await response.json();
        const tourDetailsContainer = document.getElementById('tour-details');

        if (!tour) {
            tourDetailsContainer.innerHTML = '<p class="text-center">Тур не найден.</p>';
            return;
        }

        tourDetailsContainer.innerHTML = `
            <h2>${tour.name}</h2>
            <img src="${window.location.origin}/${tour.image}" alt="${tour.name}" class="img-fluid">
            <p><strong>Описание:</strong> ${tour.full_description}</p>
            <p><strong>Цена:</strong> ${tour.price} ₽</p>
            <p><strong>Даты:</strong> ${tour.dates}</p>
            <p><strong>Место назначения:</strong> ${tour.destination}</p>
            <a href="catalog.html" class="btn btn-primary">Вернуться к каталогу</a>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке деталей тура:', error);
        const tourDetailsContainer = document.getElementById('tour-details');
        tourDetailsContainer.innerHTML = '<p class="text-center">Ошибка при загрузке деталей тура.</p>';
    }
}