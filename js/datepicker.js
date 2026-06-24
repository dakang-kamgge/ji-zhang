const DatePicker = (() => {
    let currentDate = new Date();
    let viewYear, viewMonth;
    let selectedDay;
    let hour, minute;
    let targetInputId = null;
    let callback = null;

    const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    function init() {
        document.getElementById('dp-prev').addEventListener('click', () => {
            viewMonth--;
            if (viewMonth < 0) { viewMonth = 11; viewYear--; }
            renderCalendar(true);
        });

        document.getElementById('dp-next').addEventListener('click', () => {
            viewMonth++;
            if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            renderCalendar(true);
        });

        document.getElementById('dp-hour-minus').addEventListener('click', () => {
            hour = (hour + 23) % 24;
            updateTimeDisplay();
        });

        document.getElementById('dp-hour-plus').addEventListener('click', () => {
            hour = (hour + 1) % 24;
            updateTimeDisplay();
        });

        document.getElementById('dp-min-minus').addEventListener('click', () => {
            minute = (minute + 59) % 60;
            updateTimeDisplay();
        });

        document.getElementById('dp-min-plus').addEventListener('click', () => {
            minute = (minute + 1) % 60;
            updateTimeDisplay();
        });

        document.getElementById('dp-today').addEventListener('click', () => {
            const now = new Date();
            viewYear = now.getFullYear();
            viewMonth = now.getMonth();
            selectedDay = now.getDate();
            hour = now.getHours();
            minute = now.getMinutes();
            renderCalendar();
            updateTimeDisplay();
        });

        document.getElementById('dp-cancel').addEventListener('click', close);

        document.getElementById('dp-ok').addEventListener('click', () => {
            const val = formatValue();
            if (targetInputId) {
                document.getElementById(targetInputId).value = val;
            }
            // 更新所有关联的显示框
            document.querySelectorAll('.date-display').forEach(el => {
                if (el.dataset.target === targetInputId) {
                    el.textContent = formatDisplay(val);
                }
            });
            close();
            if (callback) callback(val);
        });

        document.getElementById('modal-date').querySelector('.modal-overlay').addEventListener('click', close);

        // 绑定所有日期显示框的点击
        document.querySelectorAll('.date-display').forEach(el => {
            el.addEventListener('click', () => {
                open(el.dataset.target);
            });
        });
    }

    function open(inputId, cb) {
        targetInputId = inputId;
        callback = cb || null;

        const hiddenInput = document.getElementById(inputId);
        const val = hiddenInput.value;

        if (val) {
            const parts = val.split('T');
            const dateParts = parts[0].split('-');
            viewYear = parseInt(dateParts[0]);
            viewMonth = parseInt(dateParts[1]) - 1;
            selectedDay = parseInt(dateParts[2]);
            if (parts[1]) {
                const timeParts = parts[1].split(':');
                hour = parseInt(timeParts[0]);
                minute = parseInt(timeParts[1]);
            } else {
                const now = new Date();
                hour = now.getHours();
                minute = now.getMinutes();
            }
        } else {
            const now = new Date();
            viewYear = now.getFullYear();
            viewMonth = now.getMonth();
            selectedDay = now.getDate();
            hour = now.getHours();
            minute = now.getMinutes();
        }

        renderCalendar();
        updateTimeDisplay();
        document.getElementById('modal-date').classList.remove('hidden');
    }

    function close() {
        document.getElementById('modal-date').classList.add('hidden');
        targetInputId = null;
        callback = null;
    }

    function renderCalendar(animate) {
        document.getElementById('dp-title').textContent = `${viewYear}年${MONTH_NAMES[viewMonth]}`;

        const container = document.getElementById('dp-days');
        container.innerHTML = '';

        // 淡入动画
        if (animate) {
            container.classList.remove('animating');
            void container.offsetWidth;
            container.classList.add('animating');
            container.addEventListener('animationend', function handler() {
                container.classList.remove('animating');
                container.removeEventListener('animationend', handler);
            });
        }

        // 本月第一天是星期几（0=日，调整为周一起始）
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        // 本月天数
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        // 上月天数
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        const today = new Date();
        const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

        // 上月补位
        for (let i = offset - 1; i >= 0; i--) {
            const btn = createDayBtn(daysInPrevMonth - i, true);
            container.appendChild(btn);
        }

        // 本月日期
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday = isCurrentMonth && d === today.getDate();
            const isSelected = d === selectedDay;
            const btn = createDayBtn(d, false, isToday, isSelected);
            btn.addEventListener('click', () => {
                selectedDay = d;
                renderCalendar();
            });
            container.appendChild(btn);
        }

        // 下月补位（补满 6 行 = 42 格）
        const totalCells = container.children.length;
        const remaining = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        for (let d = 1; d <= remaining; d++) {
            const btn = createDayBtn(d, true);
            container.appendChild(btn);
        }
    }

    function createDayBtn(day, isOther, isToday, isSelected) {
        const btn = document.createElement('button');
        btn.className = 'dp-day';
        btn.textContent = day;
        if (isOther) btn.classList.add('other-month');
        if (isToday) btn.classList.add('today');
        if (isSelected) btn.classList.add('selected');
        return btn;
    }

    function updateTimeDisplay() {
        document.getElementById('dp-hour').textContent = String(hour).padStart(2, '0');
        document.getElementById('dp-min').textContent = String(minute).padStart(2, '0');
    }

    function formatValue() {
        const pad = n => String(n).padStart(2, '0');
        return `${viewYear}-${pad(viewMonth + 1)}-${pad(selectedDay)}T${pad(hour)}:${pad(minute)}`;
    }

    function formatDisplay(val) {
        if (!val) return '请选择日期时间';
        const parts = val.split('T');
        const dateParts = parts[0].split('-');
        const d = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
        const time = parts[1] ? parts[1].substring(0, 5) : '';
        return `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日 ${weekdays[d.getDay()]} ${time}`;
    }

    return { init, open, formatDisplay };
})();

document.addEventListener('DOMContentLoaded', DatePicker.init);
