const SettingsModule = (() => {
    let editingCatType = null;
    let editingCatIndex = null;

    function init() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const theme = btn.dataset.theme;
                document.documentElement.setAttribute('data-theme', theme);
                const settings = Storage.getSettings();
                settings.theme = theme;
                Storage.saveSettings(settings);
                if (typeof StatsModule !== 'undefined') StatsModule.refresh();
            });
        });

        document.querySelectorAll('.btn-add-category').forEach(btn => {
            btn.addEventListener('click', () => openCategoryModal(btn.dataset.type, null));
        });

        document.getElementById('btn-cat-save').addEventListener('click', saveCategory);
        document.getElementById('btn-cat-cancel').addEventListener('click', closeCategoryModal);
        document.getElementById('modal-category').querySelector('.modal-overlay').addEventListener('click', closeCategoryModal);

        document.getElementById('btn-export').addEventListener('click', exportData);
        document.getElementById('btn-import').addEventListener('click', () => document.getElementById('file-import').click());
        document.getElementById('file-import').addEventListener('change', importData);

        applyTheme();
        renderCategories();
    }

    function applyTheme() {
        const settings = Storage.getSettings();
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === settings.theme);
        });
    }

    function renderCategories() {
        renderCategoryList('expense');
        renderCategoryList('income');
    }

    function renderCategoryList(type) {
        const listId = type === 'expense' ? 'expense-category-list' : 'income-category-list';
        const list = document.getElementById(listId);
        const cats = Storage.getCategories(type);

        list.innerHTML = cats.map((cat, i) => `
            <div class="category-manage-item">
                <div class="category-manage-icon" style="background:${cat.color}">${cat.icon || '🏷️'}</div>
                <span class="category-manage-name">${cat.name}</span>
                <div class="category-manage-actions">
                    <button class="btn-small" onclick="SettingsModule.editCategory('${type}', ${i})">编辑</button>
                    <button class="btn-small danger" onclick="SettingsModule.removeCategory('${type}', ${i})">删除</button>
                </div>
            </div>
        `).join('');
    }

    function openCategoryModal(type, index) {
        editingCatType = type;
        editingCatIndex = index;

        const title = document.getElementById('category-modal-title');
        const nameInput = document.getElementById('category-name');
        const colorInput = document.getElementById('category-color');
        const iconInput = document.getElementById('category-icon');

        if (index !== null) {
            const cats = Storage.getCategories(type);
            const cat = cats[index];
            title.textContent = '编辑分类';
            nameInput.value = cat.name;
            colorInput.value = cat.color;
            iconInput.value = cat.icon || '';
        } else {
            title.textContent = '添加分类';
            nameInput.value = '';
            colorInput.value = type === 'expense' ? '#E86B4A' : '#4CAF6A';
            iconInput.value = '';
        }

        document.getElementById('modal-category').classList.remove('hidden');
    }

    function saveCategory() {
        const name = document.getElementById('category-name').value.trim();
        const color = document.getElementById('category-color').value;
        const icon = document.getElementById('category-icon').value.trim() || '🏷️';

        if (!name) {
            showAlert('请输入分类名称');
            return;
        }

        if (editingCatIndex !== null) {
            Storage.updateCategory(editingCatType, editingCatIndex, { name, color, icon });
        } else {
            Storage.addCategory(editingCatType, { name, color, icon });
        }

        closeCategoryModal();
        renderCategories();
        if (typeof RecordModule !== 'undefined') RecordModule.refresh();
    }

    function closeCategoryModal() {
        document.getElementById('modal-category').classList.add('hidden');
        editingCatType = null;
        editingCatIndex = null;
    }

    function editCategory(type, index) {
        openCategoryModal(type, index);
    }

    async function removeCategory(type, index) {
        const cats = Storage.getCategories(type);
        const cat = cats[index];
        const yes = await showConfirm(`确定删除分类"${cat.name}"？`);
        if (yes) {
            Storage.deleteCategory(type, index);
            renderCategories();
            if (typeof RecordModule !== 'undefined') RecordModule.refresh();
        }
    }

    function exportData() {
        const data = Storage.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `记账备份_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.records && !data.settings) {
                    showAlert('无效的备份文件');
                    return;
                }
                const yes = await showConfirm('恢复备份将覆盖当前数据，确定继续？');
                if (yes) {
                    Storage.importData(data);
                    applyTheme();
                    renderCategories();
                    if (typeof RecordModule !== 'undefined') RecordModule.refresh();
                    if (typeof StatsModule !== 'undefined') StatsModule.refresh();
                    showAlert('备份恢复成功');
                }
            } catch {
                showAlert('文件格式错误');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    return { init, editCategory, removeCategory };
})();
