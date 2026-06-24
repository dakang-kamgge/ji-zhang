const App = (() => {
    const PAGES = ['record', 'stats', 'settings'];
    const PAGE_TITLES = {
        record: '记账',
        stats: '统计',
        settings: '设置'
    };

    let currentPage = 'record';
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;

    function init() {
        // 绑定底部导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                switchPage(btn.dataset.page);
            });
        });

        // 绑定滑动手势
        initSwipe();

        // 初始化各模块
        RecordModule.init();
        StatsModule.init();
        SettingsModule.init();
    }

    function initSwipe() {
        const container = document.getElementById('app');

        container.addEventListener('touchstart', (e) => {
            // 弹窗打开时不触发滑动
            if (document.querySelector('.modal:not(.hidden)')) return;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
            isSwiping = false;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!touchStartTime) return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            // 水平滑动距离大于垂直时，标记为滑动中
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
                isSwiping = true;
            }
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (!touchStartTime) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const dt = Date.now() - touchStartTime;

            touchStartTime = 0;

            // 判断有效滑动：水平距离>60px，水平>垂直，时间<500ms
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
                const idx = PAGES.indexOf(currentPage);
                if (dx < 0 && idx < PAGES.length - 1) {
                    switchPage(PAGES[idx + 1]);
                } else if (dx > 0 && idx > 0) {
                    switchPage(PAGES[idx - 1]);
                }
            }
        }, { passive: true });
    }

    function switchPage(pageName) {
        if (pageName === currentPage) return;
        if (switchPage._animating) return;
        switchPage._animating = true;

        const oldPage = document.getElementById('page-' + currentPage);
        const newPage = document.getElementById('page-' + pageName);

        // 切换导航高亮
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === pageName);
        });

        // 更新标题
        document.getElementById('page-title').textContent = PAGE_TITLES[pageName] || '记账';

        // 1) 旧页面瞬间隐藏（无动画，不闪）
        oldPage.classList.remove('active');

        // 2) 新页面淡入
        newPage.classList.add('fade-in');

        currentPage = pageName;

        if (pageName === 'stats') {
            StatsModule.refresh();
        }

        // 动画结束后清理
        newPage.addEventListener('animationend', function handler() {
            newPage.classList.remove('fade-in');
            newPage.classList.add('active');
            newPage.removeEventListener('animationend', handler);
            switchPage._animating = false;
        });
    }
    switchPage._animating = false;

    // 自定义确认弹窗，返回 Promise<boolean>
    function showConfirm(message) {
        return new Promise(resolve => {
            const modal = document.getElementById('modal-confirm');
            const msg = document.getElementById('confirm-message');
            const btnYes = document.getElementById('btn-confirm-yes');
            const btnNo = document.getElementById('btn-confirm-no');
            const overlay = modal.querySelector('.modal-overlay');

            msg.textContent = message;
            modal.classList.remove('hidden');

            function close(result) {
                modal.classList.add('hidden');
                btnYes.removeEventListener('click', onYes);
                btnNo.removeEventListener('click', onNo);
                overlay.removeEventListener('click', onNo);
                resolve(result);
            }
            function onYes() { close(true); }
            function onNo() { close(false); }

            btnYes.addEventListener('click', onYes);
            btnNo.addEventListener('click', onNo);
            overlay.addEventListener('click', onNo);
        });
    }

    // 自定义提示弹窗，返回 Promise<void>
    function showAlert(message) {
        return new Promise(resolve => {
            const modal = document.getElementById('modal-alert');
            const msg = document.getElementById('alert-message');
            const btnOk = document.getElementById('btn-alert-ok');
            const overlay = modal.querySelector('.modal-overlay');

            msg.textContent = message;
            modal.classList.remove('hidden');

            function close() {
                modal.classList.add('hidden');
                btnOk.removeEventListener('click', close);
                overlay.removeEventListener('click', close);
                resolve();
            }

            btnOk.addEventListener('click', close);
            overlay.addEventListener('click', close);
        });
    }

    // 暴露给全局
    window.showConfirm = showConfirm;
    window.showAlert = showAlert;

    return { init };
})();

// 页面加载后启动
document.addEventListener('DOMContentLoaded', App.init);
