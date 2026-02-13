// Global variables
let supabaseClient = null;
let tables = [];
let currentEditRow = null;
let currentEditTable = null;
let currentManagementTable = null;

// script.js

const toggleBtn = document.getElementById('dark-mode-toggle');

// Load saved preference (if any) when the page starts
const savedPreference = localStorage.getItem('darkMode');
if (savedPreference === 'true') {
  document.body.classList.add('dark-mode');
}

// Click handler – toggle the class and store the new state
toggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark); // persist across reloads
});

// Load settings from localStorage
function loadSettings() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    
    if (url && key) {
        try {
            supabaseClient = supabase.createClient(url, key);
            updateConnectionStatus(true);
            const btn = document.getElementById('createTableBtn');
            if (btn) btn.disabled = false;
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
    const dotEl = document.getElementById('connectionDot');
    if (!dotEl) return;
    
    if (connected) {
        dotEl.className = 'connection-dot connected';
    } else {
        dotEl.className = 'connection-dot disconnected';
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
        const btn = document.getElementById('createTableBtn');
        if (btn) btn.disabled = false;
        
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

    const tableName = document.getElementById('tableName').value.trim().toLowerCase().replace(/\s+/g, '_');
    const columnInputs = document.querySelectorAll('.columns-input');
    const columns = Array.from(columnInputs)
        .map(input => input.value.trim().toLowerCase().replace(/\s+/g, '_'))
        .filter(col => col !== '');

    if (!tableName) {
        showStatus('Please enter a table name', 'error');
        return;
    }

    if (columns.length === 0) {
        showStatus('Please add at least one column', 'error');
        return;
    }

    // Validate table name
    if (!/^[a-z][a-z0-9_]*$/.test(tableName)) {
        showStatus('Table name must start with a letter and contain only lowercase letters, numbers, and underscores', 'error');
        return;
    }

    // Validate column names
    for (const col of columns) {
        if (!/^[a-z][a-z0-9_]*$/.test(col)) {
            showStatus(`Column "${col}" is invalid. Use only lowercase letters, numbers, and underscores`, 'error');
            return;
        }
    }

    try {
        // Build CREATE TABLE SQL
        const columnDefs = columns.map(col => `${col} TEXT`).join(', ');
        const sql = `
            CREATE TABLE ${tableName} (
                id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                ${columnDefs},
                created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
        `;

        const { error } = await supabaseClient.rpc('execute_sql', { sql_query: sql });

        if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                showStatus('Please create the execute_sql function. See README.', 'error');
                alert(`You need to create the execute_sql function in Supabase:\n\nCREATE OR REPLACE FUNCTION execute_sql(sql_query text)\nRETURNS void AS $$\nBEGIN\n  EXECUTE sql_query;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;`);
            } else {
                showStatus(`Error creating table: ${error.message}`, 'error');
            }
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

// Load all tables from Supabase
async function loadTables() {
    if (!supabaseClient) {
        return;
    }

    try {
        // Query the information_schema to get all user tables
        const { data, error } = await supabaseClient.rpc('get_user_tables', {});

        if (error) {
            // If the function doesn't exist, show instructions
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                showStatus('Please set up the database function. See README for instructions.', 'warning');
                document.getElementById('tablesContainer').innerHTML = `
                    <div class="setup-required">
                        <h2>Database Setup Required</h2>
                        <p>You need to create a function in Supabase to list tables.</p>
                        <p>Go to Supabase SQL Editor and run:</p>
                        <pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">
CREATE OR REPLACE FUNCTION get_user_tables()
RETURNS TABLE(table_name text, columns jsonb) AS $$    
BEGIN
  RETURN QUERY
  SELECT
    t.table_name::text,
    jsonb_agg(
      jsonb_build_object(
        'column_name', c.column_name,
        'data_type', c.data_type
      ) ORDER BY c.ordinal_position
    ) as columns
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name
  ORDER BY t.table_name;
END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;</pre>
                        <button class="submit-btn" onclick="loadTables()" style="margin-top: 20px;">Retry After Setup</button>
                    </div>
                `;
                return;
            }
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
        container.innerHTML = '<div class="no-tables">No tables found. Click "Create New Table" to get started!</div>';
        return;
    }

    container.innerHTML = '';
    tables.forEach(table => {
        const tableDiv = createTableElement(table);
        container.appendChild(tableDiv);
        loadTableData(table.table_name);
    });
}

// Create table element
function createTableElement(table) {
    const tableDiv = document.createElement('div');
    tableDiv.className = 'table-container';
    tableDiv.id = `table-${table.table_name}`;

    tableDiv.innerHTML = `
        <div class="table-header">
            <h2 class="table-title">${table.table_name}</h2>
            <button class="edit-table-btn" onclick="openTableManagementModal('${table.table_name}')">Edit</button>
        </div>
        
        <div class="data-table-wrapper" id="table-data-${table.table_name}">
            Loading...
        </div>
    `;

    return tableDiv;
}

// Table Management Modal
function openTableManagementModal(tableName) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    currentManagementTable = tableName;
    document.getElementById('tableManagementTitle').textContent = `Manage Table: ${tableName}`;
    
    // Get table structure
    const table = tables.find(t => t.table_name === tableName);
    const columns = table.columns
        .map(col => col.column_name)
        .filter(name => name !== 'id' && name !== 'created_at');

    // Build add row form
    const addRowContainer = document.getElementById('addRowFormContainer');
    let formHtml = '<div class="add-row-inline">';
    columns.forEach(col => {
        formHtml += `<input type="text" placeholder="${col}" data-column="${col}" class="inline-input">`;
    });
    formHtml += '<button class="submit-btn" onclick="addRowFromManagement()" style="margin-top: 10px;">Add Row</button></div>';
    addRowContainer.innerHTML = formHtml;

    // Build delete column dropdown
    const deleteColumnSelect = document.getElementById('deleteColumnSelect');
    deleteColumnSelect.innerHTML = '<option value="">Select column to delete</option>';
    columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        deleteColumnSelect.appendChild(option);
    });

    document.getElementById('tableManagementModal').style.display = 'block';
}

function closeTableManagementModal() {
    document.getElementById('tableManagementModal').style.display = 'none';
    currentManagementTable = null;
}

// Add row from management modal
async function addRowFromManagement() {
    if (!supabaseClient || !currentManagementTable) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    const inputs = document.querySelectorAll('#addRowFormContainer input');
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
            .from(currentManagementTable)
            .insert([data]);

        if (error) {
            showStatus(`Error adding row: ${error.message}`, 'error');
        } else {
            showStatus('Row added successfully!');
            inputs.forEach(input => input.value = '');
            loadTableData(currentManagementTable);
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Add column
async function addColumn() {
    if (!supabaseClient || !currentManagementTable) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    const columnName = document.getElementById('newColumnName').value.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (!columnName) {
        showStatus('Please enter a column name', 'error');
        return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(columnName)) {
        showStatus('Column name must start with a letter and contain only lowercase letters, numbers, and underscores', 'error');
        return;
    }

    try {
        const sql = `ALTER TABLE ${currentManagementTable} ADD COLUMN ${columnName} TEXT;`;
        const { error } = await supabaseClient.rpc('execute_sql', { sql_query: sql });

        if (error) {
            showStatus(`Error adding column: ${error.message}`, 'error');
        } else {
            showStatus('Column added successfully!');
            document.getElementById('newColumnName').value = '';
            closeTableManagementModal();
            loadTables();
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Delete column
async function deleteColumn() {
    if (!supabaseClient || !currentManagementTable) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    const columnName = document.getElementById('deleteColumnSelect').value;
    
    if (!columnName) {
        showStatus('Please select a column to delete', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to delete the column "${columnName}"? This will permanently remove all data in this column!`)) {
        return;
    }

    try {
        const sql = `ALTER TABLE ${currentManagementTable} DROP COLUMN ${columnName};`;
        const { error } = await supabaseClient.rpc('execute_sql', { sql_query: sql });

        if (error) {
            showStatus(`Error deleting column: ${error.message}`, 'error');
        } else {
            showStatus('Column deleted successfully!');
            closeTableManagementModal();
            loadTables();
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Delete table from management modal
async function deleteTableFromManagement() {
    if (!supabaseClient || !currentManagementTable) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    if (!confirm(`Are you sure you want to DELETE the entire table "${currentManagementTable}" and all its data? This cannot be undone!`)) {
        return;
    }

    try {
        const sql = `DROP TABLE IF EXISTS ${currentManagementTable};`;
        const { error } = await supabaseClient.rpc('execute_sql', { sql_query: sql });

        if (error) {
            showStatus(`Error deleting table: ${error.message}`, 'error');
        } else {
            showStatus('Table deleted successfully!');
            closeTableManagementModal();
            loadTables();
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Load data for a specific table
async function loadTableData(tableName, limit = 10) {
    if (!supabaseClient) {
        return;
    }

    try {
        // Get total count first (to know if "Show more" is needed)
        const { count, error: countError } = await supabaseClient
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (countError) {
            document.getElementById(`table-data-${tableName}`).innerHTML = '<div class="empty-table">Error loading count</div>';
            return;
        }

        // Fetch limited rows
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            document.getElementById(`table-data-${tableName}`).innerHTML = '<div class="empty-table">Error loading data</div>';
            return;
        }

        const tableContainer = document.getElementById(`table-data-${tableName}`);

        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<div class="empty-table">No rows yet. Click "Edit" to add data!</div>';
            return;
        }

        // Get visible columns (exclude id & created_at)
        const table = tables.find(t => t.table_name === tableName);
        const columns = table.columns
            .map(col => col.column_name)
            .filter(name => name !== 'id' && name !== 'created_at');

        // Build table HTML
        let tableHtml = '<table class="data-table"><thead><tr>';
        columns.forEach(col => {
            tableHtml += `<th>${col}</th>`;
        });
        tableHtml += '<th>Actions</th></tr></thead><tbody>';

        data.forEach(row => {
            tableHtml += '<tr>';
            columns.forEach(col => {
                const value = row[col] || '';
                tableHtml += `<td>${value}</td>`;
            });
            tableHtml += `<td>
                <button class="action-btn" onclick="openEditRowModal(${row.id}, '${tableName}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteRow(${row.id}, '${tableName}')">Delete</button>
            </td></tr>`;
        });

        tableHtml += '</tbody></table>';

        // Show more button if needed
        if (count > limit) {
            tableHtml += `
                <div style="text-align: center; margin: 15px 0;">
                    <button class="add-row-btn" 
                            onclick="loadTableData('${tableName}', ${limit + 20})">
                        Show more (${count - limit} remaining)
                    </button>
                </div>`;
        }

        tableContainer.innerHTML = tableHtml;
    } catch (error) {
        document.getElementById(`table-data-${tableName}`).innerHTML = '<div class="empty-table">Connection error</div>';
        console.error('Error:', error);
    }
}

// Edit Row Modal functions
function openEditRowModal(rowId, tableName) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    currentEditRow = rowId;
    currentEditTable = tableName;

    // Load row data
    loadRowForEdit(rowId, tableName);
}

async function loadRowForEdit(rowId, tableName) {
    try {
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('id', rowId)
            .single();

        if (error) {
            showStatus(`Error loading row: ${error.message}`, 'error');
            return;
        }

        const table = tables.find(t => t.table_name === tableName);
        const columns = table.columns
            .map(col => col.column_name)
            .filter(name => name !== 'id' && name !== 'created_at');
        
        const formContainer = document.getElementById('editFormContainer');
        
        // Build edit form
        let formHtml = '';
        columns.forEach(col => {
            const value = data[col] || '';
            formHtml += `
                <div class="form-group">
                    <label for="edit-${col}">${col}:</label>
                    <input type="text" id="edit-${col}" value="${value}" data-column="${col}">
                </div>
            `;
        });

        formContainer.innerHTML = formHtml;
        document.getElementById('editRowModal').style.display = 'block';
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

function closeEditRowModal() {
    document.getElementById('editRowModal').style.display = 'none';
    currentEditRow = null;
    currentEditTable = null;
}

async function saveEdit() {
    if (!supabaseClient || !currentEditRow || !currentEditTable) {
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
            .from(currentEditTable)
            .update(data)
            .eq('id', currentEditRow);

        if (error) {
            showStatus(`Error updating row: ${error.message}`, 'error');
        } else {
            showStatus('Row updated successfully!');
            closeEditRowModal();
            loadTableData(currentEditTable);
        }
    } catch (error) {
        showStatus('Connection error', 'error');
        console.error('Error:', error);
    }
}

// Delete row
async function deleteRow(rowId, tableName) {
    if (!supabaseClient) {
        showStatus('Not connected to Supabase', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this row?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from(tableName)
            .delete()
            .eq('id', rowId);

        if (error) {
            showStatus(`Error deleting row: ${error.message}`, 'error');
        } else {
            showStatus('Row deleted successfully!');
            loadTableData(tableName);
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
    const editRowModal = document.getElementById('editRowModal');
    const tableManagementModal = document.getElementById('tableManagementModal');
    
    if (event.target === createModal) {
        closeCreateModal();
    }
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
    if (event.target === editRowModal) {
        closeEditRowModal();
    }
    if (event.target === tableManagementModal) {
        closeTableManagementModal();
    }
};
