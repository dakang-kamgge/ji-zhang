const StatsModule = (() => {
    let currentRange = 'today';
    let pieChart = null;
    let lineChart = null;

    function init() {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentRange = btn.dataset.range;
                refresh();
            });
        });
        refresh();
    }

    function getDateRange() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let start, end;

        switch (currentRange) {
            case 'today':
                start = today;
                end = new Date(today.getTime() + 86400000);
                break;
            case 'week':
                const day = today.getDay() || 7;
                start = new Date(today.getTime() - (day - 1) * 86400000);
                end = new Date(start.getTime() + 7 * 86400000);
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear() + 1, 0, 1);
                break;
        }
        return { start, end };
    }

    function filterRecords() {
        const records = Storage.getRecords();
        const { start, end } = getDateRange();
        return records.filter(r => {
            const d = parseLocalDate(r.date);
            return d >= start && d < end;
        });
    }

    function parseLocalDate(dateStr) {
        // 兼容 "2024-01-15" 和 "2024-01-15T14:30" 两种格式
        const datePart = dateStr.split('T')[0];
        const parts = datePart.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }

    function refresh() {
        const records = filterRecords();
        updateSummary(records);
        updatePieChart(records);
        updateLineChart(records);
    }

    function updateSummary(records) {
        const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
        const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
        const balance = totalIncome - totalExpense;

        document.getElementById('stat-total-expense').textContent = `¥${totalExpense.toFixed(2)}`;
        document.getElementById('stat-total-income').textContent = `¥${totalIncome.toFixed(2)}`;
        document.getElementById('stat-balance').textContent = `¥${balance.toFixed(2)}`;
    }

    function updatePieChart(records) {
        const canvas = document.getElementById('chart-pie');
        const emptyMsg = document.getElementById('pie-empty');
        const expenses = records.filter(r => r.type === 'expense');

        if (expenses.length === 0) {
            canvas.classList.add('hidden');
            emptyMsg.classList.remove('hidden');
            if (pieChart) { pieChart.destroy(); pieChart = null; }
            return;
        }

        canvas.classList.remove('hidden');
        emptyMsg.classList.add('hidden');

        const catMap = {};
        expenses.forEach(r => {
            catMap[r.category] = (catMap[r.category] || 0) + r.amount;
        });

        const cats = Storage.getCategories('expense');
        const labels = Object.keys(catMap);
        const data = Object.values(catMap);
        const colors = labels.map(name => {
            const cat = cats.find(c => c.name === name);
            return cat ? cat.color : '#999';
        });

        if (pieChart) pieChart.destroy();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const chartBorder = isDark ? '#272220' : '#FFFCF6';
        const textPrimary = isDark ? '#F0E6D6' : '#3D3022';
        const textSecondary = isDark ? '#B8A88E' : '#7A6B58';
        const gridColor = isDark ? '#3D352C' : '#F0E4CE';

        pieChart = new Chart(canvas, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: chartBorder
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textPrimary,
                            padding: 12,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = data.reduce((s, v) => s + v, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return `${ctx.label}: ¥${ctx.parsed.toFixed(2)} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateLineChart(records) {
        const canvas = document.getElementById('chart-line');
        const emptyMsg = document.getElementById('line-empty');
        const expenses = records.filter(r => r.type === 'expense');

        if (expenses.length === 0) {
            canvas.classList.add('hidden');
            emptyMsg.classList.remove('hidden');
            if (lineChart) { lineChart.destroy(); lineChart = null; }
            return;
        }

        canvas.classList.remove('hidden');
        emptyMsg.classList.add('hidden');

        const { start, end } = getDateRange();
        const dayMap = {};

        if (currentRange === 'year') {
            for (let m = 0; m < 12; m++) {
                dayMap[`${m + 1}月`] = 0;
            }
            expenses.forEach(r => {
                const m = parseLocalDate(r.date).getMonth();
                dayMap[`${m + 1}月`] += r.amount;
            });
        } else {
            const d = new Date(start);
            while (d < end) {
                const key = `${d.getMonth() + 1}/${d.getDate()}`;
                dayMap[key] = 0;
                d.setDate(d.getDate() + 1);
            }
            expenses.forEach(r => {
                const rd = parseLocalDate(r.date);
                const key = `${rd.getMonth() + 1}/${rd.getDate()}`;
                if (dayMap[key] !== undefined) dayMap[key] += r.amount;
            });
        }

        const labels = Object.keys(dayMap);
        const data = Object.values(dayMap);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textSecondary = isDark ? '#B8A88E' : '#7A6B58';
        const gridColor = isDark ? '#3D352C' : '#F0E4CE';

        if (lineChart) lineChart.destroy();

        lineChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: '支出',
                    data,
                    borderColor: '#D4893A',
                    backgroundColor: 'rgba(212, 137, 58, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#D4893A'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `¥${ctx.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textSecondary, font: { size: 11 } },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: {
                            color: textSecondary,
                            callback: v => '¥' + v
                        },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    return { init, refresh };
})();
