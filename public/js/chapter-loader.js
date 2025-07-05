document.addEventListener('DOMContentLoaded', () => {
    const dynamicChapterContent = document.getElementById('dynamic-chapter-content');
    const prevButton = document.getElementById('prev-chapter-btn');
    const nextButton = document.getElementById('next-chapter-btn');
    const listChapterButton = document.getElementById('list-chapter-btn');
    const chapterModal = document.getElementById('chapter-modal');
    const closeModalButton = document.getElementById('close-modal-btn');
    const modalChapterList = document.getElementById('modal-chapter-list');
    const progressBar = document.querySelector('.progress-bar');

    let currentChapterNumber = 1;
    let totalChapters = 0; // Sẽ được truyền từ HTML
    let storyBasePath = ''; // Sẽ được truyền từ HTML, ví dụ: 'legnaxe_part1'

    // Hàm tải nội dung chương từ JSON
    async function fetchChapterContent(storyPath, chapterNum, lang) {
        let chapterFileName = `chapter_${String(chapterNum).padStart(2, '0')}.json`;
        if (chapterNum === totalChapters) { // Assuming the last chapter is the epilogue
            chapterFileName = 'epilogue.json';
        }

        const filePath = `/data/novels/${storyPath}/${chapterFileName}`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Could not load chapter: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching chapter content:', error);
            dynamicChapterContent.innerHTML = `<p class="text-red-600 dark:text-red-400 text-center">Error loading chapter. Please try again later.</p>`;
            return null;
        }
    }

    // Hàm hiển thị nội dung chương
    function renderChapter(chapterData, lang) {
        if (!chapterData) return;

        const titleKey = `title_${lang}`;
        const contentKey = `content_${lang}`;

        dynamicChapterContent.innerHTML = `
            <h3 class="text-2xl sm:text-3xl font-semibold mb-6 mt-4 text-black dark:text-white border-b pb-3 border-gray-200 dark:border-gray-700">
                ${chapterData[titleKey]}
            </h3>
            <div class="prose prose-lg dark:prose-invert max-w-none">
                ${chapterData[contentKey]}
            </div>
        `;
        // Update the document title
        document.title = `${chapterData[titleKey]} - LEGNAXE`;

        // Scroll to the top of the chapter content after loading
        const storyContentWrapper = document.querySelector('.story-content-wrapper');
        if (storyContentWrapper) {
            window.scrollTo({
                top: storyContentWrapper.offsetTop - (document.getElementById('navbar')?.offsetHeight || 0) - 20,
                behavior: 'smooth'
            });
        }
    }

    // Hàm cập nhật trạng thái nút điều hướng
    function updateNavigationButtons() {
        prevButton.disabled = currentChapterNumber <= 1;
        nextButton.disabled = currentChapterNumber >= totalChapters;

        // Highlight current chapter in modal list
        modalChapterList.querySelectorAll('.modal-chapter-link').forEach(link => {
            const chapterId = link.dataset.chapterId;
            if (chapterId === `chapter-${currentChapterNumber}` || (chapterId === 'epilogue' && currentChapterNumber === totalChapters)) {
                link.classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-700', 'dark:text-blue-200');
            } else {
                link.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'text-blue-700', 'dark:text-blue-200');
            }
        });
    }

    // Hàm điều hướng đến một chương cụ thể
    async function navigateToChapter(chapterNum) {
        const lang = document.documentElement.lang; // Get current language from HTML tag
        const chapterData = await fetchChapterContent(storyBasePath, chapterNum, lang);
        if (chapterData) {
            currentChapterNumber = chapterNum;
            renderChapter(chapterData, lang);
            updateNavigationButtons();
            window.location.hash = chapterData.chapter_id; // Update URL hash
            updateProgressBar(); // Update progress bar after content is rendered
        }
    }

    // Hàm cập nhật thanh tiến độ đọc
    function updateProgressBar() {
        const chapterContent = dynamicChapterContent.querySelector('.prose');
        if (!chapterContent) {
            progressBar.style.width = '0%';
            return;
        }

        const chapterTop = chapterContent.getBoundingClientRect().top;
        const chapterHeight = chapterContent.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollPosition = window.pageYOffset;

        // Calculate progress based on how much of the chapter is visible
        let progress = 0;
        if (chapterHeight > 0) {
            const visibleHeight = Math.min(windowHeight, chapterHeight - chapterTop);
            if (visibleHeight > 0) {
                progress = (visibleHeight / chapterHeight) * 100;
            }
        }
        
        // Ensure progress doesn't exceed 100% or go below 0%
        progress = Math.min(100, Math.max(0, progress));
        progressBar.style.width = `${progress}%`;
    }

    // Khởi tạo Chapter Loader
    window.initializeChapterLoader = function(path, total) {
        storyBasePath = path;
        totalChapters = total;

        // Lấy chương từ URL hash hoặc mặc định là chương 1
        const hash = window.location.hash.substring(1);
        let initialChapter = 1;
        if (hash) {
            const match = hash.match(/chapter-(\d+)/);
            if (match && parseInt(match[1]) <= totalChapters) {
                initialChapter = parseInt(match[1]);
            } else if (hash === 'epilogue') {
                initialChapter = totalChapters; // Map epilogue to the last chapter number
            }
        }
        navigateToChapter(initialChapter);

        // Event listeners cho nút điều hướng
        prevButton?.addEventListener('click', () => {
            if (currentChapterNumber > 1) {
                navigateToChapter(currentChapterNumber - 1);
            }
        });

        nextButton?.addEventListener('click', () => {
            if (currentChapterNumber < totalChapters) {
                navigateToChapter(currentChapterNumber + 1);
            }
        });

        // Event listeners cho modal danh sách chương
        listChapterButton?.addEventListener('click', () => {
            chapterModal.style.display = 'flex';
            setTimeout(() => {
                chapterModal.classList.add('modal-active');
            }, 10);
            document.body.style.overflow = 'hidden'; // Prevent scrolling body when modal is open
        });

        closeModalButton?.addEventListener('click', closeModal);

        chapterModal?.addEventListener('click', (event) => {
            if (event.target === chapterModal) {
                closeModal();
            }
        });

        function closeModal() {
            chapterModal.classList.remove('modal-active');
            setTimeout(() => {
                if (!chapterModal.classList.contains('modal-active')) {
                    chapterModal.style.display = 'none';
                }
            }, 300);
            document.body.style.overflow = ''; // Restore body scrolling
        }

        modalChapterList.querySelectorAll('.modal-chapter-link').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const chapterId = link.getAttribute('data-chapter-id');
                let targetChapterNum;
                if (chapterId === 'epilogue') {
                    targetChapterNum = totalChapters;
                } else {
                    targetChapterNum = parseInt(chapterId.replace('chapter-', ''));
                }
                
                if (!isNaN(targetChapterNum) && targetChapterNum >= 1 && targetChapterNum <= totalChapters) {
                    navigateToChapter(targetChapterNum);
                }
                closeModal();
            });
        });

        // Update progress bar on scroll and resize
        window.addEventListener('scroll', updateProgressBar);
        window.addEventListener('resize', updateProgressBar);

        // Handle hashchange for direct chapter links
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            let targetChapter = 1;
            if (hash) {
                const match = hash.match(/chapter-(\d+)/);
                if (match) {
                    targetChapter = parseInt(match[1]);
                } else if (hash === 'epilogue') {
                    targetChapter = totalChapters;
                }
            }
            if (targetChapter !== currentChapterNumber) {
                navigateToChapter(targetChapter);
            }
        });

        // Initial update of navigation buttons and progress bar
        updateNavigationButtons();
        updateProgressBar();
    };

    // Font size controls (existing logic, ensure it targets dynamic content)
    // The font size logic is already set up to use CSS variables, which apply globally.
    // The `prose` class and `chapter h3` styles use `calc(X * var(--font-size-multiplier)) !important;`
    // This means they will automatically adapt to the font size multiplier set on the body.
    // So, no specific changes are needed here for dynamic content.

});
