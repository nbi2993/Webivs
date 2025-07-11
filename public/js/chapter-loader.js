document.addEventListener('DOMContentLoaded', () => {
    const dynamicChapterContent = document.getElementById('dynamic-chapter-content');
    const prevButton = document.getElementById('prev-chapter-btn');
    const nextButton = document.getElementById('next-chapter-btn');
    const listChapterButton = document.getElementById('list-chapter-btn'); // Bottom list chapter button
    const listChapterButtonTop = document.getElementById('list-chapter-btn-top'); // Top list chapter button
    const chapterModal = document.getElementById('chapter-modal');
    const closeModalButton = document.getElementById('close-modal-btn');
    const modalChapterList = document.getElementById('modal-chapter-list');
    const progressBar = document.querySelector('.progress-bar');

    let currentChapterNumber = 1;
    let totalChapters = 0; // Will be updated from the chapterTitles array
    let storyBasePath = ''; // Will be passed from HTML, e.g., 'legnaxe_part1'
    let currentLanguage = ''; // New variable to store the current language

    // Start: Dark/Light Mode Toggle Functionality
    const themeToggleBtn = document.getElementById('theme-toggle-btn'); // Assuming there's a button with this ID in HTML

    function setupThemeToggle() {
        // Check saved theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        // If a theme is saved, use it. Otherwise, check the user's system preference.
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark'); // Apply 'dark' class to the html element
        } else {
            document.documentElement.classList.remove('dark'); // Ensure 'dark' class is not present
        }

        // Add event listener for the toggle button
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark'); // Switch to light mode
                    localStorage.setItem('theme', 'light'); // Save preference to localStorage
                } else {
                    document.documentElement.classList.add('dark'); // Switch to dark mode
                    localStorage.setItem('theme', 'dark'); // Save preference to localStorage
                }
            });
        }
    }

    // Call theme setup function when DOM is loaded
    setupThemeToggle();
    // End: Dark/Light Mode Toggle Functionality

    // Define chapter title lists based on provided documents
    // Part 1: The Secret of Great Heaven War (25 chapters + Epilogue)
    const chapterTitlesPart1 = [
        "Bản Hòa Âm Rạn Nứt",
        "Lời Phán Từ Trời",
        "Những Tia Lửa Nổi Loạn",
        "Những Tạo Vật Đầu Tiên",
        "Ánh Sáng Và Bóng Tối",
        "Lời Thì Thầm Của Con Rắn",
        "Sự Rạn Nứt",
        "Sự Ra Đời Của Eve",
        "Những Bóng Tối Thì Thầm",
        "Miếng Nếm Đầu Tiên",
        "Sự Sa Ngã",
        "Sự Ra Đời Đầu Tiên",
        "Vết Nứt Đầu Tiên",
        "Dấu Ấn Của Cain",
        "Di Sản Của Cain",
        "Sự Phán Xét Đầu Tiên",
        "Cửa Lũ Mở Toang",
        "Cuộc Chiến Ánh Sáng Vĩnh Cửu",
        "Những Hạt Giống Của Sự Nổi Loạn",
        "Dư Âm của Những Lựa Chọn",
        "Sự Vỡ Nát của Tấm Màn",
        "Bên Kia Tấm Màn",
        "Sự Thật Bên Kia Tấm Màn",
        "Cái Giá của Ánh Sáng",
        "Phán Quyết và Sự Chia Cắt Vĩnh Viễn",        
        "Khúc Vĩ Thanh: Mưa Sao Băng Linh Hồn" // This is the last chapter for Part 1
    ];

    // Part 2: Heavenly, Human’s Heart (17 chapters)
    const chapterTitlesPart2 = [
        "Lời Từ Biệt Trên Ngai Vàng",
        "Mưa Sao Băng Linh Hồn", // This chapter title seems to overlap with Part 1's Epilogue, need to confirm JSON file structure
        "Giáng Trần & Thiên Đàng Hậu Biến Cố",
        "Tiếng Gọi Của Lòng Trắc Ẩn",
        "Giữa Dòng Người & Góc Khuất Tâm Hồn",
        "Bóng Tối Từ Thiện",
        "Lựa Chọn Trong Màn Đêm",
        "Bước Vào Thế Giới Mới",
        "Những Bài Học Đầu Tiên",
        "Chuyến Đi Đến Los Angeles",
        "Những Cuộc Gặp Gỡ Đầu Tiên",
        "Màn Sương Nghi Hoặc",
        "Bóng Hình Quá Khứ",
        "Lời Đề Nghị Của Ác Quỷ",
        "Tiếng Vọng Từ Thiên Đàng",
        "Quyền Năng Thức Tỉnh",
        "Cuộn Giấy Cổ Xưa",
        "Bài Học Đầu Tiên và Bão Tố Thiên Đàng",
        "Giữa Hai Làn Đạn",
        "Thử Nghiệm Niềm Tin",
        "Lằn Ranh Mong Manh",
        "Tiếng Gọi Bị Chặn",
        "Những Bước Đi Đầu Tiên Trong Bóng Tối",
        "Những Con Đường Trong Bóng Tối",
        "Thăm Dò Vực Thẳm",
        "Nước Cờ Thực Tế",
        "Dự Án Đặc Biệt",
        "Hành Trình Đến Tâm Bão"
    ];

    // Combine all chapters. Needs adjustment if there are multiple story parts.
    // Currently, assume storyBasePath will indicate which part.
    let allChapterTitles = [];

    // Function to fetch chapter content from JSON
    async function fetchChapterContent(storyPath, chapterNum) {
        let chapterFileName;
        // Logic to determine JSON file name:
        // If chapterNum is the last chapter (i.e., Epilogue), load epilogue.json
        // Otherwise, load chapter_XX.json
        if (chapterNum === totalChapters && storyPath === 'legnaxe_part1') { // Only part 1 has an explicit epilogue file
            chapterFileName = `epilogue.json`; // JSON file name for Epilogue, no language suffix
        } else {
            chapterFileName = `chapter_${String(chapterNum).padStart(2, '0')}.json`; // No language suffix
        }

        const filePath = `/data/novels/${storyPath}/${chapterFileName}`;
        console.log(`Attempting to fetch chapter: ${filePath}`); // Debug log
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                // Provide more detailed error message
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

    // Function to render chapter content
    function renderChapter(chapterData, lang) {
        if (!chapterData) {
            console.warn('No chapter data to render.'); // Debug log
            return;
        }

        // Use the passed language to select the correct title and content fields
        const titleKey = `title_${lang}`;
        const contentKey = `content_${lang}`;

        // Check if language fields exist
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
        // Update document title
        document.title = `${chapterTitle} - LEGNAXE`;
        console.log(`Rendered chapter ${currentChapterNumber}: ${chapterTitle}`); // Debug log

        // Scroll to the top of the chapter content after loading
        const storyContentWrapper = document.querySelector('.story-content-wrapper');
        if (storyContentWrapper) {
            window.scrollTo({
                top: storyContentWrapper.offsetTop - (document.getElementById('navbar')?.offsetHeight || 0) - 20,
                behavior: 'smooth'
            });
        }
    }

    // Function to update navigation button states
    function updateNavigationButtons() {
        prevButton.disabled = currentChapterNumber <= 1;
        nextButton.disabled = currentChapterNumber >= totalChapters;
        console.log(`Navigation buttons updated: Prev disabled=${prevButton.disabled}, Next disabled=${nextButton.disabled}`); // Debug log

        // Highlight current chapter in the modal list
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

    // Function to navigate to a specific chapter
    async function navigateToChapter(chapterNum, lang) {
        console.log(`Navigating to chapter: ${chapterNum}, Language: ${lang}`); // Debug log
        const chapterData = await fetchChapterContent(storyBasePath, chapterNum); // Don't pass lang here anymore
        if (chapterData) {
            currentChapterNumber = chapterNum;
            renderChapter(chapterData, lang); // Pass lang to renderChapter to select content
            updateNavigationButtons();
            // Update URL hash, use chapter_id from JSON data
            let newHash = `chapter-${chapterNum}`;
            if (currentChapterNumber === totalChapters && storyBasePath === 'legnaxe_part1') {
                newHash = 'epilogue'; // Ensure hash is 'epilogue' for the last chapter of part 1
            }
            window.location.hash = newHash;
            updateProgressBar(); // Update progress bar after content is displayed
        }
    }

    // Function to update reading progress bar
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

    // Function to close the modal
    function closeModal() {
        console.log('Closing modal'); // Debug log
        chapterModal.classList.remove('modal-active');
        setTimeout(() => {
            // Ensure display: none is applied only after transition completes
            if (!chapterModal.classList.contains('modal-active')) {
                chapterModal.style.display = 'none';
            }
        }, 300); // Matches transition duration in CSS
        document.body.style.overflow = ''; // Restore body scroll
    }

    // Initialize Chapter Loader
    window.initializeChapterLoader = function(path, total, lang) { // Added 'total' parameter again
        storyBasePath = path;
        currentLanguage = lang; // Store current language
        console.log(`Chapter Loader initialized: Story Path = ${storyBasePath}, Total Chapters = ${totalChapters}, Language = ${currentLanguage}`); // Debug log

        // Determine total chapters and chapter title list based on storyBasePath
        if (storyBasePath === 'legnaxe_part1') {
            allChapterTitles = chapterTitlesPart1;
        } else if (storyBasePath === 'legnaxe_part2') {
            allChapterTitles = chapterTitlesPart2;
        } else {
            allChapterTitles = []; // Default if no match
        }
        totalChapters = allChapterTitles.length;


        // Clear old chapter list in modal and create new one
        modalChapterList.innerHTML = '';
        allChapterTitles.forEach((title, index) => {
            const chapterNum = index + 1;
            const chapterId = (chapterNum === totalChapters && storyBasePath === 'legnaxe_part1') ? 'epilogue' : `chapter-${chapterNum}`;
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
            // Use chapter name from allChapterTitles array
            chapterLink.textContent = `${lang === 'vi' ? 'Chương' : 'Chapter'} ${chapterNum}: ${title}`;
            chapterLink.dataset.chapterId = chapterId; // Set data-chapter-id for easy lookup
            modalChapterList.appendChild(chapterLink);
        });


        // Get chapter from URL hash or default to chapter 1
        const hash = window.location.hash.substring(1);
        let initialChapter = 1;
        if (hash) {
            const match = hash.match(/chapter-(\d+)/);
            if (match && parseInt(match[1]) >= 1 && parseInt(match[1]) < totalChapters) { // chapter-1 to chapter-(totalChapters-1)
                initialChapter = parseInt(match[1]);
            } else if (hash === 'epilogue' && storyBasePath === 'legnaxe_part1') {
                initialChapter = totalChapters; // Map epilogue to the last chapter number for part 1
            }
        }
        navigateToChapter(initialChapter, currentLanguage); // Pass language on initialization

        // Event listeners for navigation buttons
        prevButton?.addEventListener('click', () => {
            console.log('Previous button clicked'); // Debug log
            if (currentChapterNumber > 1) {
                navigateToChapter(currentChapterNumber - 1, currentLanguage); // Pass language
            }
        });

        nextButton?.addEventListener('click', () => {
            console.log('Next button clicked'); // Debug log
            if (currentChapterNumber < totalChapters) {
                navigateToChapter(currentChapterNumber + 1, currentLanguage); // Pass language
            }
        });

        // Event listeners for chapter list modal buttons
        listChapterButton?.addEventListener('click', () => {
            console.log('List Chapters button (bottom) clicked'); // Debug log
            chapterModal.style.display = 'flex'; // Ensure it's visible before adding active class
            setTimeout(() => {
                chapterModal.classList.add('modal-active');
            }, 10);
            document.body.style.overflow = 'hidden'; // Prevent body scroll when modal is open
            updateNavigationButtons(); // Update highlight when modal opens
        });

        listChapterButtonTop?.addEventListener('click', () => {
            console.log('List Chapters button (top) clicked'); // Debug log
            chapterModal.style.display = 'flex'; // Ensure it's visible before adding active class
            setTimeout(() => {
                chapterModal.classList.add('modal-active');
            }, 10);
            document.body.style.overflow = 'hidden'; // Prevent body scroll when modal is open
            updateNavigationButtons(); // Update highlight when modal opens
        });

        closeModalButton?.addEventListener('click', closeModal);

        chapterModal?.addEventListener('click', (event) => {
            if (event.target === chapterModal) {
                closeModal();
            }
        });

        // Re-attach event listeners for chapter links in the modal after they are re-created
        // This needs to be done dynamically as links are added to modalChapterList
        // The current implementation in initializeChapterLoader already adds listeners,
        // but if modalChapterList is re-rendered without re-initializing, they might be lost.
        // A better approach is to use event delegation for modalChapterList.
        modalChapterList.addEventListener('click', (event) => {
            const link = event.target.closest('.modal-chapter-link');
            if (link) {
                event.preventDefault();
                const chapterId = link.getAttribute('data-chapter-id');
                let targetChapterNum;
                if (chapterId === 'epilogue') {
                    targetChapterNum = totalChapters;
                } else {
                    targetChapterNum = parseInt(chapterId.replace('chapter-', ''));
                }
                
                if (!isNaN(targetChapterNum) && targetChapterNum >= 1 && targetChapterNum <= totalChapters) {
                    navigateToChapter(targetChapterNum, currentLanguage); // Pass language
                }
                closeModal();
            }
        });

        // Update progress bar on scroll and window resize
        window.addEventListener('scroll', updateProgressBar);
        window.addEventListener('resize', updateProgressBar);

        // Handle hash changes for direct chapter links
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            let targetChapter = 1;
            if (hash) {
                const match = hash.match(/chapter-(\d+)/);
                if (match) {
                    targetChapter = parseInt(match[1]);
                } else if (hash === 'epilogue' && storyBasePath === 'legnaxe_part1') {
                    targetChapter = totalChapters;
                }
            }
            if (targetChapter !== currentChapterNumber) {
                navigateToChapter(targetChapter, currentLanguage); // Pass language
            }
        });

        // Initial update of navigation button states and progress bar
        updateNavigationButtons();
        updateProgressBar();
    };
});
// This script is designed to dynamically load and display chapters of a story from JSON files.
