const API_URL = '/api/todos';
let todos = [];
let currentFilter = 'all';

// DOM Elements
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const filterBtns = document.querySelectorAll('.filter-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchTodos);
form.addEventListener('submit', addTodo);
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

// Fetch all todos from backend
async function fetchTodos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch');
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('Error fetching todos:', error);
        list.innerHTML = `<div class="empty-state">Error loading tasks. Is the server running?</div>`;
    }
}

// Add a new todo
async function addTodo(e) {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, completed: false })
        });
        
        if (!response.ok) throw new Error('Failed to add');
        
        const newTodo = await response.json();
        todos.unshift(newTodo); // Add to beginning of array
        input.value = '';
        renderTodos();
    } catch (error) {
        console.error('Error adding todo:', error);
    }
}

// Toggle completion status
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTodo)
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        const returnedTodo = await response.json();
        todos = todos.map(t => t.id === id ? returnedTodo : t);
        renderTodos();
    } catch (error) {
        console.error('Error toggling todo:', error);
    }
}

// Delete a todo
async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        todos = todos.filter(t => t.id !== id);
        renderTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
    }
}

// Enter Edit Mode
function enterEditMode(id) {
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    
    const todo = todos.find(t => t.id === id);
    const titleSpan = li.querySelector('.todo-text');
    const actionsDiv = li.querySelector('.actions');
    
    // Replace text with input
    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.value = todo.title;
    inputEl.className = 'todo-edit-input';
    
    // Add event listeners for saving
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveEdit(id, inputEl.value);
    });
    inputEl.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') renderTodos(); // cancel edit
    });
    
    // Change edit button to save button
    actionsDiv.innerHTML = `
        <button class="action-btn save-btn" onclick="saveEdit(${id}, this.parentElement.previousElementSibling.value)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </button>
        <button class="action-btn delete-btn" onclick="renderTodos()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    li.insertBefore(inputEl, titleSpan);
    li.removeChild(titleSpan);
    inputEl.focus();
}

// Save Edit
async function saveEdit(id, newTitle) {
    newTitle = newTitle.trim();
    if (!newTitle) {
        renderTodos();
        return;
    }
    
    const todo = todos.find(t => t.id === id);
    const updatedTodo = { ...todo, title: newTitle };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTodo)
        });
        
        if (!response.ok) throw new Error('Failed to update');
        
        const returnedTodo = await response.json();
        todos = todos.map(t => t.id === id ? returnedTodo : t);
        renderTodos();
    } catch (error) {
        console.error('Error saving edit:', error);
    }
}


// Render todos to DOM
function renderTodos() {
    let filteredTodos = todos;
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }

    if (filteredTodos.length === 0) {
        const message = todos.length === 0 
            ? "You don't have any tasks yet. Add one above!"
            : `No ${currentFilter} tasks found.`;
        list.innerHTML = `<div class="empty-state">${message}</div>`;
        return;
    }

    list.innerHTML = '';
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        
        li.innerHTML = `
            <div class="checkbox-container">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onclick="toggleTodo(${todo.id})">
                <div class="checkmark"></div>
            </div>
            <span class="todo-text">${escapeHTML(todo.title)}</span>
            <div class="actions">
                <button class="action-btn edit-btn" onclick="enterEditMode(${todo.id})" title="Edit">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTodo(${todo.id})" title="Delete">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}
