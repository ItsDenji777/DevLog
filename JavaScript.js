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

  // Hide delete button
  if (deleteBtn) deleteBtn.classList.add("hidden");

  // Replace content with input fields
  const titleInput = document.createElement("input");
  titleInput.value = titleEl.innerText;
  titleInput.classList.add("editTitleInput");

  const contentTextarea = document.createElement("textarea");
  contentTextarea.value = contentEl.innerText;
  contentTextarea.classList.add("editContentTextarea");

  // Replace display elements
  postElement.insertBefore(titleInput, titleEl);
  postElement.insertBefore(contentTextarea, contentEl);
  titleEl.remove();
  contentEl.remove();

  // Create cancel button
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

    // Update UI
    const newTitleEl = document.createElement("h2");
    newTitleEl.innerText = newTitle;
    const newContentEl = document.createElement("p");
    newContentEl.innerText = newContent;

    postElement.insertBefore(newTitleEl, titleInput);
    postElement.insertBefore(newContentEl, contentTextarea);

    titleInput.remove();
    contentTextarea.remove();
    cancelButton.remove();

    button.textContent = "✏️ Edit";
    button.onclick = function () {
      editPost(button);
    };

    // Show delete button again
    if (deleteBtn) deleteBtn.classList.remove("hidden");

    alert("✅ Post updated!");
  };

  // Cancel edit functionality
  cancelButton.onclick = function () {
    const originalTitleEl = document.createElement("h2");
    originalTitleEl.innerText = titleInput.value;
    const originalContentEl = document.createElement("p");
    originalContentEl.innerText = contentTextarea.value;

    postElement.insertBefore(originalTitleEl, titleInput);
    postElement.insertBefore(originalContentEl, contentTextarea);

    titleInput.remove();
    contentTextarea.remove();
    cancelButton.remove();

    button.textContent = "✏️ Edit";
    button.onclick = function () {
      editPost(button);
    };

    // Show delete button again
    if (deleteBtn) deleteBtn.classList.remove("hidden");
  };
}



// ADD POST TO UI
function addPostToUI(title, content, date, showDeleteBtn, id) {
  const logContainer = document.querySelector(".log-container");
  const postElement = document.createElement("div");
  postElement.classList.add("log-entry");
  postElement.style.position = "relative";
  postElement.dataset.postId = id;

  const editButton = showDeleteBtn ? `<button class="editBtn" onclick="editPost(this)">✏️ Edit</button>` : '';
  const deleteButton = showDeleteBtn ? '<button class="deleteBtn" onclick="deletePost(this)">🗑️ Delete</button>' : '';

  postElement.innerHTML = `
    <h2>${title}</h2>
    <p>${content}</p>
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
function sendNotification(title, message) {
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body: message });
        }
      });
    }
  }
}
