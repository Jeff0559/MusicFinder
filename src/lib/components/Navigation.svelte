<script>
  import { page } from '$app/stores';

  const isActive = (path) => $page.url.pathname === path;
</script>

<nav class="navbar">
  <div class="navbar-container">
    <div class="navbar-brand">
      <img class="brand-gif" src="/lofi.gif" alt="MusicFinder" />
      <span class="brand-name">MusicFinder</span>
    </div>

    <ul class="navbar-menu">
      <li><a href="/" aria-current={isActive('/') ? 'page' : undefined}>Start</a></li>
      <li><a href="/search" aria-current={isActive('/search') ? 'page' : undefined}>Suche</a></li>
      <li><a href="/reviews" aria-current={isActive('/reviews') ? 'page' : undefined}>Review</a></li>
      <li><a href="/vibe" aria-current={isActive('/vibe') ? 'page' : undefined}>Vibe Matcher</a></li>
    </ul>
  </div>
</nav>

<style>
  .navbar {
    background: linear-gradient(135deg, #1b1411, #130f0d);
    border-bottom: 0.125rem solid #f1ae48;
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.45);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .navbar-container {
    max-width: 87.5rem;
    margin: 0 auto;
    padding: 0.875rem 1.375rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-weight: 800;
    font-size: 1.125rem;
    color: #f1ae48;
    letter-spacing: 0.02em;
  }

  .brand-gif {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    object-fit: cover;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.4);
    border: 0.0625rem solid rgba(241, 174, 72, 0.6);
  }

  .navbar-menu {
    display: flex;
    list-style: none;
    gap: 0.875rem;
    margin: 0;
    padding: 0;
  }

  .navbar-menu a {
    color: #d9cdbd;
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.625rem;
    border: 0.0625rem solid transparent;
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

  @media (max-width: 48rem) {
    .navbar-container {
      padding: 0.75rem 1rem;
    }

    .navbar-menu {
      gap: 0.625rem;
    }

    .navbar-menu a {
      padding: 0.375rem 0.625rem;
    }
  }
</style>
