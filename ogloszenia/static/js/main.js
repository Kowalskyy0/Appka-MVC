document.addEventListener('DOMContentLoaded', function() {
    window.currentUser = null;

    function showMessage(msg, type = 'success') {
        const div = document.createElement('div');
        div.className = 'message ' + (type === 'error' ? 'error' : '');
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    function getCategoryName(catId) {
        switch(parseInt(catId)) {
            case 1: return "Wszystkie";
            case 2: return "Elektronika";
            case 3: return "Motoryzacja";
            case 4: return "Nieruchomości";
            case 5: return "Moda";
            case 6: return "Dom i ogród";
            case 7: return "Sport i rekreacja";
            case 8: return "Praca";
            case 9: return "Zwierzęta";
            case 10: return "Inne";
            default: return "";
        }
    }

    fetch('/api/auth/check')
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                window.currentUser = data.user; 
                document.getElementById('user-status').textContent = 'Zalogowano jako: ' + data.user.username;
                document.getElementById('auth-toggle').style.display = 'none';
                document.getElementById('logout-btn').style.display = 'inline';
                document.getElementById('new-announcement').style.display = 'block';
            }
            loadAnnouncements();
        });

    document.getElementById('auth-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('auth-panel').classList.toggle('hidden');
    });

    document.getElementById('login-tab').addEventListener('click', function() {
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('register-tab').classList.remove('active');
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').classList.add('hidden');
    });
    document.getElementById('register-tab').addEventListener('click', function() {
        document.getElementById('register-tab').classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('register-form').classList.remove('hidden');
        document.getElementById('login-form').style.display = 'none';
    });

    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showMessage(data.error, 'error');
            } else {
                showMessage(data.message);
                window.currentUser = data.user; 
                document.getElementById('auth-panel').classList.add('hidden');
                document.getElementById('user-status').textContent = 'Zalogowano jako: ' + data.user.username;
                document.getElementById('auth-toggle').style.display = 'none';
                document.getElementById('logout-btn').style.display = 'inline';
                document.getElementById('new-announcement').style.display = 'block';
                loadAnnouncements();
            }
        })
        .catch(err => {
            console.error('Connection error:', err);
            showMessage('Connection error', 'error');
        });
    });

    document.getElementById('register-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.error || data.message, data.error ? 'error' : 'success');
            document.getElementById('register-form').reset();
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('login-tab').classList.add('active');
            document.getElementById('register-tab').classList.remove('active');
        });
    });

    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        fetch('/api/auth/logout', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            showMessage(data.message);
            window.currentUser = null;
            document.getElementById('logout-btn').style.display = 'none';
            document.getElementById('new-announcement').style.display = 'none';
            document.getElementById('auth-toggle').style.display = 'inline';
            document.getElementById('user-status').textContent = '';
        });
    });

    function loadAnnouncements(category = 1) {
        fetch('/api/announcements/')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('announcements-list');
            list.innerHTML = '';
            const filtered = category != 1 ? data.filter(ann => ann.category == category) : data;
            filtered.forEach(ann => {
                const container = document.createElement('div');
                container.className = 'announcement-container';

                const contentDiv = document.createElement('div');
                contentDiv.className = 'announcement-content';
                contentDiv.innerHTML = `
                    <div class="announcement-header">
                        <h3>${ann.title} - ${ann.price} PLN</h3>
                    </div>
                    <p>${ann.description}</p>
                `;
                container.appendChild(contentDiv);

                if (ann.image) {
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'announcement-image';
                    const img = document.createElement('img');
                    img.src = ann.image;
                    img.alt = ann.title;
                    imgDiv.appendChild(img);
                    container.appendChild(imgDiv);
                }

                const footerDiv = document.createElement('div');
                footerDiv.className = 'announcement-footer';
                const metaSpan = document.createElement('span');
                metaSpan.className = 'announcement-meta';
                metaSpan.textContent = 'Dodane przez: ' + ann.username;
                footerDiv.appendChild(metaSpan);

                if (window.currentUser && (window.currentUser.is_admin || window.currentUser.id === ann.user_id)) {
                    const btnContainer = document.createElement('div');
                    btnContainer.className = 'announcement-actions';
                    
                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.className = 'form-btn';
                    editBtn.style.fontSize = '0.8rem';
                    editBtn.style.padding = '0.3rem 0.5rem';
                    editBtn.addEventListener('click', function() {
                        updateAnnouncement(ann);
                    });
                    
                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'Delete';
                    delBtn.className = 'form-btn red-btn';
                    delBtn.style.fontSize = '0.8rem';
                    delBtn.style.padding = '0.3rem 0.5rem';
                    delBtn.addEventListener('click', function() {
                        deleteAnnouncement(ann.id);
                    });
                    
                    btnContainer.appendChild(editBtn);
                    btnContainer.appendChild(delBtn);
                    footerDiv.appendChild(btnContainer);
                }

                container.appendChild(footerDiv);
                list.appendChild(container);
            });
        });
    }

    function updateAnnouncement(ann) {
        let newTitle = prompt("Nowy tytuł:", ann.title);
        let newDescription = prompt("Nowy opis:", ann.description);
        let newPrice = prompt("Nowa cena:", ann.price);
        if (newTitle && newDescription && newPrice) {
            fetch(`/api/announcements/${ann.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, description: newDescription, price: parseFloat(newPrice) })
            })
            .then(res => res.json())
            .then(data => {
                showMessage(data.message);
                loadAnnouncements();
            });
        }
    }

    function deleteAnnouncement(id) {
        if (confirm("Czy na pewno chcesz usunąć to ogłoszenie?")) {
            fetch(`/api/announcements/${id}`, {
                method: 'DELETE',
            })
            .then(res => res.json())
            .then(data => {
                showMessage(data.message);
                loadAnnouncements();
            });
        }
    }

    document.getElementById('announcement-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const form = document.getElementById('announcement-form');
        const formData = new FormData(form);
        fetch('/api/announcements/', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            showMessage(data.error || data.message, data.error ? 'error' : 'success');
            if (!data.error) {
                loadAnnouncements();
                form.reset();
            }
        });
    });

    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const cat = this.getAttribute('data-category');
            loadAnnouncements(cat);
        });
    });
});

