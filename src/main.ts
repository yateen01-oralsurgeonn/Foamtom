// Wiring only. In this task it renders the game title and nothing else.
const app = document.getElementById('app');
if (app) {
  const title = document.createElement('h1');
  title.textContent = 'Foamtom: The Haunted Mirror';
  app.appendChild(title);
}
