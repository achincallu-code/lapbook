const book = document.querySelector("#lapbook");
const bookCover = document.querySelector(".book-cover");
const openBookButton = document.querySelector("#open-book");
const closeBookButton = document.querySelector("#close-book");
const bookInside = document.querySelector("#book-inside");
const bookState = document.querySelector("#book-state");
const cards = [...document.querySelectorAll("[data-card]")];
const coverLeft = bookCover.querySelector(".cover-left");
const resetViewButton = document.querySelector("#reset-view");
const learningDialog = document.querySelector("#learning-dialog");
const learningTitle = document.querySelector("#learning-title");
const learningExplanation = document.querySelector("#learning-explanation");
const learningPractice = document.querySelector("#learning-practice");
const learningQuiz = document.querySelector("#learning-quiz");
const closeLearningDialogButton = document.querySelector("#close-learning-dialog");
const markLearnedButton = document.querySelector("#mark-learned");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#learning-progress");
const progressMessage = document.querySelector("#progress-message");
const learningSaveMessage = document.querySelector("#learning-save-message");
const resetProgressButton = document.querySelector("#reset-progress");
const projectDialog = document.querySelector("#project-dialog");
const openProjectButton = document.querySelector("#open-project");
const closeProjectButton = document.querySelector("#close-project");
const studentNameInput = document.querySelector("#student-name");
const studentTopicSelect = document.querySelector("#student-topic");
const studentColorSelect = document.querySelector("#student-color");
const studentPreview = document.querySelector("#student-preview");
const studentPreviewName = document.querySelector("#student-preview-name");
const studentPreviewTopic = document.querySelector("#student-preview-topic");
const projectHtmlCode = document.querySelector("#project-html-code");
const projectCssCode = document.querySelector("#project-css-code");
const progressStorageKey = "lapbook-learning-progress-v1";
const topicNames = { html: "HTML", jinja: "Jinja2", css: "CSS", sql: "SQL" };
const allowedTopics = new Set(Object.keys(topicNames));
const quizzes = {
  html: {
    question: "¿Qué atributo indica a dónde lleva un enlace?",
    answers: ["src", "href", "alt"],
    correct: 1,
    explanation: "href contiene la dirección de destino de un enlace <a>.",
  },
  jinja: {
    question: "¿Qué sintaxis de Jinja2 muestra el valor de una variable?",
    answers: ["{{ nombre }}", "{% nombre %}", "<% nombre %>"],
    correct: 0,
    explanation: "Las llaves dobles {{ }} imprimen una expresión o variable.",
  },
  css: {
    question: "¿Qué propiedad cambia el color del texto?",
    answers: ["background-color", "font-size", "color"],
    correct: 2,
    explanation: "La propiedad color define el color del texto.",
  },
  sql: {
    question: "¿Qué comando se usa para consultar datos?",
    answers: ["SELECT", "UPDATE", "INSERT"],
    correct: 0,
    explanation: "SELECT lee y devuelve los datos que coinciden con la consulta.",
  },
};
let completedTopics = new Set();
let activeTopic = null;
let progressStorageMessage = "";
let transitionTimer;
let transitionHandler;
const activePointers = new Map();
let pinchStartDistance = 0;
let pinchStartZoom = 1;
let detailsScrollGesture = null;

function pointerDistance(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function getBookZoom() {
  return Number.parseFloat(book.style.getPropertyValue("--book-zoom")) || 1;
}

function isCompactLandscape() {
  return window.matchMedia("(max-height: 500px) and (min-width: 461px)").matches;
}

function usesCompactBookLayout() {
  return window.matchMedia("(max-width: 760px)").matches || isCompactLandscape();
}

function setBookZoom(zoom) {
  const clampedZoom = Math.max(1, Math.min(2.5, zoom));
  book.style.setProperty("--book-zoom", String(clampedZoom));
  if (usesCompactBookLayout()) {
    const scale = Number.parseFloat(book.parentElement.style.getPropertyValue("--book-scale")) || 1;
    const bookHeight = window.matchMedia("(max-width: 760px)").matches ? 620 : 650;
    book.parentElement.style.setProperty("--book-height", `${bookHeight * scale * clampedZoom * 1.08}px`);
    if (isCompactLandscape()) {
      book.style.left = `${(book.parentElement.clientWidth - 920 * scale * clampedZoom) / 2}px`;
    }
  }
}

book.addEventListener("pointerdown", (event) => {
  const details = event.target.closest(".card-details");
  if (details) {
    if (event.pointerType === "touch" && !detailsScrollGesture) {
      detailsScrollGesture = {
        pointerId: event.pointerId,
        element: details,
        startY: event.clientY,
        startScrollTop: details.scrollTop,
      };
      details.setPointerCapture(event.pointerId);
    }
    return;
  }

  if (event.target.closest("button") || (event.pointerType === "mouse" && event.button !== 0)) {
    return;
  }

  if (activePointers.size >= 2) {
    return;
  }

  book.setPointerCapture(event.pointerId);
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 2) {
    const [first, second] = activePointers.values();
    pinchStartDistance = pointerDistance(first, second);
    pinchStartZoom = getBookZoom();
  }
});

book.addEventListener("pointermove", (event) => {
  if (detailsScrollGesture?.pointerId === event.pointerId) {
    detailsScrollGesture.element.scrollTop =
      detailsScrollGesture.startScrollTop + detailsScrollGesture.startY - event.clientY;
    return;
  }

  if (!activePointers.has(event.pointerId)) {
    return;
  }

  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size === 2 && pinchStartDistance > 0) {
    const [first, second] = activePointers.values();
    setBookZoom(pinchStartZoom * pointerDistance(first, second) / pinchStartDistance);
  }
});

function finishBookGesture(event) {
  if (detailsScrollGesture?.pointerId === event.pointerId) {
    detailsScrollGesture = null;
    return;
  }

  if (!activePointers.has(event.pointerId)) {
    return;
  }

  activePointers.delete(event.pointerId);
  pinchStartDistance = 0;
}

book.addEventListener("pointerup", finishBookGesture);
book.addEventListener("pointercancel", finishBookGesture);

resetViewButton.addEventListener("click", () => {
  setBookZoom(1);
});

function fitBookToViewport() {
  if (usesCompactBookLayout()) {
    const scale = Math.min(1, book.parentElement.clientWidth / 980);
    const isMobile = window.matchMedia("(max-width: 760px)").matches && !isCompactLandscape();
    const bookHeight = isMobile ? 620 : 650;
    const heightScale = isMobile ? 1 : Math.max(0.2, (window.innerHeight - 175) / bookHeight);
    const fittedScale = Math.min(scale, heightScale);
    book.parentElement.style.setProperty("--book-scale", String(fittedScale));
    book.parentElement.style.setProperty("--book-height", `${bookHeight * fittedScale * getBookZoom() * 1.08}px`);
    if (!isMobile) {
      book.style.left = `${(book.parentElement.clientWidth - 920 * fittedScale * getBookZoom()) / 2}px`;
    } else {
      book.style.removeProperty("left");
    }
  } else {
    book.parentElement.style.removeProperty("--book-scale");
    book.parentElement.style.removeProperty("--book-height");
    book.style.removeProperty("left");
  }

}

fitBookToViewport();
window.addEventListener("resize", fitBookToViewport);

function cancelBookTransition() {
  window.clearTimeout(transitionTimer);
  if (transitionHandler) {
    coverLeft.removeEventListener("transitionend", transitionHandler);
    transitionHandler = null;
  }
}

function afterCoverFolds(callback) {
  transitionHandler = (event) => {
    if (event.target !== coverLeft || event.propertyName !== "transform") {
      return;
    }

    cancelBookTransition();
    callback();
  };
  coverLeft.addEventListener("transitionend", transitionHandler);
  transitionTimer = window.setTimeout(() => {
    cancelBookTransition();
    callback();
  }, 1250);
}

function setCardState(card, isOpen) {
  const flap = card.querySelector(".card-flap");
  const details = card.querySelector(".card-details");

  if (!flap || !details) {
    return;
  }

  card.classList.toggle("is-open", isOpen);
  flap.setAttribute("aria-expanded", String(isOpen));
  details.setAttribute("aria-hidden", String(!isOpen));
  details.inert = !isOpen;
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function makeField(labelText, control) {
  const label = makeElement("label", "practice-field", labelText);
  label.append(control);
  return label;
}

function makePracticeFrame(description) {
  const frame = makeElement("section", "practice-frame");
  frame.append(makeElement("p", "practice-instructions", description));
  return frame;
}

function renderHtmlPractice(container) {
  const frame = makePracticeFrame("Cambia la etiqueta y el texto para ver cómo HTML organiza el contenido.");
  const tagSelect = document.createElement("select");
  tagSelect.setAttribute("aria-label", "Etiqueta HTML para la vista previa");
  [["h1", "Título h1"], ["p", "Párrafo p"], ["a", "Enlace a"]].forEach(([value, label]) => {
    const option = makeElement("option", "", label);
    option.value = value;
    tagSelect.append(option);
  });
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = "Hola, mundo web";
  textInput.setAttribute("aria-label", "Texto de ejemplo HTML");
  const preview = makeElement("div", "html-preview");
  const code = makeElement("code", "practice-code");
  frame.append(makeField("Etiqueta", tagSelect), makeField("Contenido", textInput));
  frame.append(makeElement("h4", "", "Vista previa"), preview, code);

  const update = () => {
    const tag = tagSelect.value;
    const node = makeElement(tag, "", textInput.value || "Escribe algo");
    if (tag === "a") {
      node.href = "#";
      node.addEventListener("click", (event) => event.preventDefault());
    }
    preview.replaceChildren(node);
    code.textContent = `<${tag}>${textInput.value || "Escribe algo"}</${tag}>`;
  };
  tagSelect.addEventListener("change", update);
  textInput.addEventListener("input", update);
  update();
  container.replaceChildren(frame);
}

function renderJinjaPractice(container) {
  const frame = makePracticeFrame("Jinja2 reemplaza la variable del ejemplo con el valor que escribas.");
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = "Ana";
  nameInput.setAttribute("aria-label", "Valor para la variable nombre");
  const code = makeElement("code", "practice-code", "Hola, {{ nombre }}. ¡Bienvenida!");
  const output = makeElement("p", "jinja-output");
  frame.append(makeField("Variable nombre", nameInput), makeElement("h4", "", "Plantilla"), code);
  frame.append(makeElement("h4", "", "Resultado"), output);
  nameInput.addEventListener("input", () => {
    output.textContent = `Hola, ${nameInput.value || "…"}. ¡Bienvenida!`;
  });
  nameInput.dispatchEvent(new Event("input"));
  container.replaceChildren(frame);
}

function renderCssPractice(container) {
  const frame = makePracticeFrame("Ajusta las propiedades y observa cómo cambia el mismo elemento.");
  const colorSelect = document.createElement("select");
  colorSelect.setAttribute("aria-label", "Color de texto CSS");
  [["#287c83", "Verde azulado"], ["#c35f48", "Coral"], ["#725589", "Violeta"]].forEach(([value, label]) => {
    const option = makeElement("option", "", label);
    option.value = value;
    colorSelect.append(option);
  });
  const sizeInput = document.createElement("input");
  sizeInput.type = "range";
  sizeInput.min = "16";
  sizeInput.max = "36";
  sizeInput.value = "24";
  sizeInput.setAttribute("aria-label", "Tamaño de letra CSS");
  const sizeLabel = makeElement("output", "range-value");
  const preview = makeElement("p", "css-preview", "¡Hola, CSS!");
  const code = makeElement("code", "practice-code");
  frame.append(makeField("color", colorSelect), makeField("font-size", sizeInput));
  frame.append(sizeLabel, makeElement("h4", "", "Vista previa"), preview, code);

  const update = () => {
    preview.style.color = colorSelect.value;
    preview.style.fontSize = `${sizeInput.value}px`;
    sizeLabel.textContent = `${sizeInput.value}px`;
    code.textContent = `color: ${colorSelect.value}; font-size: ${sizeInput.value}px;`;
  };
  colorSelect.addEventListener("change", update);
  sizeInput.addEventListener("input", update);
  update();
  container.replaceChildren(frame);
}

function renderSqlPractice(container) {
  const rows = [
    { nombre: "Ana", lenguaje: "HTML" },
    { nombre: "Luis", lenguaje: "CSS" },
    { nombre: "Maya", lenguaje: "SQL" },
    { nombre: "Leo", lenguaje: "HTML" },
  ];
  const frame = makePracticeFrame("Prueba una consulta sobre esta pequeña tabla de ejemplo. No se conecta a ninguna base de datos.");
  const filterInput = document.createElement("input");
  filterInput.type = "search";
  filterInput.placeholder = "Ej. HTML";
  filterInput.setAttribute("aria-label", "Filtrar registros SQL por lenguaje");
  const query = makeElement("code", "practice-code");
  const table = document.createElement("table");
  table.className = "sql-preview";
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Nombre", "Lenguaje"].forEach((heading) => headerRow.append(makeElement("th", "", heading)));
  head.append(headerRow);
  const body = document.createElement("tbody");
  table.append(head, body);
  const resultCount = makeElement("p", "sql-result-count");
  frame.append(makeField("WHERE lenguaje contiene", filterInput), query, table, resultCount);

  filterInput.addEventListener("input", () => {
    const filter = filterInput.value.trim().toLowerCase();
    const matches = rows.filter((row) => row.lenguaje.toLowerCase().includes(filter));
    body.replaceChildren(...matches.map((row) => {
      const tr = document.createElement("tr");
      tr.append(makeElement("td", "", row.nombre), makeElement("td", "", row.lenguaje));
      return tr;
    }));
    query.textContent = filter
      ? `SELECT nombre, lenguaje FROM alumnos WHERE lenguaje LIKE '%${filter}%'`
      : "SELECT nombre, lenguaje FROM alumnos";
    resultCount.textContent = `${matches.length} ${matches.length === 1 ? "resultado" : "resultados"}`;
  });
  filterInput.dispatchEvent(new Event("input"));
  container.replaceChildren(frame);
}

function renderPractice(topic) {
  const renderers = {
    html: renderHtmlPractice,
    jinja: renderJinjaPractice,
    css: renderCssPractice,
    sql: renderSqlPractice,
  };
  learningPractice.replaceChildren(makeElement("h3", "", "Prueba el ejemplo"));
  const frameContainer = makeElement("div", "practice-content");
  learningPractice.append(frameContainer);
  renderers[topic](frameContainer);
}

function markTopicLearned(topic) {
  if (!allowedTopics.has(topic) || completedTopics.has(topic)) {
    return;
  }
  completedTopics.add(topic);
  saveProgress();
  updateProgress();
}

function renderQuiz(topic) {
  const quiz = quizzes[topic];
  const question = makeElement("h3", "", "Reto rápido");
  const prompt = makeElement("p", "quiz-question", quiz.question);
  const answers = makeElement("div", "quiz-answers");
  const feedback = makeElement("p", "quiz-feedback");
  feedback.setAttribute("aria-live", "polite");
  quiz.answers.forEach((answer, index) => {
    const button = makeElement("button", "quiz-answer", answer);
    button.type = "button";
    button.addEventListener("click", () => {
      answers.querySelectorAll("button").forEach((option) => {
        option.disabled = true;
      });
      if (index === quiz.correct) {
        feedback.className = "quiz-feedback is-correct";
        feedback.textContent = `¡Correcto! ${quiz.explanation}`;
        markTopicLearned(topic);
      } else {
        feedback.className = "quiz-feedback is-incorrect";
        feedback.textContent = `Casi. ${quiz.explanation}`;
      }
      const retryButton = makeElement("button", "quiz-retry", "Intentar de nuevo");
      retryButton.type = "button";
      retryButton.addEventListener("click", () => renderQuiz(topic));
      learningQuiz.append(retryButton);
    });
    answers.append(button);
  });
  learningQuiz.replaceChildren(question, prompt, answers, feedback);
}

function getTopicForCard(card) {
  const id = card.id.replace("topic-", "");
  if (id === "css-properties") {
    return "css";
  }
  return allowedTopics.has(id) ? id : null;
}

function openLearningDialog(card) {
  const topic = getTopicForCard(card);
  const details = card.querySelector(".card-details");
  if (!topic || !details) {
    return;
  }

  activeTopic = topic;
  learningTitle.textContent = topicNames[topic];
  learningExplanation.replaceChildren(...[...details.children].map((child) => child.cloneNode(true)));
  renderPractice(topic);
  renderQuiz(topic);
  updateProgress();
  markLearnedButton.textContent = completedTopics.has(topic) ? "Tema aprendido ✓" : "Marcar tema como aprendido";
  markLearnedButton.disabled = completedTopics.has(topic);
  if (!learningDialog.open) {
    learningDialog.showModal();
  }
  closeLearningDialogButton.focus();
}

function loadProgress() {
  try {
    const savedProgress = window.localStorage.getItem(progressStorageKey);
    if (savedProgress === null) {
      return;
    }
    const parsedProgress = JSON.parse(savedProgress);
    if (!Array.isArray(parsedProgress) || !parsedProgress.every((topic) => allowedTopics.has(topic))) {
      throw new TypeError("El progreso guardado tiene un formato no válido.");
    }
    completedTopics = new Set(parsedProgress);
  } catch (error) {
    progressStorageMessage = "No se pudo leer el avance guardado en este navegador.";
    console.error("No se pudo cargar el progreso de aprendizaje.", error);
  }
}

function saveProgress() {
  try {
    window.localStorage.setItem(progressStorageKey, JSON.stringify([...completedTopics]));
    progressStorageMessage = "";
  } catch (error) {
    progressStorageMessage = "El navegador no permitió guardar el avance.";
    console.error("No se pudo guardar el progreso de aprendizaje.", error);
  }
}

function updateProgress() {
  const count = completedTopics.size;
  progressLabel.textContent = `${count} de 4 temas aprendidos`;
  progressBar.value = count;
  progressBar.setAttribute("aria-label", `${count} de 4 temas aprendidos`);
  learningSaveMessage.textContent = progressStorageMessage || "El avance se guarda en este navegador.";
  progressMessage.textContent = progressStorageMessage || (
    count === 4 ? "¡Excelente! Ya exploraste todos los temas." : "Completa un reto o marca un tema como aprendido."
  );
  document.querySelectorAll("[data-topic]").forEach((tab) => {
    const topic = tab.dataset.topic;
    const isCompleted = completedTopics.has(topic);
    tab.classList.toggle("is-completed", isCompleted);
    tab.setAttribute(
      "aria-label",
      isCompleted ? `${tab.textContent.trim()}, tema aprendido` : tab.textContent.trim(),
    );
    tab.title = isCompleted ? "Tema aprendido" : "";
  });
  if (activeTopic) {
    markLearnedButton.textContent = completedTopics.has(activeTopic)
      ? "Tema aprendido ✓"
      : "Marcar tema como aprendido";
    markLearnedButton.disabled = completedTopics.has(activeTopic);
  }
}

loadProgress();
updateProgress();

function updateProjectPreview() {
  const name = studentNameInput.value.trim() || "Estudiante";
  const topic = studentTopicSelect.value;
  const accent = studentColorSelect.value;
  studentPreviewName.textContent = name;
  studentPreviewTopic.textContent = topic;
  studentPreview.style.setProperty("--student-accent", accent);
  projectHtmlCode.textContent =
    `<article><h2>${name}</h2><p>Explorando ${topic}</p></article>`;
  projectCssCode.textContent = `border-color: ${accent}; color: ${accent};`;
}

studentNameInput.addEventListener("input", updateProjectPreview);
studentTopicSelect.addEventListener("change", updateProjectPreview);
studentColorSelect.addEventListener("change", updateProjectPreview);
updateProjectPreview();

openProjectButton.addEventListener("click", () => projectDialog.showModal());
closeProjectButton.addEventListener("click", () => projectDialog.close());

markLearnedButton.addEventListener("click", () => {
  if (activeTopic) {
    markTopicLearned(activeTopic);
  }
});

closeLearningDialogButton.addEventListener("click", () => learningDialog.close());
learningDialog.addEventListener("close", () => {
  activeTopic = null;
  cards.forEach((card) => setCardState(card, false));
});

resetProgressButton.addEventListener("click", () => {
  if (!window.confirm("¿Quieres reiniciar el avance de los cuatro temas?")) {
    return;
  }
  completedTopics.clear();
  try {
    window.localStorage.removeItem(progressStorageKey);
    progressStorageMessage = "";
  } catch (error) {
    progressStorageMessage = "El avance se reinició en esta sesión, pero no se pudo actualizar el almacenamiento.";
    console.error("No se pudo reiniciar el progreso guardado.", error);
  }
  updateProgress();
});

function openBook(topicId) {
  cancelBookTransition();
  book.classList.remove("is-closing");
  book.classList.remove("is-open");
  book.classList.add("is-opening");
  openBookButton.setAttribute("aria-expanded", "true");
  bookCover.setAttribute("aria-hidden", "true");
  bookInside.setAttribute("aria-hidden", "false");
  bookState.textContent = "ABRIENDO LAPBOOK…";
  closeBookButton.focus();

  afterCoverFolds(() => {
    if (!book.classList.contains("is-opening")) {
      return;
    }

    book.classList.remove("is-opening");
    book.classList.add("is-open");
    bookState.textContent = "LAPBOOK ABIERTA";
  });

  if (topicId) {
    window.setTimeout(() => {
      if (!book.classList.contains("is-opening") && !book.classList.contains("is-open")) {
        return;
      }

      const card = document.querySelector(`#topic-${topicId}`);
      const flap = card?.querySelector(".card-flap");
      if (flap) {
        flap.focus();
        cards.forEach((topicCard) => setCardState(topicCard, false));
        setCardState(card, true);
        openLearningDialog(card);
      }
    }, 950);
  }
}

function closeBook() {
  if (!book.classList.contains("is-open") && !book.classList.contains("is-opening")) {
    return;
  }

  if (learningDialog.open) {
    learningDialog.close();
  }
  cancelBookTransition();
  cards.forEach((card) => setCardState(card, false));
  book.classList.remove("is-open", "is-opening");
  book.classList.add("is-closing");
  bookState.textContent = "CERRANDO LAPBOOK…";

  const finishClosing = () => {
    if (!book.classList.contains("is-closing")) {
      return;
    }

    book.classList.remove("is-closing");
    openBookButton.setAttribute("aria-expanded", "false");
    bookCover.setAttribute("aria-hidden", "false");
    bookInside.setAttribute("aria-hidden", "true");
    bookState.textContent = "PORTADA CERRADA";
    openBookButton.focus();
  };

  afterCoverFolds(finishClosing);
}

openBookButton.addEventListener("click", () => openBook());
closeBookButton.addEventListener("click", closeBook);

cards.forEach((card) => {
  const flap = card.querySelector(".card-flap");
  flap.addEventListener("click", () => {
    cards.forEach((topicCard) => setCardState(topicCard, topicCard === card));
    openLearningDialog(card);
  });
});

document.querySelectorAll("[data-go-to]").forEach((tab) => {
  tab.addEventListener("click", () => openBook(tab.dataset.goTo));
});
