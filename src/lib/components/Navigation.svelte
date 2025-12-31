<nav class="navbar">
  <div class="navbar-container">
    <div class="navbar-brand">
      <span class="brand-logo">dYZa</span>
      <span class="brand-name">MusicFinder</span>
    </div>

    <ul class="navbar-menu">
      <li><a href="/" aria-current="page">Start</a></li>
      <li><a href="/search">Suche</a></li>
      <li><a href="/reviews">Reviews & Alben</a></li>
      <li><a href="/vibe">Vibe Matcher</a></li>
    </ul>
  </div>
</nav>

<style>
  .navbar {
    background: linear-gradient(135deg, #1b1411, #130f0d);
    border-bottom: 2px solid #f1ae48;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .navbar-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 14px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 18px;
    color: #f1ae48;
    letter-spacing: 0.02em;
  }

  .navbar-menu {
    display: flex;
    list-style: none;
    gap: 14px;
    margin: 0;
    padding: 0;
  }

  .navbar-menu a {
    color: #d9cdbd;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: all 120ms ease;
  }

  .navbar-menu a[aria-current="page"] {
    color: #0f0c0b;
    background: linear-gradient(135deg, #f1ae48, #e88149);
    border-color: #f1ae48;
    font-weight: 800;
  }

  .navbar-menu a:hover {
    color: #f1ae48;
    border-color: #f1ae48;
  }

  @media (max-width: 768px) {
    .navbar-container {
      padding: 12px 16px;
    }

    .navbar-menu {
      gap: 10px;
    }

    .navbar-menu a {
      padding: 6px 10px;
    }
  }
</style>
