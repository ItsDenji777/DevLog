// REPLACE FIREBASE WITH SUPABASE
// Initialize Supabase
const supabase = window.supabase.createClient(
  'https://sckrkyjhxcaihcqjbble.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNja3JreWpoeGNhaWhjcWpiYmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzc0NTEsImV4cCI6MjA2MjgxMzQ1MX0.vATeLDd-7qctmtQSNpHkySTQrW2aSz1NMNJAJA2t1ao'
);


// FETCH POSTS ON LOAD
window.onload = async function () {
  const session = await supabase.auth.getSession();
  const user = session.data.session?.user;
  updateAuthUI(!!user);
  const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        alert("❌ Error loading posts: " + error.message);
        return;
    }

    data.forEach(post => {
        let formattedDate = new Date(post.created_at).toLocaleDateString();
        const isLoggedIn = supabase.auth.getUser(); // optional
       addPostToUI(post.title, post.content, formattedDate, !!isLoggedIn, post.id, post.likes);

    });
};


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
      .insert([{ title, content}]);

    if (error) {
      alert("❌ Error adding post: " + error.message);
    } else {
      alert("✅ Post added successfully!");
      document.getElementById("postTitle").value = "";
      document.getElementById("postContent").value = "";
      document.getElementById("postModal").classList.add("hidden");
      addPostToUI(title, content, new Date().toLocaleDateString(), true);
    }
  } else {
    alert("⚠️ Title and content cannot be empty!");
  }
}

// DELETE POST
async function deletePost(button) {
    // Go up to .log-entry container regardless of where the button is
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



// ADD POST TO UI
function addPostToUI(title, content, date, showDeleteBtn, id) {
  const logContainer = document.querySelector(".log-container");
  const postElement = document.createElement("div");
  postElement.classList.add("log-entry");
  postElement.style.position = "relative"; // Needed for absolute positioning

  // If logged in, show the delete button
  const deleteButton = showDeleteBtn ? 
    '<button class="deleteBtn" onclick="deletePost(this)">🗑️ Delete</button>' : '';

  postElement.innerHTML = `
    <h2>${title}</h2>
    <p>${content}</p>
    <span class="date">${date}</span>
    ${deleteButton}
  `;

  logContainer.prepend(postElement);
}


window.onload = async function () {
  document.getElementById("loadingOverlay").classList.remove("hidden");

  const session = await supabase.auth.getSession();
  const user = session.data.session?.user;
  updateAuthUI(!!user);

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    alert("❌ Error loading posts: " + error.message);
    return;
  }

  data.forEach(post => {
    let formattedDate = new Date(post.created_at).toLocaleDateString();
    const isLoggedIn = !!user;
    addPostToUI(post.title, post.content, formattedDate, isLoggedIn, post.id);
  });

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

