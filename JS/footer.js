
async function loadFooter() {
    const response = await fetch('footer.html'); // Путь к вашему файлу футера
    if (response.ok) {
        const footerContent = await response.text();
        document.getElementById('footer-container').innerHTML = footerContent;
    } else {
        console.error('Ошибка при загрузке футера:', response.statusText);
    }
}

loadFooter();
async function openPolicyWindow() {
  const newWindow = window.open("", "new window", "popup");

  try {
      const response = await fetch('policy.txt'); // Укажите путь к вашему текстовому файлу
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      const text = await response.text(); // Получаем текстовое содержимое файла
      newWindow.document.write(`<pre>${text}</pre>`); // Записываем содержимое в новое окно
      newWindow.document.close(); // Закрываем документ, чтобы отобразить содержимое
  } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      newWindow.document.write("<p>Не удалось загрузить политику обработки персональных данных.</p>");
      newWindow.document.close();
  }
}