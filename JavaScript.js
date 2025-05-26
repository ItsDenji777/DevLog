// Initialize Supabase
const supabase = window.supabase.createClient(
  'https://sckrkyjhxcaihcqjbble.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja3JreWpoeGNhaWhjcWpiYmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzc0NTEsImV4cCI6MjA2MjgxMzQ1MX0.vATeLDd-7qctmtQSNpHkySTQrW2aSz1NMNJAJA2t1ao'
);


// LOGIN FUNCTION
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("❌ Login failed: " + error.message);
    return;
  }

  alert("✅ Logged in successfully as admin!");
  updateAuthUI(true);
  document.getElementById("loginModal").classList.add("hidden");
}

// LOGOUT FUNCTION
async function logout() {
  await supabase.auth.signOut();
  alert("🔒 Logged out successfully.");
  updateAuthUI(false);
}

function updateAuthUI(isLoggedIn) {
  document.getElementById("newPostBtn").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("logoutBtn").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("loginBtn").classList.toggle("hidden", isLoggedIn);
}


// SUBMIT POST
async function submitPost() {
  let title = document.getElementById("postTitle").value;
  let content = document.getElementById("postContent").value;

  if (title.trim() !== "" && content.trim() !== "") {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title, content }])
      .select();
      sendNotification("New Post🔔", title);

    if (error) {
      alert("❌ Error adding post: " + error.message);
    } else {
      const newPost = data[0];
      alert("✅ Post added successfully!");
      document.getElementById("postTitle").value = "";
      document.getElementById("postContent").value = "";
      document.getElementById("postModal").classList.add("hidden");
      addPostToUI(newPost.title, newPost.content, new Date().toLocaleDateString(), true, newPost.id);
    }
  } else {
    alert("⚠️ Title and content cannot be empty!");
  }
}


// DELETE POST
async function deletePost(button) {
  let postElement = button.closest('.log-entry');
  let title = postElement.querySelector("h2")?.innerText;
  let content = postElement.querySelector("p")?.innerText;

  const { data, error } = await supabase
    .from('posts')
    .select('id')
    .eq('title', title)
    .eq('content', content);

  if (error || !data || data.length === 0) {
    alert("❌ Error finding post: " + (error?.message || "Post not found"));
    return;
  }

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', data[0].id);

  if (deleteError) {
    alert("❌ Error deleting post: " + deleteError.message);
  } else {
    postElement.remove();
    alert("✅ Post deleted successfully!");
  }
}


// EDIT POST
async function editPost(button) {
  const postElement = button.closest('.log-entry');
  const postId = postElement.dataset.postId;
  const titleEl = postElement.querySelector("h2");
  const contentEl = postElement.querySelector("p");
  const deleteBtn = postElement.querySelector(".deleteBtn");

  // Hide delete button while editing
  if (deleteBtn) deleteBtn.classList.add("hidden");

  // Create input fields for editing
  const titleInput = document.createElement("input");
  titleInput.value = titleEl.innerText;
  titleInput.classList.add("editTitleInput");

  const contentTextarea = document.createElement("textarea");
  contentTextarea.classList.add("editContentTextarea");
  const rawMarkdown = contentEl.dataset.md ? decodeURIComponent(contentEl.dataset.md) : contentEl.innerText;
  contentTextarea.value = rawMarkdown;

  // Markdown toolbar for editing
  const toolbar = document.createElement("div");
  toolbar.classList.add("toolbar");
  const buttons = [
    { label: "<b>B</b>", before: "**", after: "**" },
    { label: "<i>I</i>", before: "_", after: "_" },
    { label: "Link", before: "[", after: "](url)" },
    { label: "Image", before: "![", after: "](image-url)" },
    { label: "H1", before: "# ", after: "" },
    { label: "H2", before: "## ", after: "" },
    { label: "•", before: "- ", after: "" },
    { label: "1.", before: "1. ", after: "" },
  ];
  buttons.forEach(btn => {
    const buttonEl = document.createElement("button");
    buttonEl.type = "button";
    buttonEl.innerHTML = btn.label;
    buttonEl.onclick = () => insertMarkdown(btn.before, btn.after, contentTextarea);
    toolbar.appendChild(buttonEl);
  });

  // Remove the existing elements
  titleEl.remove();
  contentEl.remove();

  // Insert the editable fields and toolbar
  postElement.insertBefore(titleInput, button);
  postElement.insertBefore(toolbar, button);
  postElement.insertBefore(contentTextarea, button);

  // Cancel button
  const cancelButton = document.createElement("button");
  cancelButton.textContent = "✖️ Cancel";
  cancelButton.classList.add("cancelEditBtn");
  postElement.insertBefore(cancelButton, button.nextSibling);

  // Change edit button to save
  button.textContent = "💾 Save";
  button.onclick = async function () {
    const newTitle = titleInput.value.trim();
    const newContent = contentTextarea.value.trim();

    if (newTitle === "" || newContent === "") {
      alert("⚠️ Title and content cannot be empty!");
      return;
    }

    const { error } = await supabase
      .from('posts')
      .update({ title: newTitle, content: newContent })
      .eq('id', postId);

    if (error) {
      alert("❌ Error updating post: " + error.message);
      return;
    }

    // Re-render post with markdown
    const newTitleEl = document.createElement("h2");
    newTitleEl.innerText = newTitle;
    const newContentEl = document.createElement("p");
    newContentEl.dataset.md = encodeURIComponent(newContent);
    newContentEl.innerHTML = marked.parse(newContent);

    postElement.insertBefore(newTitleEl, titleInput);
    postElement.insertBefore(newContentEl, contentTextarea);

    // Clean up
    titleInput.remove();
    contentTextarea.remove();
    toolbar.remove();
    cancelButton.remove();

    button.textContent = " Edit";
    button.onclick = () => editPost(button);

    if (deleteBtn) deleteBtn.classList.remove("hidden");

    alert("✅ Post updated!");
  };

  // Cancel editing restores original display
  cancelButton.onclick = function () {
    const originalTitleEl = document.createElement("h2");
    originalTitleEl.innerText = titleInput.value;
    const originalContentEl = document.createElement("p");
    originalContentEl.dataset.md = encodeURIComponent(contentTextarea.value);
    originalContentEl.innerHTML = marked.parse(contentTextarea.value);

    postElement.insertBefore(originalTitleEl, titleInput);
    postElement.insertBefore(originalContentEl, contentTextarea);

    // Clean up
    titleInput.remove();
    contentTextarea.remove();
    toolbar.remove();
    cancelButton.remove();

    button.textContent = " Edit";
    button.onclick = () => editPost(button);

    if (deleteBtn) deleteBtn.classList.remove("hidden");
  };
}


// --- SUBMIT POST with raw markdown saved ---
async function submitPost() {
  let title = document.getElementById("postTitle").value;
  let content = document.getElementById("postContent").value;

  if (title.trim() !== "" && content.trim() !== "") {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title, content }])
      .select();

    sendNotification("New Post🔔", title);

    if (error) {
      alert("❌ Error adding post: " + error.message);
    } else {
      const newPost = data[0];
      alert("✅ Post added successfully!");
      document.getElementById("postTitle").value = "";
      document.getElementById("postContent").value = "";
      document.getElementById("postModal").classList.add("hidden");
      addPostToUI(newPost.title, newPost.content, new Date().toLocaleDateString(), true, newPost.id);
    }
  } else {
    alert("⚠️ Title and content cannot be empty!");
  }
}

function insertMarkdown(before, after, textarea = document.getElementById('postContent')) {
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  const selected = text.slice(start, end);
  const newText = before + selected + after;

  textarea.value = text.slice(0, start) + newText + text.slice(end);
  textarea.focus();

  const cursorPosition = selected ? start + newText.length : start + before.length;
  textarea.setSelectionRange(cursorPosition, cursorPosition);
}



// ADD POST TO UI
function addPostToUI(title, content, date, showDeleteBtn, id) {
  const logContainer = document.querySelector(".log-container");
  const postElement = document.createElement("div");
  postElement.classList.add("log-entry");
  postElement.style.position = "relative";
  postElement.dataset.postId = id;

  const editButton = showDeleteBtn ? `<button class="editBtn" onclick="editPost(this)"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
</svg> Edit</button>` : '';
  const deleteButton = showDeleteBtn ? `<button class="deleteBtn" onclick="deletePost(this)"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
</svg> Delete</button>` : '';

  // Render Markdown to HTML using marked
  const renderedContent = marked.parse(content);

  // Store raw markdown safely encoded in data attribute
  postElement.innerHTML = `
    <h2>${title}</h2>
    <p data-md="${encodeURIComponent(content)}">${renderedContent}</p>
    <span class="date">${date}</span>
    ${editButton} ${deleteButton}
  `;

  logContainer.prepend(postElement);
}


// FINAL window.onload
window.onload = async function () {
  document.getElementById("loadingOverlay").classList.remove("hidden");

  const session = await supabase.auth.getSession();
  const user = session.data.session?.user;
  updateAuthUI(!!user);
  const isLoggedIn = !!user;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    alert("❌ Error loading posts: " + error.message);
  } else {
    data.forEach(post => {
      let formattedDate = new Date(post.created_at).toLocaleDateString();
      addPostToUI(post.title, post.content, formattedDate, isLoggedIn, post.id);
    });
  }

  document.getElementById("loadingOverlay").classList.add("hidden");
};


// OPEN / CLOSE MODALS
document.getElementById("newPostBtn").addEventListener("click", function () {
  document.getElementById("postModal").classList.remove("hidden");
});

document.querySelector(".close").addEventListener("click", function () {
  document.getElementById("postModal").classList.add("hidden");
});

document.getElementById("loginBtn").addEventListener("click", function () {
  document.getElementById("loginModal").classList.remove("hidden");
});

document.getElementById("logoutBtn").addEventListener("click", logout);


// OPTIONAL NOTIFICATIONS
function sendNotification(title, content) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body: content});
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body: content});
        }
      });
    }
  }
}
