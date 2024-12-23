window.onload = function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const headerContainer = document.getElementById('header-container');
    
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            headerContainer.innerHTML = data;

            // Убедитесь, что элементы загружены, прежде чем пытаться их обновить
            if (user) {
                displayAccountInfo(user);
            }

            // После загрузки заголовка, выделяем активную ссылку
            highlightActiveLink();

            // Блокируем кнопки
            Buttonlock();
        })
        .catch(error => console.error('Ошибка загрузки header.html:', error));
};

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

function Buttonlock() {
    const currentPage = window.location.pathname.split("/").pop(); // Получаем имя текущей страницы

    // Получаем кнопки
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');

    // Проверяем, на какой странице мы находимся и скрываем соответствующие кнопки
    if (currentPage === 'Login.html') {
        if (loginButton) {
            loginButton.style.display = 'none'; // Скрыть кнопку "Войти"
        }
    } else if (currentPage === 'Register.html') {
        if (registerButton) {
            registerButton.style.display = 'none'; // Скрыть кнопку "Регистрация"
        }
    }
}

function displayAccountInfo(user) {
    // Убедитесь, что элементы существуют
    const loggedOutHeader = document.getElementById('header-logged-out');
    const loggedInHeader = document.getElementById('header-logged-in');
    
    if (loggedOutHeader && loggedInHeader) {
        loggedOutHeader.style.display = 'none';
        loggedInHeader.style.display = 'block';
    }

    // Обновляем информацию о пользователе
    const usernameElement = document.getElementById('username');
    const avatarElement = document.getElementById('avatar');

    if (usernameElement && avatarElement) {
        usernameElement.innerText = user.username;
        avatarElement.src = user.avatar_url; // Используйте src для изображения
    }

    // Добавляем обработчик события для кнопки выхода
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('user');
            location.reload(); // Перезагрузить страницу
        });
    }
}
