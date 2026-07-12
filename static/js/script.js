/* =============================================================
   BRS AutoAtelier – анимации появления (если нужны) и лайтбокс
   ============================================================= */

(function () {
    'use strict';

    // -------------------------------------------------
    // 1️⃣ Анимации появления элементов при скролле
    //    (оставляем, если они нужны; если не нужны – закомментировать блок)
    // -------------------------------------------------
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    // Каскадная задержка
                    const delay = Array.from(
                        entry.target.parentElement?.children || []
                    ).indexOf(entry.target) * 100;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        // Элементы, которым добавляем класс .visible при появлении в viewport
        document.querySelectorAll('.service-card, .gallery-item').forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback для старых браузеров – сразу показываем
        document.querySelectorAll('.service-card, .gallery-item').forEach(el => {
            el.classList.add('visible');
        });
    }

    // -------------------------------------------------
    // 2️⃣ Лайтбокс (полностью оставляем)
    // -------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        const viewerOverlay = document.getElementById('viewer-overlay');
        const viewerImg     = document.getElementById('viewer-image');
        const viewerCounter = document.getElementById('viewer-counter');
        const prevBtn       = document.getElementById('viewer-prev');
        const nextBtn       = document.getElementById('viewer-next');
        const closeBtn      = document.getElementById('viewer-close');

        if (!viewerOverlay || !viewerImg) {
            console.error('Lightbox: элементы viewer не найдены');
            return;
        }

        let images = [];
        let current = 0;
        let isAnimating = false;
        let savedOverflow = '';

        const buildImageList = () => {
            const nodes = document.querySelectorAll('.gallery-item[data-index] img');
            images = Array.from(nodes)
                .map(img => ({
                    src: img.getAttribute('src'),
                    index: Number(img.parentElement.dataset.index)
                }))
                .filter(item => item.src && !Number.isNaN(item.index))
                .sort((a, b) => a.index - b.index);
        };

        const updateCounter = () => {
            if (!viewerCounter) return;
            const total = images.length;
            const cur   = current + 1;
            viewerCounter.textContent =
                `${String(cur).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
        };

        const showImage = (index) => {
            if (images.length === 0) return;
            const len = images.length;
            current = ((index % len) + len) % len; // циклическая прокрутка
            viewerImg.src = images[current].src;
            viewerImg.alt = `Изображение ${current + 1} из ${len}`;
            viewerImg.classList.remove('loaded');

            if (viewerImg.complete) {
                viewerImg.classList.add('loaded');
            } else {
                viewerImg.onload = () => viewerImg.classList.add('loaded');
            }

            updateCounter();
        };

        const openViewer = (startIndex = 0) => {
            if (isAnimating) return;
            isAnimating = true;
            buildImageList();
            if (images.length === 0) return;

            // startIndex приходит 1‑based из data‑index → переводим в 0‑based
            showImage(startIndex - 1);
            viewerOverlay.classList.add('active');
            savedOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            setTimeout(() => { isAnimating = false; }, 200);
        };

        const closeViewer = () => {
            if (isAnimating) return;
            isAnimating = true;
            viewerOverlay.classList.remove('active');
            document.body.style.overflow = savedOverflow;
            setTimeout(() => { isAnimating = false; }, 200);
        };

        const showNext = () => { if (images.length) showImage(current + 1); };
        const showPrev = () => { if (images.length) showImage(current - 1); };

        // Открытие по клику на миниатюру
        document.body.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item[data-index]');
            if (!item) return;
            e.preventDefault();
            openViewer(Number(item.dataset.index));
        });

        // Кнопки навигации
        prevBtn?.addEventListener('click', showPrev);
        nextBtn?.addEventListener('click', showNext);
        closeBtn?.addEventListener('click', closeViewer);

        // Закрытие по клику на затемнённый фон
        viewerOverlay.addEventListener('click', (e) => {
            if (e.target === viewerOverlay) closeViewer();
        });

        // Управление клавиатурой
        document.addEventListener('keydown', (e) => {
            if (!viewerOverlay.classList.contains('active')) return;
            switch (e.key) {
                case 'Escape':     e.preventDefault(); closeViewer(); break;
                case 'ArrowRight': e.preventDefault(); showNext(); break;
                case 'ArrowLeft':  e.preventDefault(); showPrev(); break;
            }
        });

        // Свайп на touch‑устройствах
        let touchStartX = 0;
        viewerOverlay.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0]?.screenX ?? 0;
        }, { passive: true });

        viewerOverlay.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0]?.screenX ?? 0;
            const diff = endX - touchStartX;
            if (Math.abs(diff) < 40) return;
            if (diff > 0) showPrev();
            else showNext();
        }, { passive: true });
    });
})();
