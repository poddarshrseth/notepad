
const editor = document.getElementById("editor");
const docName = document.getElementById("docName");
const saveStatus = document.getElementById("saveStatus");

const STORAGE_KEY = "my-wordpad-documents";

let documents = [];
let activeDocument = null;
let saveTimer;

// Load saved documents
try {
    documents = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(documents)) {
        documents = [];
    }
} catch {
    documents = [];
}

// Save all documents in browser storage
function saveToStorage() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(documents)
        );

        saveStatus.textContent = "Saved ✓";
    } catch (error) {
        saveStatus.textContent = "Save failed";
        alert("Unable to save. Browser storage may be full.");
    }
}

// Find currently active document
function getActiveDocument() {
    return documents.find(
        doc => doc.id === activeDocument
    );
}

// Save current editor content
function saveDocument() {
    clearTimeout(saveTimer);

    const doc = getActiveDocument();

    if (!doc) return;

    doc.name = docName.value.trim() || "Untitled Document";
    doc.content = editor.innerHTML;
    doc.updated = new Date().toISOString();

    saveToStorage();
    renderDocuments();
    updateWordCount();
}

// Automatic saving
function autoSave() {
    saveStatus.textContent = "Saving...";

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveDocument();
    }, 500);
}

// Text formatting
function format(command) {
    editor.focus();

    document.execCommand(command, false, null);

    autoSave();
}

// Change font family
function changeFont() {
    const font = document.getElementById("fontFamily").value;

    editor.focus();

    document.execCommand("fontName", false, font);

    autoSave();
}

// Change font size
function changeSize() {
    const size = document.getElementById("fontSize").value;

    editor.focus();

    document.execCommand("fontSize", false, size);

    autoSave();
}

// Change text color
function changeColor() {
    const color = document.getElementById("textColor").value;

    editor.focus();

    document.execCommand("foreColor", false, color);

    autoSave();
}

// Highlight text
function changeHighlight() {
    const color = document.getElementById("highlightColor").value;

    editor.focus();

    document.execCommand("hiliteColor", false, color);

    autoSave();
}

// Change paragraph style
function changeHeading() {
    const heading = document.getElementById("heading").value;

    editor.focus();

    document.execCommand("formatBlock", false, heading);

    autoSave();
}

// Insert hyperlink
function insertLink() {
    const url = prompt("Enter website URL:");

    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
        alert("Please enter a valid HTTP or HTTPS URL.");
        return;
    }

    editor.focus();

    document.execCommand("createLink", false, url);

    autoSave();
}

// Insert table
function insertTable() {
    const rows = Number(prompt("Enter number of rows:", "3"));
    const columns = Number(prompt("Enter number of columns:", "3"));

    if (
        !Number.isInteger(rows) ||
        !Number.isInteger(columns) ||
        rows < 1 || rows > 20 ||
        columns < 1 || columns > 10
    ) {
        alert("Enter valid table dimensions.");
        return;
    }

    let table = "<table><tbody>";

    for (let i = 0; i < rows; i++) {
        table += "<tr>";

        for (let j = 0; j < columns; j++) {
            table += "<td><br></td>";
        }

        table += "</tr>";
    }

    table += "</tbody></table><p><br></p>";

    editor.focus();

    document.execCommand("insertHTML", false, table);

    autoSave();
}

// Insert image from computer
function insertImage() {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = function () {
        const file = input.files[0];

        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Please select an image smaller than 2 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            editor.focus();

            document.execCommand(
                "insertImage",
                false,
                reader.result
            );

            autoSave();
        };

        reader.readAsDataURL(file);
    };

    input.click();
}

// Create new document
function newDocument() {
    if (
        editor.innerHTML.trim() &&
        !confirm("Create a new document? Current changes will be saved.")
    ) {
        return;
    }

    saveDocument();

    const newDoc = {
        id: crypto.randomUUID(),
        name: "Untitled Document",
        content: "",
        updated: new Date().toISOString()
    };

    documents.push(newDoc);

    activeDocument = newDoc.id;

    docName.value = newDoc.name;
    editor.innerHTML = "";

    saveToStorage();
    renderDocuments();
    updateWordCount();

    editor.focus();
}

// Open a document
function openDocument(id) {
    saveDocument();

    const doc = documents.find(item => item.id === id);

    if (!doc) return;

    activeDocument = doc.id;

    docName.value = doc.name;
    editor.innerHTML = doc.content || "";

    saveStatus.textContent = "Document opened";

    renderDocuments();
    updateWordCount();
}

// Delete a document
function deleteDocument(id) {
    if (!confirm("Are you sure you want to delete this document?")) {
        return;
    }

    documents = documents.filter(doc => doc.id !== id);

    if (activeDocument === id) {
        activeDocument = null;
        docName.value = "";
        editor.innerHTML = "";
        newDocument();
    } else {
        saveToStorage();
        renderDocuments();
    }
}

// Display saved documents
function renderDocuments() {
    const list = document.getElementById("documentList");

    list.innerHTML = "";

    documents.forEach(doc => {
        const item = document.createElement("div");

        item.className = "document-item";

        const name = document.createElement("span");
        name.textContent = doc.name;

        const actions = document.createElement("div");

        const openButton = document.createElement("button");
        openButton.textContent = "Open";
        openButton.onclick = () => openDocument(doc.id);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteDocument(doc.id);

        actions.append(openButton, deleteButton);
        item.append(name, actions);

        list.appendChild(item);
    });
}

// Count words and characters
function updateWordCount() {
    const text = editor.innerText.trim();

    const words = text
        ? text.split(/\s+/).length
        : 0;

    document.getElementById("wordCount").textContent =
        words + " words";

    document.getElementById("charCount").textContent =
        editor.innerText.length + " characters";
}

// Export document as HTML
function exportHTML() {
    saveDocument();

    const name = docName.value || "document";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHTML(name)}</title>
</head>
<body>
${editor.innerHTML}
</body>
</html>`;

    downloadFile(name + ".html", html, "text/html");
}

// Export as plain text
function exportTXT() {
    const name = docName.value || "document";

    downloadFile(
        name + ".txt",
        editor.innerText,
        "text/plain"
    );
}

// Download helper
function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: type });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename.replace(/[\\/:*?"<>|]/g, "_");

    link.click();

    URL.revokeObjectURL(url);
}

// Escape title for HTML export
function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Import HTML or TXT document
function importDocument() {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = ".html,.htm,.txt";

    input.onchange = function () {
        const file = input.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function () {
            let content = reader.result;

            if (/\.txt$/i.test(file.name)) {
                const paragraph = document.createElement("p");
                paragraph.textContent = content;

                content = paragraph.outerHTML.replace(/\n/g, "<br>");
            } else {
                const parsed = new DOMParser().parseFromString(
                    content,
                    "text/html"
                );

                content = parsed.body.innerHTML;
            }

            saveDocument();

            const doc = {
                id: crypto.randomUUID(),
                name: file.name.replace(/\.(html?|txt)$/i, ""),
                content: content,
                updated: new Date().toISOString()
            };

            documents.push(doc);

            openDocument(doc.id);
            saveToStorage();
            renderDocuments();
        };

        reader.readAsText(file);
    };

    input.click();
}

// Listen for editor changes
editor.addEventListener("input", () => {
    updateWordCount();
    autoSave();
});

// Save document name changes
docName.addEventListener("input", autoSave);

// Initial application loading
function initializeApp() {
    if (documents.length > 0) {
        const latest = [...documents].sort(
            (a, b) => (b.updated || "").localeCompare(a.updated || "")
        )[0];

        openDocument(latest.id);
    } else {
        newDocument();
    }

    renderDocuments();
    updateWordCount();
}

initializeApp();
