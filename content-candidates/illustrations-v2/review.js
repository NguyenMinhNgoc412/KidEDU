/* global document, matchMedia, setInterval, clearInterval */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const staticMode = document.querySelector("#static-mode");
staticMode.checked = reduceMotion.matches;
const controllers = [];
function framePosition(frame) {
  return `${((frame % 4) * 100) / 3}% ${Math.floor(frame / 4) * 100}%`;
}
for (const card of document.querySelectorAll("article")) {
  const sprite = card.querySelector(".sprite");
  const button = card.querySelector("button");
  const status = card.querySelector(".status");
  const restFrame = Number(card.dataset.restFrame);
  let timer = null;
  let frame = restFrame;
  sprite.style.backgroundImage = `url("${card.dataset.sprite}")`;
  sprite.style.backgroundPosition = framePosition(frame);
  function stop(message = "Đã dừng · bấm để xem lại", reset = true) {
    clearInterval(timer);
    timer = null;
    if (reset) {
      frame = restFrame;
      sprite.style.backgroundPosition = framePosition(frame);
    }
    button.textContent = "Xem chuyển động";
    button.setAttribute("aria-pressed", "false");
    status.textContent = message;
  }
  controllers.push({ card, stop });
  button.addEventListener("click", () => {
    if (timer !== null) {
      stop("Đã tạm dừng · bấm để xem lại", false);
      return;
    }
    if (staticMode.checked || reduceMotion.matches) {
      stop("Giảm chuyển động đang bật · hiển thị ảnh tĩnh");
      return;
    }
    controllers.forEach((controller) => controller.stop());
    frame = 0;
    sprite.style.backgroundPosition = framePosition(frame);
    button.textContent = "Tạm dừng";
    button.setAttribute("aria-pressed", "true");
    status.textContent = "Đang chuyển động · một lượt";
    timer = setInterval(() => {
      frame += 1;
      if (frame >= 8) {
        stop("Đã xong một lượt · bấm để xem lại");
        return;
      }
      sprite.style.backgroundPosition = framePosition(frame);
    }, 375);
  });
}
const stopAll = () => controllers.forEach((controller) => controller.stop());
staticMode.addEventListener("change", stopAll);
reduceMotion.addEventListener("change", () => {
  staticMode.checked = reduceMotion.matches;
  stopAll();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAll();
});
const normalize = (value) =>
  value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("đ", "d");
const search = document.querySelector("#search");
const category = document.querySelector("#category");
function filter() {
  stopAll();
  const query = normalize(search.value.trim());
  let visible = 0;
  controllers.forEach(({ card }) => {
    card.hidden = !(
      (category.value === "all" || category.value === card.dataset.category) &&
      normalize(card.dataset.title).includes(query)
    );
    if (!card.hidden) visible += 1;
  });
  document.querySelector("#result-count").textContent = `${visible}/${controllers.length} từ mẫu`;
  document.querySelector("#empty").hidden = visible > 0;
}
search.addEventListener("input", filter);
category.addEventListener("change", filter);
