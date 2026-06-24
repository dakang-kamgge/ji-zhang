const Storage = (() => {
    const KEYS = {
        RECORDS: 'jizhang_records',
        SETTINGS: 'jizhang_settings'
    };

    const DEFAULT_EXPENSE_CATS = [
        { name: '餐饮', color: '#E86B4A', icon: '🍜' },
        { name: '交通', color: '#5B9BD5', icon: '🚗' },
        { name: '购物', color: '#F0B849', icon: '🛒' },
        { name: '居家', color: '#6BBF8A', icon: '🏠' },
        { name: '娱乐', color: '#B47ED8', icon: '🎮' },
        { name: '医疗', color: '#E88B6B', icon: '💊' },
        { name: '教育', color: '#7EB5D6', icon: '📚' },
        { name: '其他', color: '#A89B8C', icon: '📦' }
    ];

    const DEFAULT_INCOME_CATS = [
        { name: '工资', color: '#4CAF6A', icon: '💰' },
        { name: '兼职', color: '#6BBF8A', icon: '💼' },
        { name: '红包', color: '#E06060', icon: '🧧' },
        { name: '其他', color: '#5B9BD5', icon: '💵' }
    ];

    // 为旧数据补充 icon 字段（不覆盖用户已有数据）
    function upgradeCategories(saved, defaults) {
        const savedNames = new Set(saved.map(c => c.name));
        // 给已有的补 icon
        saved.forEach(c => {
            if (!c.icon) {
                const def = defaults.find(d => d.name === c.name);
                c.icon = def ? def.icon : '🏷️';
            }
        });
        // 补上用户删掉的默认分类（可选：不补，尊重用户删除）
        return saved;
    }

    function getRecords() {
        try {
            const data = localStorage.getItem(KEYS.RECORDS);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function saveRecords(records) {
        localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
    }

    function addRecord(record) {
        const records = getRecords();
        record.id = Date.now().toString();
        records.unshift(record);
        saveRecords(records);
        return record;
    }

    function updateRecord(id, updates) {
        const records = getRecords();
        const idx = records.findIndex(r => r.id === id);
        if (idx !== -1) {
            records[idx] = { ...records[idx], ...updates };
            saveRecords(records);
            return records[idx];
        }
        return null;
    }

    function deleteRecord(id) {
        const records = getRecords().filter(r => r.id !== id);
        saveRecords(records);
    }

    function getSettings() {
        try {
            const data = localStorage.getItem(KEYS.SETTINGS);
            if (data) {
                const settings = JSON.parse(data);
                // 旧数据升级：补充 icon 字段
                settings.expenseCategories = upgradeCategories(
                    settings.expenseCategories || [...DEFAULT_EXPENSE_CATS],
                    DEFAULT_EXPENSE_CATS
                );
                settings.incomeCategories = upgradeCategories(
                    settings.incomeCategories || [...DEFAULT_INCOME_CATS],
                    DEFAULT_INCOME_CATS
                );
                return settings;
            }
        } catch {}
        return {
            theme: 'light',
            expenseCategories: [...DEFAULT_EXPENSE_CATS],
            incomeCategories: [...DEFAULT_INCOME_CATS]
        };
    }

    function saveSettings(settings) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    }

    function getCategories(type) {
        const settings = getSettings();
        return type === 'expense' ? settings.expenseCategories : settings.incomeCategories;
    }

    function addCategory(type, category) {
        const settings = getSettings();
        const list = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
        settings[list].push(category);
        saveSettings(settings);
    }

    function updateCategory(type, index, updates) {
        const settings = getSettings();
        const list = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
        if (settings[list][index]) {
            settings[list][index] = { ...settings[list][index], ...updates };
            saveSettings(settings);
        }
    }

    function deleteCategory(type, index) {
        const settings = getSettings();
        const list = type === 'expense' ? 'expenseCategories' : 'incomeCategories';
        settings[list].splice(index, 1);
        saveSettings(settings);
    }

    function exportData() {
        return {
            records: getRecords(),
            settings: getSettings(),
            exportDate: new Date().toISOString()
        };
    }

    function importData(data) {
        if (data.records) saveRecords(data.records);
        if (data.settings) saveSettings(data.settings);
    }

    return {
        getRecords, addRecord, updateRecord, deleteRecord,
        getSettings, saveSettings,
        getCategories, addCategory, updateCategory, deleteCategory,
        exportData, importData
    };
})();
