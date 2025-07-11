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
    let currentLanguage = ''; // Biến mới để lưu trữ ngôn ngữ hiện tại

    // Bắt đầu: Chức năng chuyển đổi chế độ Sáng/Tối
    const themeToggleBtn = document.getElementById('theme-toggle-btn'); // Giả định có một nút với ID này trong HTML

    function setupThemeToggle() {
        // Kiểm tra tùy chọn chủ đề đã lưu trong localStorage
        const savedTheme = localStorage.getItem('theme');
        // Nếu có chủ đề đã lưu, sử dụng nó. Nếu không, kiểm tra tùy chọn hệ thống của người dùng.
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark'); // Áp dụng lớp 'dark' cho phần tử html
        } else {
            document.documentElement.classList.remove('dark'); // Đảm bảo lớp 'dark' không có
        }

        // Thêm trình lắng nghe sự kiện cho nút chuyển đổi
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark'); // Chuyển sang chế độ sáng
                    localStorage.setItem('theme', 'light'); // Lưu tùy chọn vào localStorage
                } else {
                    document.documentElement.classList.add('dark'); // Chuyển sang chế độ tối
                    localStorage.setItem('theme', 'dark'); // Lưu tùy chọn vào localStorage
                }
            });
        }
    }

    // Gọi hàm thiết lập chủ đề khi DOM được tải
    setupThemeToggle();
    // Kết thúc: Chức năng chuyển đổi chế độ Sáng/Tối

    // Hàm tải nội dung chương từ JSON
    async function fetchChapterContent(storyPath, chapterNum) {
        let chapterFileName;
        // Logic để xác định tên file JSON:
        // Nếu chapterNum là chương cuối cùng (tức là Epilogue), tải epilogue.json
        // Ngược lại, tải chapter_XX.json
        if (chapterNum === totalChapters) {
            chapterFileName = `chapter_Epilogue.json`; // Tên file JSON cho Epilogue, không có hậu tố ngôn ngữ
        } else {
            chapterFileName = `chapter_${String(chapterNum).padStart(2, '0')}.json`; // Không có hậu tố ngôn ngữ
        }

        const filePath = `/data/novels/${storyPath}/${chapterFileName}`;
        console.log(`Attempting to fetch chapter: ${filePath}`); // Debug log
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                // Cung cấp thông báo lỗi chi tiết hơn
                const errorMessage = `Could not load chapter: ${chapterFileName}. Status: ${response.status} - ${response.statusText}. Please ensure the file exists and is accessible.`;
                console.error(`Fetch error: ${errorMessage}`); // Debug log
                throw new Error(errorMessage);
            }
            const data = await response.json();
            console.log(`Successfully fetched chapter data for ${chapterFileName}:`, data); // Debug log
            return data;
        } catch (error) {
            console.error('Error fetching chapter content:', error);
            dynamicChapterContent.innerHTML = `<p class="text-red-600 dark:text-red-400 text-center">Lỗi khi tải chương: ${error.message}. Vui lòng kiểm tra lại cấu trúc tệp JSON hoặc đường dẫn.</p>`;
            return null;
        }
    }

    // Hàm hiển thị nội dung chương
    function renderChapter(chapterData, lang) {
        if (!chapterData) {
            console.warn('No chapter data to render.'); // Debug log
            return;
        }

        // Sử dụng ngôn ngữ được truyền vào để chọn đúng trường tiêu đề và nội dung
        const titleKey = `title_${lang}`;
        const contentKey = `content_${lang}`;

        // Kiểm tra xem các trường ngôn ngữ có tồn tại không
        const chapterTitle = chapterData[titleKey] || chapterData.title_en || 'Chapter Title Not Found';
        const chapterContent = chapterData[contentKey] || chapterData.content_en || '<p>Chapter content not found for this language.</p>';


        dynamicChapterContent.innerHTML = `
            <h3 class="text-2xl sm:text-3xl font-semibold mb-6 mt-4 text-black dark:text-white border-b pb-3 border-gray-200 dark:border-gray-700">
                ${chapterTitle}
            </h3>
            <div class="prose prose-lg dark:prose-invert max-w-none">
                ${chapterContent}
            </div>
        `;
        // Cập nhật tiêu đề tài liệu
        document.title = `${chapterTitle} - LEGNAXE`;
        console.log(`Rendered chapter ${currentChapterNumber}: ${chapterTitle}`); // Debug log

        // Cuộn lên đầu nội dung chương sau khi tải
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
        console.log(`Navigation buttons updated: Prev disabled=${prevButton.disabled}, Next disabled=${nextButton.disabled}`); // Debug log

        // Đánh dấu chương hiện tại trong danh sách modal
        modalChapterList.querySelectorAll('.modal-chapter-link').forEach(link => {
            const chapterId = link.dataset.chapterId;
            let linkChapterNum;
            if (chapterId === 'epilogue') {
                linkChapterNum = totalChapters; // Map epilogue to the last chapter number
            } else {
                linkChapterNum = parseInt(chapterId.replace('chapter-', ''));
            }

            if (linkChapterNum === currentChapterNumber) {
                link.classList.add('bg-blue-100', 'dark:bg-blue-900', 'text-blue-700', 'dark:text-blue-200');
            } else {
                link.classList.remove('bg-blue-100', 'dark:bg-blue-900', 'text-blue-700', 'dark:text-blue-200');
            }
        });
    }

    // Hàm điều hướng đến một chương cụ thể
    async function navigateToChapter(chapterNum, lang) {
        console.log(`Navigating to chapter: ${chapterNum}, Language: ${lang}`); // Debug log
        const chapterData = await fetchChapterContent(storyBasePath, chapterNum); // Không truyền lang vào đây nữa
        if (chapterData) {
            currentChapterNumber = chapterNum;
            renderChapter(chapterData, lang); // Truyền lang vào renderChapter để chọn nội dung
            updateNavigationButtons();
            // Cập nhật URL hash, sử dụng chapter_id từ dữ liệu JSON
            let newHash = `chapter-${chapterNum}`;
            if (currentChapterNumber === totalChapters) {
                newHash = 'epilogue'; // Đảm bảo hash là 'epilogue' cho chương cuối cùng
            }
            window.location.hash = newHash;
            updateProgressBar(); // Cập nhật thanh tiến độ sau khi nội dung được hiển thị
        }
    }

    // Hàm cập nhật thanh tiến độ đọc
    function updateProgressBar() {
        const chapterContent = dynamicChapterContent.querySelector('.prose');
        if (!chapterContent) {
            progressBar.style.width = '0%';
            return;
        }

        const chapterRect = chapterContent.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate how much of the chapter content is visible in the viewport
        const visibleTop = Math.max(0, chapterRect.top);
        const visibleBottom = Math.min(viewportHeight, chapterRect.bottom);
        const visibleHeight = visibleBottom - visibleTop;

        let progress = 0;
        if (chapterRect.height > 0) {
            // Calculate progress based on the scrolled portion of the chapter
            const scrolledHeight = Math.max(0, -chapterRect.top); // How much of the chapter is above the viewport top
            progress = (scrolledHeight / (chapterRect.height - viewportHeight + 100)) * 100; // +100 to prevent division by zero if chapter is very short
        }
        
        // Ensure progress doesn't exceed 100% or go below 0%
        progress = Math.min(100, Math.max(0, progress));
        progressBar.style.width = `${progress}%`;
        // console.log(`Progress: ${progress.toFixed(2)}%`); // Debug log
    }

    // Khởi tạo Chapter Loader
    window.initializeChapterLoader = function(path, total, lang) { // Đã thêm lại tham số 'total'
        storyBasePath = path;
        totalChapters = total; // Sử dụng tham số 'total' được truyền vào
        currentLanguage = lang; // Lưu trữ ngôn ngữ hiện tại
        console.log(`Chapter Loader initialized: Story Path = ${storyBasePath}, Total Chapters = ${totalChapters}, Language = ${currentLanguage}`); // Debug log

        // Xóa danh sách chương cũ trong modal và tạo mới
        modalChapterList.innerHTML = '';
        for (let i = 1; i <= totalChapters; i++) { // Lặp dựa trên totalChapters
            const chapterNum = i;
            const chapterId = (chapterNum === totalChapters) ? 'epilogue' : `chapter-${chapterNum}`;
            const chapterLink = document.createElement('a');
            chapterLink.href = `#${chapterId}`;
            chapterLink.classList.add(
                'modal-chapter-link',
                'block',
                'py-2',
                'px-4',
                'rounded-lg',
                'hover:bg-gray-100',
                'dark:hover:bg-gray-700',
                'transition-colors',
                'duration-200',
                'text-black',
                'dark:text-white'
            );
            // Tên chương sẽ là "Chương X" vì không có mảng chapterTitles cứng
            chapterLink.textContent = `Chương ${chapterNum}`;
            modalChapterList.appendChild(chapterLink);
        }


        // Lấy chương từ URL hash hoặc mặc định là chương 1
        const hash = window.location.hash.substring(1);
        let initialChapter = 1;
        if (hash) {
            const match = hash.match(/chapter-(\d+)/);
            if (match && parseInt(match[1]) >= 1 && parseInt(match[1]) < totalChapters) { // chapter-1 to chapter-(totalChapters-1)
                initialChapter = parseInt(match[1]);
            } else if (hash === 'epilogue') {
                initialChapter = totalChapters; // Map epilogue to the last chapter number
            }
        }
        navigateToChapter(initialChapter, currentLanguage); // Truyền ngôn ngữ khi khởi tạo

        // Event listeners cho nút điều hướng
        prevButton?.addEventListener('click', () => {
            console.log('Previous button clicked'); // Debug log
            if (currentChapterNumber > 1) {
                navigateToChapter(currentChapterNumber - 1, currentLanguage); // Truyền ngôn ngữ
            }
        });

        nextButton?.addEventListener('click', () => {
            console.log('Next button clicked'); // Debug log
            if (currentChapterNumber < totalChapters) {
                navigateToChapter(currentChapterNumber + 1, currentLanguage); // Truyền ngôn ngữ
            }
        });

        // Event listeners cho modal danh sách chương
        listChapterButton?.addEventListener('click', () => {
            console.log('List Chapters button clicked'); // Debug log
            chapterModal.style.display = 'flex';
            setTimeout(() => {
                chapterModal.classList.add('modal-active');
            }, 10);
            document.body.style.overflow = 'hidden'; // Ngăn cuộn body khi modal mở
            updateNavigationButtons(); // Cập nhật highlight khi modal mở
        });

        closeModalButton?.addEventListener('click', closeModal);

        chapterModal?.addEventListener('click', (event) => {
            if (event.target === chapterModal) {
                closeModal();
            }
        });

        function closeModal() {
            console.log('Closing modal'); // Debug log
            chapterModal.classList.remove('modal-active');
            setTimeout(() => {
                // Đảm bảo display: none chỉ được áp dụng khi transition đã hoàn tất
                if (!chapterModal.classList.contains('modal-active')) {
                    chapterModal.style.display = 'none';
                }
            }, 300); // Phù hợp với transition duration trong CSS
            document.body.style.overflow = ''; // Khôi phục cuộn body
        }

        // Gắn lại event listeners cho các liên kết chương trong modal sau khi chúng được tạo lại
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
                    navigateToChapter(targetChapterNum, currentLanguage); // Truyền ngôn ngữ
                }
                closeModal();
            });
        });

        // Cập nhật thanh tiến độ khi cuộn và thay đổi kích thước cửa sổ
        window.addEventListener('scroll', updateProgressBar);
        window.addEventListener('resize', updateProgressBar);

        // Xử lý thay đổi hash cho các liên kết chương trực tiếp
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
                navigateToChapter(targetChapter, currentLanguage); // Truyền ngôn ngữ
            }
        });

        // Cập nhật ban đầu trạng thái nút điều hướng và thanh tiến độ
        updateNavigationButtons();
        updateProgressBar();
    };
});
// This script is designed to dynamically load and display chapters of a story from JSON files.
