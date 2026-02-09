// Global variables
let supabaseClient = null;
let tables = [];
let currentEditRow = null;
let currentEditTableId = null;

// Load settings from localStorage
function loadSettings() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    
    if (url && key) {
        try {
            supabaseClient = supabase.createClient(url, key);
            updateConnectionStatus(true);
            document.getElementById('createTableBtn').disabled = false;
            loadTables();
            return true;
        } catch (error) {
            console.error('Error creating Supabase client:', error);
            updateConnectionStatus(false);
            return false;
        }
    }
    return false;
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    if (connected) {
        statusEl.className = 'connection-status connected';
        statusEl.textContent = '✓ Connected';
    } else {
        statusEl.className = 'connection-status disconnected';
        statusEl.textContent = '✗ Not Connected';
    }
}

// Show status messages
function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 3000);
}

// Settings Modal functions
function openSettingsModal() {
    const url = localStorage.getItem('supabase_url') || '';
    const key = localStorage.getItem('supabase_key') || '';
    
    document.getElementById('supabaseUrl').value = url;
    document.getElementById('supabaseKey').value = key;
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();

    if (!url || !key) {
        showStatus('Please enter both URL and API key', 'error');
        return;
    }

    // Validate URL format
    if (!url.startsWith('https://') || !url.includes('supabase.co')) {
        showStatus('Invalid Supabase URL format', 'error');
        return;
    }

    try {
        // Save to localStorage
        localStorage.setItem('supabase_url', url);
        localStorage.setItem('supabase_key', key);

        // Create client
        supabaseClient = supabase.createClient(url, key);
        
        updateConnectionStatus(true);
        document.getElementById('createTableBtn').disabled = false;
        
        showStatus('Settings saved! Loading your tables...');
        closeSettingsModal();
        
        // Load tables
        loadTables();
    } catch (error) {
        showStatus('Error connecting to Supabase. Check your credentials.', 'error');
        console.error('Error:', error);
    }
}

// Create Table Modal functions
function openCreateModal() {
    if (!supabaseClient) {
        showStatus('Please configure Supabase settings first', 'warning');
        openSettingsModal();
        return;
    }
    document.getElementById('createModal').style.display = 'block';
    document.getElementById('tableName').focus();
}

function closeCreateModal() {
    document.getElementById('createModal').style.display = 'none';
    document.getElementById('tableName').value = '';
    document.getElementById('columnsContainer').innerHTML = '<input type="text" class="columns-input" placeholder="Column name (e.g., country, city, date)">';
}

function addColumnInput() {
    const container = document.getElementById('columnsContainer');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'columns-input';
    input.placeholder = 'Column name';
    container.appendChild(input);
}

// Create new table
async function createTable() {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    const tableName = document.getElementById('tableName').value.trim();
    const columnInputs = document.querySelectorAll('.columns-input');
    const columns = Array.from(columnInputs)
        .map(input => input.value.trim())
        .filter(col => col !== '');

    if (!tableName) {
        showStatus('Please enter a table name', 'error');
        return;
    }

    if (columns.length === 0) {
        showStatus('Please add at least one column', 'error');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('tables')
            .insert([{
                name: tableName,
                columns: columns
            }])
            .select();

        if (error) {
            showStatus(`Error creating table: ${error.message}`, 'error');
        } else {
            showStatus(`Table "${tableName}" created successfully!`);
            closeCreateModal();
            loadTables();
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Load all tables
async function loadTables() {
    if (!supabaseClient) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('tables')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            showStatus(`Error loading tables: ${error.message}`, 'error');
            return;
        }

        tables = data || [];
        renderTables();
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Render all tables
function renderTables() {
    const container = document.getElementById('tablesContainer');
    
    if (tables.length === 0) {
        container.innerHTML = '<div class="no-tables">No tables created yet. Click "Create New Table" to get started!</div>';
        return;
    }

    container.innerHTML = '';
    tables.forEach(table => {
        const tableDiv = createTableElement(table);
        container.appendChild(tableDiv);
        loadTableRows(table.id);
    });
}

// Create table element
function createTableElement(table) {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table-container';
    tableDiv.id = `table-${table.id}`;

    const formInputs = table.columns.map(col => 
        `<input type="text" placeholder="${col}" data-column="${col}">`
    ).join('');

    tableDiv.innerHTML = `
        <div class="table-header">
            <h2 class="table-title">${table.name}</h2>
            <button class="delete-table-btn" onclick="deleteTable(${table.id})">Delete Table</button>
        </div>
        
        <div class="add-row-form">
            ${formInputs}
            <button class="add-row-btn" onclick="addRow(${table.id})">Add Row</button>
        </div>
        
        <div class="data-table-wrapper" id="table-data-${table.id}">
            Loading...
        </div>
    `;

    // Add Enter key functionality to inputs
    const inputs = tableDiv.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addRow(table.id);
            }
        });
    });

    return tableDiv;
}

// Add row to table
async function addRow(tableId) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    const tableDiv = document.getElementById(`table-${tableId}`);
    const inputs = tableDiv.querySelectorAll('.add-row-form input');
    
    const data = {};
    let hasData = false;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            data[input.dataset.column] = value;
            hasData = true;
        }
    });

    if (!hasData) {
        showStatus('Please fill in at least one field', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('table_rows')
            .insert([{
                table_id: tableId,
                data: data
            }]);

        if (error) {
            showStatus(`Error adding row: ${error.message}`, 'error');
        } else {
            inputs.forEach(input => input.value = '');
            loadTableRows(tableId);
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Load rows for a specific table
async function loadTableRows(tableId) {
    if (!supabaseClient) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('table_rows')
            .select('*')
            .eq('table_id', tableId)
            .order('created_at', { ascending: true });

        if (error) {
            document.getElementById(`table-data-${tableId}`).innerHTML = '<div class="empty-table">Error loading rows</div>';
            return;
        }

        const tableContainer = document.getElementById(`table-data-${tableId}`);
        
        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<div class="empty-table">No rows yet. Add some data above!</div>';
            return;
        }

        // Get table columns
        const table = tables.find(t => t.id === tableId);
        const columns = table.columns;

        // Create table HTML
        let tableHtml = '<table class="data-table"><thead><tr>';
        
        // Add column headers
        columns.forEach(col => {
            tableHtml += `<th>${col}</th>`;
        });
        tableHtml += '<th>Actions</th></tr></thead><tbody>';

        // Add rows
        data.forEach(row => {
            tableHtml += '<tr>';
            columns.forEach(col => {
                const value = row.data[col] || '';
                tableHtml += `<td>${value}</td>`;
            });
            tableHtml += `<td>
                <button class="action-btn" onclick="openEditModal(${row.id}, ${tableId})">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteRow(${row.id}, ${tableId})">Delete</button>
            </td></tr>`;
        });

        tableHtml += '</tbody></table>';
        tableContainer.innerHTML = tableHtml;
    } catch (error) {
        document.getElementById(`table-data-${tableId}`).innerHTML = '<div class="empty-table">Connection error</div>';
        console.error('Error:', error);
    }
}

// Edit Modal functions
function openEditModal(rowId, tableId) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    currentEditRow = rowId;
    currentEditTableId = tableId;

    // Load row data
    loadRowForEdit(rowId, tableId);
}

async function loadRowForEdit(rowId, tableId) {
    try {
        const { data, error } = await supabaseClient
            .from('table_rows')
            .select('*')
            .eq('id', rowId)
            .single();

        if (error) {
            showStatus(`Error loading row: ${error.message}`, 'error');
            return;
        }

        const table = tables.find(t => t.id === tableId);
        const formContainer = document.getElementById('editFormContainer');
        
        // Build edit form
        let formHtml = '';
        table.columns.forEach(col => {
            const value = data.data[col] || '';
            formHtml += `
                <div class="form-group">
                    <label for="edit-${col}">${col}:</label>
                    <input type="text" id="edit-${col}" value="${value}" data-column="${col}">
                </div>
            `;
        });

        formContainer.innerHTML = formHtml;
        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditRow = null;
    currentEditTableId = null;
}

async function saveEdit() {
    if (!supabaseClient || !currentEditRow) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    const inputs = document.querySelectorAll('#editFormContainer input');
    const data = {};
    
    inputs.forEach(input => {
        data[input.dataset.column] = input.value.trim();
    });

    try {
        const { error } = await supabaseClient
            .from('table_rows')
            .update({ data: data })
            .eq('id', currentEditRow);

        if (error) {
            showStatus(`Error updating row: ${error.message}`, 'error');
        } else {
            showStatus('Row updated successfully!');
            closeEditModal();
            loadTableRows(currentEditTableId);
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Delete row
async function deleteRow(rowId, tableId) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this row?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('table_rows')
            .delete()
            .eq('id', rowId);

        if (error) {
            showStatus(`Error deleting row: ${error.message}`, 'error');
        } else {
            showStatus('Row deleted successfully!');
            loadTableRows(tableId);
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Delete table
async function deleteTable(tableId) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this table and all its rows?')) {
        return;
    }

    try {
        // Delete rows first
        await supabaseClient
            .from('table_rows')
            .delete()
            .eq('table_id', tableId);

        // Delete table
        const { error } = await supabaseClient
            .from('tables')
            .delete()
            .eq('id', tableId);

        if (error) {
            showStatus(`Error deleting table: ${error.message}`, 'error');
        } else {
            showStatus('Table deleted successfully!');
            loadTables();
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Initialize app
window.onload = function() {
    loadSettings();
};

// Close modals when clicking outside
window.onclick = function(event) {
    const createModal = document.getElementById('createModal');
    const settingsModal = document.getElementById('settingsModal');
    const editModal = document.getElementById('editModal');
    
    if (event.target === createModal) {
        closeCreateModal();
    }
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
    if (event.target === editModal) {
        closeEditModal();
    }
};
