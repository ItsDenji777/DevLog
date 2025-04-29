window.onload = function () {
    console.log(db);
};
document.getElementById("newPostBtn").addEventListener("click", function() {
    let password = prompt("Enter password to create a new post:");
    if (password === "6969") { // Change this to your actual password
        document.getElementById("postModal").classList.remove("hidden");
    } else {
        alert("❌ Incorrect password. Access denied!");
    }
});

document.querySelector(".close").addEventListener("click", function() {
    document.getElementById("postModal").classList.add("hidden");
});



function submitPost() {
    let title = document.getElementById("postTitle").value;
    let content = document.getElementById("postContent").value;

    if (title.trim() !== "" && content.trim() !== "") {
        // Save post to Firestore
        db.collection("posts").add({
            title: title,
            content: content,
            date: new Date().toLocaleDateString()
        })
        .then(() => {
            alert("✅ Post added successfully!");

            // Dynamically add post to UI
            let logContainer = document.querySelector(".log-container");
            let postElement = document.createElement("div");
            postElement.classList.add("log-entry");
            postElement.innerHTML = `
                <h2>${title}</h2>
                <p>${content}</p>
                <span class="date">${new Date().toLocaleDateString()}</span>
            `;
            logContainer.prepend(postElement);

            // Clear inputs & hide modal
            document.getElementById("postTitle").value = "";
            document.getElementById("postContent").value = "";
            document.getElementById("postModal").classList.add("hidden");
        })
        .catch(error => {
            alert("❌ Error adding post: " + error.message);
        });
    } else {
        alert("⚠️ Title and content cannot be empty!");
    }
}


// 🔥 Password-protected delete function 🔥
function deletePost(button) {
    let password = prompt("Enter password to delete this post:");
    if (password === "6969") {
        let postElement = button.parentElement;

        // Get post title and content
        let title = postElement.querySelector("h2").innerText;
        let content = postElement.querySelector("p").innerText;

        // Find and delete post in Firestore
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
        alert("❌ Incorrect password. Post not deleted.");
    }
}

// Load saved posts when the page loads
window.onload = function () {
    let logContainer = document.querySelector(".log-container");

    db.collection("posts").orderBy("date", "desc").get()
    .then(snapshot => {
        snapshot.forEach(doc => {
            let data = doc.data();
            let postElement = document.createElement("div");
            postElement.classList.add("log-entry");
            postElement.innerHTML = `
                <h2>${data.title}</h2>
                <p>${data.content}</p>
                <span class="date">${data.date}</span>
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

