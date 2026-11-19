const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const API_URL = "https://openlibrary.org/search.json";
const controlsEl = document.getElementById("controls");
const filterInput = document.getElementById("filterInput");
const sortSelect = document.getElementById("sortSelect");
const coverOnly = document.getElementById("coverOnly");
let allBooks = []
async function searchBooks(query) {
    statusEl.textContent = "loading...";
    resultsEl.innerHTML = "";
    controlsEl.hidden = true;
    try {
        const url = `${API_URL}?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,first_publish_year,cover_i`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const data = await response.json();
        if (data.docs.length === 0) {
            statusEl.textContent = "No books found. Try a different search.";
            return;
        }
        allBooks = data.docs;
        controlsEl.hidden = false;
        applyFilters();
      } catch (error) {
        statusEl.textContent = "Something went wrong. Check your internet and try again.";
        console.error(error);
      }
} 

function displayBooks(books) {
  resultsEl.innerHTML = "";
  books.forEach((book) => {
    const card = document.createElement("div");
    card.className = "book-card";
    if (book.cover_i) {
        const img = document.createElement("img");
        img.src = `https://covers.openLibrary.org/b/id/${book.cover_i}-M.jpg`;
        img.alt = `Cover of ${book.title}`;
        card.appendChild(img);
       } else {
        const noCover = document.createElement("div");
        noCover.className = "no-cover";
        noCover.textContent = "No-cover";
        card.appendChild(noCover);
    }
    const title = document.createElement("h3");
    title.textContent = book.title;
    const author = document.createElement("p");
    author.textContent = book.author_name ? book.author_name.join(", ") : "Unkown author";
    const year = document.createElement("p");
    year.textContent = book.first_publish_year ? `First published: ${book.first_publish_year}` : "Year unknown";
    card.append(title, author, year);
    resultsEl.appendChild(card);
  });
}
function applyFilters() {
    const text = filterInput.value.toLowerCase();
    const sort = sortSelect.value;
    const year = (b, fallback) => b.first_publish_year || fallback;
    const books = allBooks
      .filter((b) => (b.title + " " + (b.author_name || []).join(" ")).toLowerCase().includes(text))
      .filter((b) => !coverOnly.checked || b.cover_i);
    if (sort === "title-asc") books.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "title-desc") books.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "year-new") books.sort((a, b) => year(b, 0) = year(a, 0));
    if (sort === "year-old") books.sort((a, b) => year(a, 9999) - year(b, 9999));
    statusEl.textContent = books.length ? `Showing ${books.length} of ${allBooks.length} books.` : "No books match yout filters.";
    displayBooks(books);
}
function handleSearch() {
    const query = searchInput.value.trim();
    if (query === "") {
        statusEl.textContent = "Please type a book title or author first.";
        return;
    }
    filterInput.value = ""; sortSelect.value = "relevance"; coverOnly.checked = false;
    searchBooks(query);
}
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSearch();
});
filterInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);
coverOnly.addEventListener("change", applyFilters);