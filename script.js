        // Global variables
        let supabaseClient = null;
        let lists = [];

        // Load settings from localStorage
        function loadSettings() {
            const url = localStorage.getItem('supabase_url');
            const key = localStorage.getItem('supabase_key');
            
            if (url && key) {
                try {
                    supabaseClient = supabase.createClient(url, key);
                    updateConnectionStatus(true);
                    document.getElementById('createListBtn').disabled = false;
                    loadLists();
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
                document.getElementById('createListBtn').disabled = false;
                
                showStatus('Settings saved! Loading your lists...');
                closeSettingsModal();
                
                // Load lists
                loadLists();
            } catch (error) {
                showStatus('Error connecting to Supabase. Check your credentials.', 'error');
                console.error('Error:', error);
            }
        }

        // Create List Modal functions
        function openCreateModal() {
            if (!supabaseClient) {
                showStatus('Please configure Supabase settings first', 'warning');
                openSettingsModal();
                return;
            }
            document.getElementById('createModal').style.display = 'block';
            document.getElementById('listName').focus();
        }

        function closeCreateModal() {
            document.getElementById('createModal').style.display = 'none';
            document.getElementById('listName').value = '';
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

        // Create new list
        async function createList() {
            if (!supabaseClient) {
                showStatus('Not connected to Supabase', 'error');
                return;
            }

            const listName = document.getElementById('listName').value.trim();
            const columnInputs = document.querySelectorAll('.columns-input');
            const columns = Array.from(columnInputs)
                .map(input => input.value.trim())
                .filter(col => col !== '');

            if (!listName) {
                showStatus('Please enter a list name', 'error');
                return;
            }

            if (columns.length === 0) {
                showStatus('Please add at least one column', 'error');
                return;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('lists')
                    .insert([{
                        name: listName,
                        columns: columns
                    }])
                    .select();

                if (error) {
                    showStatus(`Error creating list: ${error.message}`, 'error');
                } else {
                    showStatus(`List "${listName}" created successfully!`);
                    closeCreateModal();
                    loadLists();
                }
            } catch (error) {
                showStatus('Connection error', 'error');
                console.error('Error:', error);
            }
        }

        // Load all lists
        async function loadLists() {
            if (!supabaseClient) {
                return;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('lists')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (error) {
                    showStatus(`Error loading lists: ${error.message}`, 'error');
                    return;
                }

                lists = data || [];
                renderLists();
            } catch (error) {
                showStatus('Connection error', 'error');
                console.error('Error:', error);
            }
        }

        // Render all lists
        function renderLists() {
            const container = document.getElementById('listsContainer');
            
            if (lists.length === 0) {
                container.innerHTML = '<div class="no-lists">No lists created yet. Click "Create New List" to get started!</div>';
                return;
            }

            container.innerHTML = '';
            lists.forEach(list => {
                const listDiv = createListElement(list);
                container.appendChild(listDiv);
                loadListItems(list.id);
            });
        }

        // Create list element
        function createListElement(list) {
            const listDiv = document.createElement('div');
            listDiv.className = 'list-container';
            listDiv.id = `list-${list.id}`;

            const formInputs = list.columns.map(col => 
                `<input type="text" placeholder="${col}" data-column="${col}">`
            ).join('');

            listDiv.innerHTML = `
                <div class="list-header">
                    <h2 class="list-title">${list.name}</h2>
                    <button class="delete-list-btn" onclick="deleteList(${list.id})">Delete List</button>
                </div>
                
                <div class="add-item-form">
                    ${formInputs}
                    <button class="add-item-btn" onclick="addItem(${list.id})">Add</button>
                </div>
                
                <div class="items-list" id="items-${list.id}">
                    Loading...
                </div>
            `;

            // Add Enter key functionality to inputs
            const inputs = listDiv.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        addItem(list.id);
                    }
                });
            });

            return listDiv;
        }

        // Add item to list
        async function addItem(listId) {
            if (!supabaseClient) {
                showStatus('Not connected to Supabase', 'error');
                return;
            }

            const listDiv = document.getElementById(`list-${listId}`);
            const inputs = listDiv.querySelectorAll('.add-item-form input');
            
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
                    .from('list_items')
                    .insert([{
                        list_id: listId,
                        data: data
                    }]);

                if (error) {
                    showStatus(`Error adding item: ${error.message}`, 'error');
                } else {
                    inputs.forEach(input => input.value = '');
                    loadListItems(listId);
                }
            } catch (error) {
                showStatus('Connection error', 'error');
                console.error('Error:', error);
            }
        }

        // Load items for a specific list
        async function loadListItems(listId) {
            if (!supabaseClient) {
                return;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('list_items')
                    .select('*')
                    .eq('list_id', listId)
                    .order('created_at', { ascending: true });

                if (error) {
                    document.getElementById(`items-${listId}`).innerHTML = 'Error loading items';
                    return;
                }

                const itemsContainer = document.getElementById(`items-${listId}`);
                
                if (!data || data.length === 0) {
                    itemsContainer.innerHTML = 'No items yet. Add some items above!';
                    return;
                }

                const itemsHtml = data.map(item => {
                    const itemData = Object.entries(item.data)
                        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
                        .join(' | ');
                    return `<div class="item">${itemData}</div>`;
                }).join('');

                itemsContainer.innerHTML = itemsHtml;
            } catch (error) {
                document.getElementById(`items-${listId}`).innerHTML = 'Connection error';
                console.error('Error:', error);
            }
        }

        // Delete list
        async function deleteList(listId) {
            if (!supabaseClient) {
                showStatus('Not connected to Supabase', 'error');
                return;
            }

            if (!confirm('Are you sure you want to delete this list and all its items?')) {
                return;
            }

            try {
                await supabaseClient
                    .from('list_items')
                    .delete()
                    .eq('list_id', listId);

                const { error } = await supabaseClient
                    .from('lists')
                    .delete()
                    .eq('id', listId);

                if (error) {
                    showStatus(`Error deleting list: ${error.message}`, 'error');
                } else {
                    showStatus('List deleted successfully!');
                    loadLists();
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
            
            if (event.target === createModal) {
                closeCreateModal();
            }
            if (event.target === settingsModal) {
                closeSettingsModal();
            }
        };
