/*
 * Set API_URL to the deployed Google Apps Script Web App URL ending in /exec.
 * This frontend uses JSONP to avoid the common cross-origin fetch/CORS issue
 * with Apps Script ContentService redirects.
 *
 * IMPORTANT: JSONP is suitable only for public, non-sensitive responses.
 * Student-ID-only lookup does not authenticate students.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzNvxpIgpjVn-soS-UlkT4D75aJUcGfHbZ85m2nNWfI0bID_Fnwvi8ueXz2QCuk5spK/exec";

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
  showStatus("Retrieving your published quiz grade…", "info");

  try {
    const url = new URL(API_URL);
    url.searchParams.set("studentId", studentId);
    const payload = await lookupWithJsonp(url);

    if (!payload || payload.ok !== true) {
      if (payload && payload.error === "NOT_FOUND") {
        showStatus("No records found for this Student ID. Check the ID and try again.", "error");
      } else if (payload && payload.error === "DUPLICATE_ID") {
        showStatus("More than one record uses this Student ID. Please contact the course administrator.", "error");
      } else if (payload && payload.error === "INVALID_ID") {
        showStatus("Please enter a valid Student ID.", "error");
      } else {
        showStatus("The grade service could not complete the request. Please try again later.", "error");
      }
      return;
    }

    renderResults(payload.student, payload.assessments || [], payload.updatedAt || "");
    statusBox.hidden = true;
    resultsBox.hidden = false;
  } catch (error) {
    console.error("Grade lookup failed:", error);
    showStatus("Unable to retrieve grades right now. Check the Apps Script deployment URL and access settings, then try again.", "error");
  } finally {
    showButton.disabled = false;
    showButton.textContent = "Show Quiz Grade";
  }
});

function lookupWithJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "gradeLookup_" + Date.now() + "_" +
      Math.random().toString(36).slice(2);

    const script = document.createElement("script");
    let timeoutId = null;
    let settled = false;

    const cleanup = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
      script.onerror = null;
      script.remove();
    };

    window[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    url.searchParams.set("callback", callbackName);
    // Cache-buster helps ensure a fresh response after grade updates.
    url.searchParams.set("_", String(Date.now()));
    script.async = true;
    script.src = url.toString();

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("The grade service script could not be loaded."));
    };

    timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("The grade service request timed out."));
    }, 20000);

    document.head.appendChild(script);
  });
}

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
  addTextElement(identity, "h2", "", "Your Quiz Grade");
  addTextElement(identity, "p", "student-meta", `${student.name || "Student"} · ID: ${student.id}`);
  head.appendChild(identity);
  addTextElement(head, "span", "badge", "Record found");
  resultsBox.appendChild(head);

  // Filter assessments to find the quiz item only
  const quizItem = assessments.find(item => 
    item.name && item.name.toLowerCase().includes("quiz")
  );

  const wrap = document.createElement("div");
  wrap.className = "grade-table-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  addTextElement(headerRow, "th", "", "Assessment");
  addTextElement(headerRow, "th", "", "Grade");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  
  if (quizItem) {
    const row = document.createElement("tr");
    addTextElement(row, "td", "", quizItem.name);
    const isMissing = quizItem.published === false || quizItem.value === null || quizItem.value === undefined || quizItem.value === "";
    const gradeText = isMissing
      ? "Not published"
      : (quizItem.max !== null && quizItem.max !== undefined && quizItem.max !== ""
          ? `${quizItem.value} / ${quizItem.max}`
          : String(quizItem.value));
    addTextElement(row, "td", "", gradeText);
    tbody.appendChild(row);
  } else {
    const row = document.createElement("tr");
    addTextElement(row, "td", "", "Quiz");
    addTextElement(row, "td", "", "Not found");
    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  wrap.appendChild(table);
  resultsBox.appendChild(wrap);

  if (updatedAt) addTextElement(resultsBox, "p", "updated", `Grade data updated: ${updatedAt}`);

  const printButton = document.createElement("button");
  printButton.type = "button";
  printButton.textContent = "Print grade report";
  printButton.style.marginTop = "18px";
  printButton.addEventListener("click", () => window.print());
  resultsBox.appendChild(printButton);
}
