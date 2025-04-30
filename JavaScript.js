window.onload = function () {
    console.log(db);
};
document.getElementById("newPostBtn").addEventListener("click", function () {
    document.getElementById("postModal").classList.remove("hidden"); // Just open the modal
});


document.querySelector(".close").addEventListener("click", function() {
    document.getElementById("postModal").classList.add("hidden");
});



function submitPost() {
    if (auth.currentUser) { // Check if user is logged in
        let title = document.getElementById("postTitle").value;
        let content = document.getElementById("postContent").value;

        if (title.trim() !== "" && content.trim() !== "") {
            db.collection("posts").add({
                title: title,
                content: content,
                date: new Date().toLocaleDateString()
            })
            .then(() => {
                alert("✅ Post added successfully!");
                document.getElementById("postTitle").value = "";
                document.getElementById("postContent").value = "";
                document.getElementById("postModal").classList.add("hidden");

                // Dynamically update the UI
                addPostToUI(title, content, new Date().toLocaleDateString(), true); // Include delete button for logged-in users
            })
            .catch(error => {
                alert("❌ Error adding post: " + error.message);
            });
        } else {
            alert("⚠️ Title and content cannot be empty!");
        }
    } else {
        alert("❌ You must be logged in to post.");
        showLoginModal(); // Call the login modal if not logged in
    }
}

function addPostToUI(title, content, date, showDeleteBtn) {
    let logContainer = document.querySelector(".log-container");
    let postElement = document.createElement("div");
    postElement.classList.add("log-entry");
    postElement.innerHTML = `
        <h2>${title}</h2>
        <p>${content}</p>
        <span class="date">${date}</span>
        ${showDeleteBtn ? '<button class="deleteBtn" onclick="deletePost(this)">🗑️ Delete</button>' : ''}
    `;
    logContainer.prepend(postElement); // Add the post to the top of the list
}


function deletePost(button) {
    if (auth.currentUser) { // Check if user is logged in
        let postElement = button.parentElement;

        // Get post details
        let title = postElement.querySelector("h2").innerText;
        let content = postElement.querySelector("p").innerText;

        db.collection("posts").where("title", "==", title).where("content", "==", content).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                doc.ref.delete()
                .then(() => {
                    postElement.remove();
                    alert("✅ Post deleted successfully!");
                })
                .catch(error => {
                    alert("❌ Error deleting post: " + error.message);
                });
            });
        })
        .catch(error => {
            alert("❌ Error finding post: " + error.message);
        });
    } else {
        alert("❌ You must be logged in to delete posts.");
        showLoginModal(); // Call the login modal if not logged in
    }
}


// Load saved posts when the page loads
window.onload = function () {
    let logContainer = document.querySelector(".log-container");

    db.collection("posts").orderBy("date", "asc").get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            let data = doc.data();
            let postElement = document.createElement("div");
            postElement.classList.add("log-entry");
            postElement.innerHTML = `
                <h2>${data.title}</h2>
                <p>${data.content}</p>
                <span class="date">${data.date}</span>
                <button class="deleteBtn" onclick="deletePost(this)">🗑️ Delete</button>
            `;
            logContainer.appendChild(postElement);
        });
    })
    .catch(error => {
        alert("❌ Error loading posts: " + error.message);
    });
};

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

window.onload = function () {
    db.collection("posts").orderBy("date", "asc").get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            let data = doc.data();
            addPostToUI(data.title, data.content, data.date, !!auth.currentUser); // Include delete button if logged in
        });
    })
    .catch(error => {
        alert("❌ Error loading posts: " + error.message);
    });
};


function showLoginModal() {
    document.getElementById("loginModal").classList.remove("hidden");
}

function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        alert("✅ Successfully logged in!");

        // Show the "New Post" button
        document.getElementById("newPostBtn").classList.remove("hidden");

        // Hide the login modal
        document.getElementById("loginModal").classList.add("hidden");
    })
    .catch(error => {
        alert("❌ Login failed: " + error.message);
    });
}

function logout() {
    auth.signOut()
    .then(() => {
        alert("✅ Successfully logged out!");

        // Hide the "New Post" button
        document.getElementById("newPostBtn").classList.add("hidden");
    })
    .catch(error => {
        alert("❌ Error logging out: " + error.message);
    });
}

auth.onAuthStateChanged(user => {
    if (user) {
        // User is logged in; show the "New Post" button
        document.getElementById("newPostBtn").classList.remove("hidden");
    } else {
        // User is not logged in; hide the "New Post" button
        document.getElementById("newPostBtn").classList.add("hidden");
    }
});

// Show the login modal when Login button is clicked
document.getElementById("loginBtn").addEventListener("click", function () {
    document.getElementById("loginModal").classList.remove("hidden");
});

// Log the user out when Logout button is clicked
document.getElementById("logoutBtn").addEventListener("click", function () {
    auth.signOut()
    .then(() => {
        alert("✅ Successfully logged out!");
        document.getElementById("loginBtn").classList.remove("hidden");
        document.getElementById("logoutBtn").classList.add("hidden");
        document.getElementById("newPostBtn").classList.add("hidden"); // Hide New Post button
    })
    .catch(error => {
        alert("❌ Error logging out: " + error.message);
    });
});

// Check login state and update buttons on page load
auth.onAuthStateChanged(user => {
    if (user) {
        // User is logged in
        document.getElementById("loginBtn").classList.add("hidden");
        document.getElementById("logoutBtn").classList.remove("hidden");
        document.getElementById("newPostBtn").classList.remove("hidden"); // Show New Post button
    } else {
        // User is logged out
        document.getElementById("loginBtn").classList.remove("hidden");
        document.getElementById("logoutBtn").classList.add("hidden");
        document.getElementById("newPostBtn").classList.add("hidden"); // Hide New Post button
    }
});

let postElement = document.createElement("div");
postElement.classList.add("log-entry");
postElement.innerHTML = `
    <h2>${title}</h2>
    <p>${content}</p>
    <span class="date">${new Date().toLocaleDateString()}</span>
    <button class="deleteBtn" onclick="deletePost(this)">🗑️ Delete</button>
`;
logContainer.prepend(postElement);

db.collection("posts").get()
.catch(error => {
    alert("⚠️ Unable to load posts. Firebase access might be restricted in your region.");
    console.error("Firebase error:", error.message);
});
firebase.firestore().enablePersistence()
.catch(error => {
    console.error("Offline persistence failed:", error);
});