const RecordModule = (() => {
    let currentType = 'expense';
    let selectedCategory = null;
    let editingId = null;

    function init() {
        setDefaultDateTime();

        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentType = btn.dataset.type;
                selectedCategory = null;
                renderCategories();
            });
        });

        document.getElementById('btn-save').addEventListener('click', (e) => {
            createRipple(e);
            saveRecord();
        });

        document.getElementById('btn-edit-save').addEventListener('click', saveEdit);
        document.getElementById('btn-edit-cancel').addEventListener('click', closeEditModal);
        document.getElementById('modal-edit').querySelector('.modal-overlay').addEventListener('click', closeEditModal);

        renderCategories();
        renderRecent();
    }

    function setDefaultDateTime() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const val = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
        document.getElementById('input-date').value = val;
        document.getElementById('input-date-display').textContent = DatePicker.formatDisplay(val);
    }

    function renderCategories() {
        const grid = document.getElementById('category-grid');
        const cats = Storage.getCategories(currentType);
        grid.innerHTML = cats.map((cat, i) => `
            <div class="category-item${selectedCategory === cat.name ? ' selected' : ''}" data-name="${cat.name}">
                <div class="category-icon" style="background:${cat.color}">${cat.icon || '🏷️'}</div>
                <span class="category-name">${cat.name}</span>
            </div>
        `).join('');

        grid.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                grid.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedCategory = item.dataset.name;
            });
        });
    }

    function saveRecord() {
        const amount = parseFloat(document.getElementById('input-amount').value);
        if (!amount || amount <= 0) {
            showAlert('请输入有效金额');
            return;
        }
        if (!selectedCategory) {
            showAlert('请选择分类');
            return;
        }

        const dateVal = document.getElementById('input-date').value;

        const record = {
            type: currentType,
            amount: amount,
            category: selectedCategory,
            date: dateVal,
            note: document.getElementById('input-note').value.trim()
        };

        Storage.addRecord(record);

        document.getElementById('input-amount').value = '';
        document.getElementById('input-note').value = '';
        selectedCategory = null;
        setDefaultDateTime();
        renderCategories();
        renderRecent();
        flashButton(document.getElementById('btn-save'));
    }

    function formatRecordDate(dateStr) {
        if (!dateStr) return '';
        // 兼容旧数据 "2024-01-15" 和新格式 "2024-01-15T14:30"
        if (dateStr.length <= 10) return dateStr;
        return dateStr.replace('T', ' ').substring(0, 16);
    }

    function renderRecent() {
        const list = document.getElementById('recent-list');
        const records = Storage.getRecords().slice(0, 10);

        if (records.length === 0) {
            list.innerHTML = '<div style="text-align:center;color:var(--text-hint);padding:20px;">暂无记录</div>';
            return;
        }

        list.innerHTML = records.map(rec => {
            const cats = Storage.getCategories(rec.type);
            const cat = cats.find(c => c.name === rec.category);
            const color = cat ? cat.color : '#999';
            const icon = cat ? cat.icon : '🏷️';
            const sign = rec.type === 'expense' ? '-' : '+';
            return `
                <div class="record-item" data-id="${rec.id}">
                    <div class="record-icon" style="background:${color}">${icon}</div>
                    <div class="record-info">
                        <div class="record-category">${rec.category}</div>
                        <div class="record-meta">${formatRecordDate(rec.date)}${rec.note ? ' · ' + rec.note : ''}</div>
                    </div>
                    <span class="record-amount ${rec.type}">${sign}¥${rec.amount.toFixed(2)}</span>
                    <button class="record-delete" data-id="${rec.id}">删除</button>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.record-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('record-delete')) return;
                openEditModal(item.dataset.id);
            });
        });

        list.querySelectorAll('.record-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const yes = await showConfirm('确定删除这条记录？');
                if (yes) {
                    Storage.deleteRecord(btn.dataset.id);
                    renderRecent();
                    if (typeof StatsModule !== 'undefined') StatsModule.refresh();
                }
            });
        });
    }

    function openEditModal(id) {
        const records = Storage.getRecords();
        const rec = records.find(r => r.id === id);
        if (!rec) return;

        editingId = id;
        document.getElementById('edit-amount').value = rec.amount;
        // 兼容旧数据 "2024-01-15" → "2024-01-15T00:00"
        const dateVal = rec.date && rec.date.length <= 10 ? rec.date + 'T00:00' : rec.date;
        document.getElementById('edit-date').value = dateVal || '';
        document.getElementById('edit-date-display').textContent = DatePicker.formatDisplay(dateVal);
        document.getElementById('edit-note').value = rec.note || '';

        renderEditCategories(rec.type, rec.category);
        document.getElementById('modal-edit').classList.remove('hidden');
    }

    function renderEditCategories(type, selected) {
        const grid = document.getElementById('edit-category-grid');
        const cats = Storage.getCategories(type);
        grid.innerHTML = cats.map(cat => `
            <div class="category-item${selected === cat.name ? ' selected' : ''}" data-name="${cat.name}">
                <div class="category-icon" style="background:${cat.color}">${cat.icon || '🏷️'}</div>
                <span class="category-name">${cat.name}</span>
            </div>
        `).join('');

        grid.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                grid.querySelectorAll('.category-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
    }

    function saveEdit() {
        const amount = parseFloat(document.getElementById('edit-amount').value);
        if (!amount || amount <= 0) {
            showAlert('请输入有效金额');
            return;
        }
        const selected = document.getElementById('edit-category-grid').querySelector('.category-item.selected');
        if (!selected) {
            showAlert('请选择分类');
            return;
        }

        Storage.updateRecord(editingId, {
            amount: amount,
            category: selected.dataset.name,
            date: document.getElementById('edit-date').value,
            note: document.getElementById('edit-note').value.trim()
        });

        closeEditModal();
        renderRecent();
        if (typeof StatsModule !== 'undefined') StatsModule.refresh();
    }

    function closeEditModal() {
        document.getElementById('modal-edit').classList.add('hidden');
        editingId = null;
    }

    function createRipple(e) {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    function flashButton(btn) {
        btn.classList.remove('flash');
        void btn.offsetWidth; // 触发 reflow 以重新播放动画
        btn.classList.add('flash');
    }

    function refresh() {
        renderCategories();
        renderRecent();
    }

    return { init, refresh };
})();
