/*
 * Configure API_URL after deploying backend/Code.gs as a Google Apps Script web app.
 * Do not put a private grade file or Google credentials in this frontend repository.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzw88KKh2VppH9jrNQS732Pm8RBrmrudpYzyd5oRiEY90V_7423vm6W_emLWvqpxAg/exec";

const form = document.getElementById("lookup-form");
const studentIdInput = document.getElementById("student-id");
const showButton = document.getElementById("show-button");
const statusBox = document.getElementById("status");
const resultsBox = document.getElementById("results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const studentId = studentIdInput.value.trim();

  resultsBox.hidden = true;
  resultsBox.replaceChildren();

  if (!studentId) {
    showStatus("Please enter your Student ID.", "error");
    studentIdInput.focus();
    return;
  }
  if (API_URL.startsWith("PASTE_")) {
    showStatus("The grade service has not been configured yet. Please contact the course administrator.", "error");
    return;
  }

  showButton.disabled = true;
  showButton.textContent = "Searching…";
  showStatus("Retrieving your published grades…", "info");

  try {
    const url = new URL(API_URL);
    url.searchParams.set("studentId", studentId);
    const response = await fetch(url.toString(), { method: "GET", redirect: "follow" });
    if (!response.ok) throw new Error("The grade service returned an error.");
    const payload = await response.json();

    if (!payload || payload.ok !== true) {
      if (payload && payload.error === "NOT_FOUND") {
        showStatus("No grades found for this Student ID. Check the ID and try again.", "error");
      } else {
        showStatus("The grade service could not complete the request. Please try again later.", "error");
      }
      return;
    }

    renderResults(payload.student, payload.assessments || [], payload.updatedAt || "");
    statusBox.hidden = true;
    resultsBox.hidden = false;
  } catch (error) {
    showStatus("Unable to retrieve grades right now. Please check your connection and try again.", "error");
  } finally {
    showButton.disabled = false;
    showButton.textContent = "Show Grades";
  }
});

function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.hidden = false;
}

function addTextElement(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text == null ? "" : String(text);
  parent.appendChild(element);
  return element;
}

function renderResults(student, assessments, updatedAt) {
  resultsBox.replaceChildren();
  const head = document.createElement("div");
  head.className = "results-head";
  const identity = document.createElement("div");
  addTextElement(identity, "h2", "", "Your published grades");
  addTextElement(identity, "p", "student-meta", `${student.name || "Student"} · ID: ${student.id}`);
  head.appendChild(identity);
  addTextElement(head, "span", "badge", "Record found");
  resultsBox.appendChild(head);

  const wrap = document.createElement("div");
  wrap.className = "grade-table-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  addTextElement(hr, "th", "", "Assessment");
  addTextElement(hr, "th", "", "Grade");
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  assessments.forEach(item => {
    const row = document.createElement("tr");
    addTextElement(row, "td", "", item.name);
    const value = item.published === false || item.value === null || item.value === undefined || item.value === ""
      ? "Not published" : String(item.value);
    addTextElement(row, "td", "", item.max !== null && item.max !== undefined && item.max !== "" && value !== "Not published"
      ? `${value} / ${item.max}` : value);
    tbody.appendChild(row);
  });
  if (student.total !== null && student.total !== undefined && student.total !== "") {
    const row = document.createElement("tr");
    row.className = "total-row";
    addTextElement(row, "td", "", "Total");
    const totalText = student.maxTotal !== null && student.maxTotal !== undefined && student.maxTotal !== ""
      ? `${student.total} / ${student.maxTotal}` : String(student.total);
    addTextElement(row, "td", "", totalText);
    tbody.appendChild(row);
  }
  if (student.percentage !== null && student.percentage !== undefined && student.percentage !== "") {
    const row = document.createElement("tr");
    row.className = "total-row";
    addTextElement(row, "td", "", "Percentage");
    addTextElement(row, "td", "", `${student.percentage}%`);
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);
  resultsBox.appendChild(wrap);

  if (student.feedback) {
    const feedback = document.createElement("div");
    feedback.className = "feedback";
    addTextElement(feedback, "h3", "", "Instructor feedback");
    addTextElement(feedback, "p", "", student.feedback);
    resultsBox.appendChild(feedback);
  }

  if (updatedAt) addTextElement(resultsBox, "p", "updated", `Grade data updated: ${updatedAt}`);
  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.textContent = "Print grade report";
  printButton.style.marginTop = "18px";
  printButton.addEventListener("click", () => window.print());
  resultsBox.appendChild(printButton);
}
