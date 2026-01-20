export function initDrawer() {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  const openBtn = document.getElementById("open-menu");
  const closeBtn = document.getElementById("close-menu");

  if (!drawer || !openBtn) return;

  openBtn.addEventListener("click", () => {
    drawer.classList.add("open");
    overlay.classList.add("show");
  });

  closeBtn?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("show");
  }
}
