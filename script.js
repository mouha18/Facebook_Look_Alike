const API_URL = 'http://localhost:3000';
let token = null;
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
    fetchPosts();
});
function setupEventListeners() {
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'flex';
    });
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('register-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'flex';
    });
    document.getElementById('post-btn').addEventListener('click', createPost);
    document.getElementById('logout-btn').addEventListener('click', logout);
}
function checkLoginStatus() {
    token = localStorage.getItem('token');
    if (token) {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'inline';
        document.getElementById('username').textContent = 'your MaJeStY';
    } else {
        document.getElementById('login-modal').style.display = 'flex';
    }
}
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.token) {
      token = data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', data.userId);
      checkLoginStatus();
      fetchPosts();
    } else {
      alert('Login failed');
    }
}
async function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    if (response.ok) {
        document.getElementById('register-modal').style.display = 'none';
        document.getElementById('login-modal').style.display = 'flex';
    } else {
        alert('Registration failed');
    }
}
async function fetchPosts() {
    const response = await fetch(`${API_URL}/posts`);
    const posts = await response.json();
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    const currentUserId = parseInt(localStorage.getItem('userId'), 10);
    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.setAttribute('data-post-id', post.id);
      let postHTML = `<p>${post.content}</p><small>Post ID: ${post.id}</small>`;
      if (post.user_id === currentUserId) {
        postHTML += '<button class="delete-btn">Delete</button>';
      }
      postElement.innerHTML = postHTML;
      feed.appendChild(postElement);
    });
}
document.getElementById('feed').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const postElement = e.target.closest('.post');
    const postId = postElement.getAttribute('data-post-id');
    deletePost(postId);
  }
});
async function createPost() {
    if (!token) {
        alert('Please log in to post');
        return;
    }
    const content = document.getElementById('post-content').value;
    const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
    if (response.ok) {
        document.getElementById('post-content').value = '';
        fetchPosts();
    } else {
        alert('Failed to create post');
    }
}
async function deletePost(postId) {
  if (!token) {
    alert('Please log in to delete posts');
    return;
  }
  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const postElement = document.querySelector(`[data-post-id="${postId}"]`);
      postElement.remove();
    } else {
      const data = await response.json();
      alert(data.message || 'Failed to delete post');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('An error occurred while deleting the post');
  }
}
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    token = null;
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('username').textContent = 'Guest';
    document.getElementById('login-modal').style.display = 'flex';
}