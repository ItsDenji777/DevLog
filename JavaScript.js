// Initialize Supabase
console.log("Initializing Supabase client...");
const supabase = window.supabase.createClient(
  'https://sckrkyjhxcaihcqjbble.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja3JreWpoeGNhaWhjcWpiYmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzc0NTEsImV4cCI6MjA2MjgxMzQ1MX0.vATeLDd-7qctmtQSNpHkySTQrW2aSz1NMNJAJA2t1ao'
);
console.log("Supabase client ready.");

// LOGIN FUNCTION
async function login() {
  console.log("Login attempt started.");
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  console.log(`Logging in with email: ${email}`);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Login failed:", error);
    alert("❌ Login failed: " + error.message);
    return;
  }

  console.log("Login successful");
  alert("✅ Logged in successfully as admin!");
  updateAuthUI(true);
  document.getElementById("loginModal").classList.add("hidden");
}

// LOGOUT FUNCTION
async function logout() {
  console.log("Logging out...");
  await supabase.auth.signOut();
  alert("🔒 Logged out successfully.");
  updateAuthUI(false);
  console.log("Logout completed.");
}

function updateAuthUI(isLoggedIn) {
  console.log(`Updating UI for login status: ${isLoggedIn}`);
  document.getElementById("newPostBtn").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("logoutBtn").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("loginBtn").classList.toggle("hidden", isLoggedIn);
}


// SUBMIT POST
async function submitPost() {
  console.log("Submitting new post...");
  let title = document.getElementById("postTitle").value;
  let content = document.getElementById("postContent").value;
  console.log(`Post title: "${title}", content length: ${content.length}`);

  if (title.trim() !== "" && content.trim() !== "") {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title, content, likes: 0 }])
      .select();

    if (error) {
      console.error("Error adding post:", error);
      alert("❌ Error adding post: " + error.message);
    } else {
      console.log("Post added:", data);
      const newPost = data[0];
      alert("✅ Post added successfully!");
      sendNotification("New Post🔔", title);
      document.getElementById("postTitle").value = "";
      document.getElementById("postContent").value = "";
      document.getElementById("postModal").classList.add("hidden");
      addPostToUI(newPost.title, newPost.content, new Date().toLocaleDateString(), true, newPost.id);
    }
  } else {
    alert("⚠️ Title and content cannot be empty!");
    console.warn("Submit post failed: empty title or content.");
  }
}

// DELETE POST
async function deletePost(button) {
  console.log("Delete post triggered.");
  const postElement = button.closest('.log-entry');
  const postId = postElement.dataset.postId;
  console.log(`Post ID to delete: ${postId}`);

  if (!postId) {
    alert("❌ Post ID not found.");
    console.warn("Delete failed: post ID missing.");
    return;
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error("Error deleting post:", error);
    alert("❌ Error deleting post: " + error.message);
  } else {
    postElement.remove();
    alert("✅ Post deleted successfully!");
    console.log(`Post ${postId} deleted.`);
  }
}


// EDIT POST
async function editPost(button) {
  console.log("Edit post initiated.");
  const postElement = button.closest('.log-entry');
  const postId = postElement?.dataset.postId;
  console.log(`Editing post ID: ${postId}`);

  const dateEl = postElement.querySelector(".date");
  const originalDate = dateEl ? dateEl.textContent : Date().toLocaleDateString();


  if (!postId) {
    alert("❌ Post ID missing!");
    console.warn("Edit failed: post ID missing.");
    return;
  }

  const titleEl = postElement.querySelector("h2");
  const contentEl = postElement.querySelector("p");
  const deleteBtn = postElement.querySelector(".deleteBtn");

  if (deleteBtn) deleteBtn.classList.add("hidden");

  // Create inputs
  const titleInput = document.createElement("input");
  titleInput.className = "editTitleInput";
  titleInput.value = titleEl.innerText;

  const contentTextarea = document.createElement("textarea");
  contentTextarea.className = "editContentTextarea";
  const rawMarkdown = contentEl.dataset.md
    ? decodeURIComponent(contentEl.dataset.md)
    : contentEl.innerText;
  contentTextarea.value = rawMarkdown;

  // Markdown toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";
  const buttons = [
    { label: "<b>Bold</b>", before: "**", after: "**" },
    { label: "<i>Italic</i>", before: "_", after: "_" },
    { label: "Link", before: "[", after: "](url)" },
    { label: "Image", before: "![", after: "](image-url)" },
    { label: "Header1", before: "# ", after: "" },
    { label: "Header2", before: "## ", after: "" },
    { label: "•", before: "- ", after: "" },
  ];
  buttons.forEach(btn => {
    const buttonEl = document.createElement("button");
    buttonEl.innerHTML = btn.label;
    buttonEl.type = "button";
    buttonEl.onclick = () => insertMarkdown(btn.before, btn.after, contentTextarea);
    toolbar.appendChild(buttonEl);
  });

  // Hide original
  titleEl.classList.add("hidden");
  contentEl.classList.add("hidden");

  // Insert new fields
  postElement.insertBefore(titleInput, button);
  postElement.insertBefore(toolbar, button);
  postElement.insertBefore(contentTextarea, button);

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "cancelEditBtn";
  cancelBtn.textContent = "✖️ Cancel";
  postElement.insertBefore(cancelBtn, button.nextSibling);

  // Change Edit to Save
  button.textContent = "💾 Save";
button.onclick = async function saveEdit() {
  const newTitle = titleInput.value.trim();
  const newContent = contentTextarea.value.trim();

  if (!newTitle || !newContent) {
    alert("⚠️ Title and content cannot be empty!");
    return;
  }

  const { error } = await supabase
    .from("posts")
    .update({ title: newTitle, content: newContent })
    .eq("id", postId);

  if (error) {
    alert("❌ Error updating post: " + error.message);
    return;
  }

  // ✅ Remove old post from DOM
  postElement.remove();

  // ✅ Re-add it with updated data
  addPostToUI(newTitle, newContent, originalDate, true, postId);


  alert("✅ Post updated!");
};



  // Cancel button logic
  cancelBtn.onclick = () => {
    titleInput.remove();
    contentTextarea.remove();
    toolbar.remove();
    cancelBtn.remove();
    if (deleteBtn) deleteBtn.classList.remove("hidden");

    titleEl.classList.remove("hidden");
    contentEl.classList.remove("hidden");
    button.innerHTML = '<i class="bi bi-pencil-fill"></i> Edit';
    button.onclick = () => editPost(button);
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
      if (error) {
      alert("❌ Error adding post: " + error.message);
    } else {
      const newPost = data[0];
      alert("✅ Post added successfully!");
      sendNotification("New Post🔔", title);
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



// ADD POST TO UI (updated)
function addPostToUI(title, content, date, showDeleteBtn, id, likes = 0) {
  const logContainer = document.querySelector(".log-container");
  const postElement = document.createElement("div");
  postElement.classList.add("log-entry");
  postElement.style.position = "relative";
  postElement.dataset.postId = id;

  const liked = checkIfLiked(id);
  const likeCount = likes || 0;

  const likeButton = `
  <button class="likeBtn ${liked ? 'liked' : ''}" onclick="likePost('${id}')" ${liked ? "disabled" : ""}>
    <svg class="heart-icon" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
               C13.09 3.81 14.76 3 16.5 3
               19.58 3 22 5.42 22 8.5
               c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
    </svg>
    <span class="likecounter ${liked ? 'liked' : ''}" id="like-count-${id}">${likeCount}</span>
  </button>`;

  const editButton = showDeleteBtn ? `<button class="editBtn" onclick="editPost(this)"><i class="bi bi-pencil-fill"></i> Edit</button>` : '';
  const deleteButton = showDeleteBtn ? `<button class="deleteBtn" onclick="deletePost(this)"><i class="bi bi-trash-fill"></i> Delete</button>` : '';

const renderedContent = marked.parse(content, { breaks: true });


  postElement.innerHTML = `
    <h2>${title}</h2>
    <p data-md="${encodeURIComponent(content)}">${renderedContent}</p>
    <span class="date">${date}</span>
    ${likeButton}
    ${editButton} ${deleteButton}
  `;

  logContainer.prepend(postElement);
}

function getLikesFromCookie(postId) {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`likes_${postId}=`));
  return cookie ? parseInt(cookie.split('=')[1]) : 0;
}

function checkIfLiked(postId) {
  return document.cookie.includes(`liked_${postId}=true`);
}

function toggleLike(postId) {
  let likeCount = getLikesFromCookie(postId);
  const liked = checkIfLiked(postId);

  if (liked) {
    // Already liked, do nothing or optionally allow unlike
    return;
  }

  likeCount++;
  document.cookie = `likes_${postId}=${likeCount}; max-age=31536000; path=/`;
  document.cookie = `liked_${postId}=true; max-age=31536000; path=/`;

  const likeCountEl = document.getElementById(`like-count-${postId}`);
  if (likeCountEl) likeCountEl.textContent = likeCount;
}
async function likePost(postId) {
  console.log(`Like post clicked for post ID: ${postId}`);

  if (checkIfLiked(postId)) {
    console.warn(`Post ${postId} already liked by this user.`);
    return;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("likes")
    .eq("id", postId)
    .single();

  if (error || !data) {
    console.error("Error fetching post for like:", error);
    alert("❌ Error fetching post for liking.");
    return;
  }

  const newLikes = (data.likes || 0) + 1;
  console.log(`Updating likes to ${newLikes} for post ${postId}`);

  const { error: updateError } = await supabase
    .from("posts")
    .update({ likes: newLikes })
    .eq("id", postId);

  if (updateError) {
    console.error("Error updating likes:", updateError);
    alert("❌ Error updating likes.");
    return;
  }

  console.log(`Likes updated for post ${postId}`);

  const likeCountEl = document.getElementById(`like-count-${postId}`);
  if (likeCountEl) likeCountEl.textContent = newLikes;

  document.cookie = `liked_${postId}=true; max-age=31536000; path=/`;

  const likeBtn = likeCountEl.closest("button");
  const likecounter = likeCountEl.closest("span");
  if (likeBtn) {
    likeBtn.disabled = true;
    likeBtn.classList.add("liked");
    likecounter.classList.add("liked");

    const icon = likeBtn.querySelector(".heart-icon");
    if (icon) {
      icon.classList.remove("popped");
      void icon.offsetWidth;
      icon.classList.add("popped");
    }
  }
}


// FINAL window.onload
window.onload = async function () {
  console.log("Page loading... fetching session and posts.");
  document.getElementById("loadingOverlay").classList.remove("hidden");

  const session = await supabase.auth.getSession();
  const user = session.data.session?.user;
  console.log("User Session and Fingerprint Loaded/Generated");
  updateAuthUI(!!user);
  const isLoggedIn = !!user;

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error loading posts:", error);
    alert("❌ Error loading posts: " + error.message);
  } else {
    console.log(`Loaded ${data.length} posts.`);
    data.forEach(post => {
      let formattedDate = new Date(post.created_at).toLocaleDateString();
      addPostToUI(post.title, post.content, formattedDate, isLoggedIn, post.id, post.likes || 0);
    });
  }

  document.getElementById("loadingOverlay").classList.add("hidden");
  console.log("Page load complete.");
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
