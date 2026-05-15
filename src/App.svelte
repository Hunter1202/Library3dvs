<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition'

    let imgData = {};
    let loading = true;
    let isDarkMode = true;
    let mainData = {};
    let oldData = {};
    let loadingOld = false;
    let expandedCategories = {};
    let scrollContainers = {};
    let selectedImg = null; // Lưu ảnh đang được phóng to
    let currentIdx = 0;
    let currentCate = null;
    let currentView = 'home';

    const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
    const CACHE_KEY = "img_cache";
    const CACHE_TIME = 60 * 60 * 1000; // Cache trong 1 tiếng

    const categories = ["OUTDOOR", "LIVING", "OFFICE", "BED", "DINING"];
    const oldCategories = ["OUTDOOR", "LIVING", "STUDY", "BED", "DINING"];

    async function fetchSource(type) {
        try {
            const res = await fetch(`${API_URL}?type=${type}`);
            return await res.json();
        } catch (e) {
            console.error(`Fetch ${type} error:`, e);
            return {};
        }
    }

    onMount(async () => {
        // 1. Kiểm tra Cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TIME) {
                mainData = data;
                imgData = mainData;
                loading = false;
            }
        }

        // 2. Fetch mới dữ liệu Main (Stale-while-revalidate)
        const freshData = await fetchSource('main');
        if (Object.keys(freshData).length > 0) {
            mainData = freshData;
            if (currentView === 'home') imgData = mainData;
            loading = false;

            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: freshData,
                timestamp: Date.now()
            }));
        }
    });

    // Hàm chuyển view - Xử lý Lazy Loading cho Old Data
    async function switchView(view) {
        currentView = view;
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (view === 'home') {
            imgData = mainData;
        } else {
            // Nếu chưa có dữ liệu Old thì mới fetch
            if (Object.keys(oldData).length === 0) {
                loadingOld = true;
                oldData = await fetchSource('old');
                loadingOld = false;
            }
            imgData = oldData;
        }
    }

    const scroll = (node, direction) => {
        const distance = 400;
        node.scrollBy({ left: direction * distance, behavior: 'smooth' });
    };
    const toggleTheme = () => isDarkMode = !isDarkMode;
    const scrollToCategory = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    function toggleExpand(category) {
        expandedCategories[category] = !expandedCategories[category];
        if (expandedCategories[category]) {
            // Khi mở rộng
            scrollContainers[category] = 50;
        }
    }
    function loadMore(category) {
        scrollContainers[category] += 100;
    }
    function infiniteScroll(node, callback) {
        const observer = new IntersectionObserver((entries) => {
            const firstEntry = entries[0];
            if (firstEntry.isIntersecting) {
                callback();
            }
        }, {
            rootMargin: '200px'
        });
        observer.observe(node);
        return {
            destroy() {
                observer.unobserve(node);
            }
        };
    }

    function openFullImage(img, category, index) {
        selectedImg = img;
        currentIdx = index;
        currentCate = category;
    }
    function nextImage(e) {
        e.stopPropagation(); // Ngăn đóng lightbox khi bấm nút
        const imgs = imgData[currentCate];
        if (currentIdx < imgs.length - 1) {
            currentIdx++;
            selectedImg = imgs[currentIdx];
        } else {
            currentIdx = 0;
            selectedImg = imgs[currentIdx];
        }
    }
    function prevImage(e) {
        e.stopPropagation();
        const imgs = imgData[currentCate];
        if (currentIdx > 0) {
            currentIdx--;
            selectedImg = imgs[currentIdx]
        } else {
            currentIdx = imgs.length - 1;
            selectedImg = imgs[currentIdx];
        }
    }
    function closeFullImage() { selectedImg = null; }
    // Hàm bổ trợ để xử lý việc bấm vào Header
    function handleHeaderClick(category) {
        if (!expandedCategories[category]) {
            toggleExpand(category);
        } else {
            // Nếu đang mở rồi thì có thể cuộn lên đầu section hoặc load thêm
            loadMore(category);
        }
    }
</script>
<div class="app-container" class:light-mode={!isDarkMode}>
    <header class="glass-header">
        <div class="header-content">
            <div class="logo">Library<span>3dvs</span></div>

            <nav class="desktop-nav">
                {#if currentView === 'home'}
                    {#each categories as cat}
                        <button on:click={() => scrollToCategory(cat)}>{cat}</button>
                    {/each}
                    <!-- Nút chuyển sang trang Old -->
                    <button class="btn-old-trigger" on:click={() => switchView('old')}>
                        OLD LIBRARY
                    </button>
                {:else}
                    <!-- Navbar cho trang Old -->
                    <button class="btn-back" on:click={() => switchView('home')}>← NEW LIBRARY</button>
                    {#each oldCategories as cat}
                        <button on:click={() => scrollToCategory(cat)}>{cat}</button>
                    {/each}
                {/if}
            </nav>
            <button class="theme-toggle" aria-label="Toggle-theme" type="button" on:click={toggleTheme}>
                {#if isDarkMode}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                {/if}
            </button>
        </div>
    </header>

    <main>
        {#if loading && !Object.keys(imgData).length}
            <div class="loader-screen">
                <div class="pulse"></div>
                <br><p>Loading resources... please wait!</p><br>
            </div>
        {:else if loadingOld}
            <div class="loader-screen">
                <div class="pulse"></div>
                <br><p>Loading old resources... please wait!</p><br>
            </div>
        {:else}
            {#each Object.entries(imgData) as [category, images]}
                <section class="category-section" id={category}>
                    <div class="section-title">
                        <div class="line"></div>
                        <h2 on:click={() => handleHeaderClick(category)} class="clickable-header">
                            {category}
                            <p class="title-arial">(click for detail)</p>
                        </h2>
                        {#if expandedCategories[category]}
                            <button class="btn-close" on:click={() => toggleExpand(category)}>✕ Close</button>
                        {/if}
                        <div class="line"></div>
                    </div>

                    {#if !expandedCategories[category]}
                        <div class="slider-wrapper">
                            <!-- Nút điều hướng Slider -->
                            <button class="nav-btn prev" on:click={() => scroll(scrollContainers[category], -1)}>‹</button>
                            <button class="nav-btn next" on:click={() => scroll(scrollContainers[category], 1)}>›</button>

                            <div class="slider" bind:this={scrollContainers[category]}>
                                {#each images.slice(0, 15) as img, i}
                                    <div class="img-card">
                                        <div class="img-inner" on:click={() => openFullImage(img, category, i)}>
                                            <img src={img.url + "=w100"} alt={img.name} loading="lazy" decoding="async" />
                                            <div class="overlay">
                                                <span>{img.name.split('.')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                                {#if images.length > 10}
                                    <button class="show-more-inline" on:click={() => toggleExpand(category)}>
                                        <span>+{images.length - 10}<br>MORE...</span>
                                    </button>
                                {/if}
                            </div>
                        </div>

                        <!-- Chế độ Detail (Expand) -->
                    {:else}
                        <div class="expanded-grid">
                            {#each images.slice(0, scrollContainers[category]) as img, i}
                                <div class="img-card-large" on:click={() => openFullImage(img, category, i)}>
                                    <img src={img.url + "=w100"} alt={img.name} loading="lazy"/>
                                </div>
                            {/each}
                        </div>

                        {#if scrollContainers[category] < images.length}
                            <div class="load-more-trigger flex justify-center items-center py-8"
                                    use:infiniteScroll={() => loadMore(category)}>
                                <!-- Hiệu ứng loading xoay tròn thay cho nút bấm thô cứng -->
                                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                        {/if}
                    {/if}
                </section>
            {/each}
        {/if}
    </main>

    <footer>
        <div class="footer-grid">
            <div class="footer-info">© 2026 <span class="footer-logo">Library3dvs</span>. All rights reserved.</div>
        </div><br>
    </footer>

    {#if selectedImg}
        <div class="lightbox" on:click={closeFullImage} transition:fade>
            <button class="close-lightbox">✕</button>
            <button class="lightbox-nav prev" on:click={prevImage}>‹</button>
            <div class="lightbox-content">
                <img src={selectedImg.url + "=w1200"} alt={selectedImg.name} />
                <div class="lightbox-info">
                    <span>{currentCate} | {currentIdx + 1} / {imgData[currentCate].length}</span>
                    <p>{selectedImg.name}</p>
                </div>
            </div>
            <button class="lightbox-nav next" on:click={nextImage}>›</button>
        </div>
    {/if}
</div>
<style>
    :root {
        --bg: #0a0a0a;
        --card-bg: #151515;
        --text: #ffffff;
        --accent: #deff9a;
        --glass: rgba(20, 20, 20, 0.8);
        --transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .light-mode {
        --bg: #f5f7f8;
        --card-bg: #ffffff;
        --text: #1a1a1a;
        --accent: #2d5a27;
        --glass: rgba(255, 255, 255, 0.8);
    }
    /* Base Styles */
    .app-container {
        background-color: var(--bg);
        color: var(--text);
        min-height: 100vh;
        transition: var(--transition);
        font-family: 'Inter', -apple-system, sans-serif;
    }
    /* Header Glassmorphism */
    .glass-header {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: var(--glass);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(128, 128, 128, 0.1);
        padding: 15px 5%;
    }
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1400px;
        margin: 0 auto;
    }
    .logo { font-size: 1.5rem; font-weight: 700; letter-spacing: -1px; }
    .logo span { color: var(--accent); }
    .desktop-nav { display: flex; gap: 20px; }
    .desktop-nav button {
        background: none; border: none; color: var(--text);
        font-size: 0.8rem; font-weight: 500; cursor: pointer;
        opacity: 0.6; transition: 0.3s;
    }
    .desktop-nav button:hover { opacity: 1; color: var(--accent); }
    /* Section Title */
    .category-section { padding: 60px 5%; overflow: hidden; padding-top: 100px; }
    .section-title { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
    .section-title h2 { color: var(--accent); letter-spacing: 4px; font-weight: bold; margin: 0; }
    .title-arial {color: var(--text); font-size: 12px; font-style: italic; font-family: "JetBrains Mono Light"}
    .line { flex: 1; height: 1px; background: rgba(128, 128, 128, 0.2); }
    /* Slider Logic & Swipe */
    .slider-wrapper { position: relative; }
    .slider {
        display: flex;
        gap: 20px;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        padding-bottom: 20px;
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
    .slider::-webkit-scrollbar { display: none; } /* Chrome/Safari */
    .expanded-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 10px;
        animation: fadeIn 0.5s ease;
    }
    .img-card-large img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        transition: opacity 0.3s;
    }
    .btn-close {
        background: none;
        border: 1px solid #444;
        color: #888;
        cursor: pointer;
        padding: 5px 15px;
        border-radius: 20px;
    }
    .load-more-trigger {
        text-align: center;
        padding: 40px;
    }
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .nav-btn {
        position: absolute; top: 50%; transform: translateY(-50%);
        width: 45px; height: 45px; border-radius: 50%;
        background: var(--glass); color: var(--text);
        border: 1px solid rgba(128, 128, 128, 0.3);
        cursor: pointer; z-index: 10; font-size: 1.5rem;
        display: none; align-items: center; justify-content: center;
        transition: 0.3s;
    }
    .slider-wrapper:hover .nav-btn { display: flex; }
    .prev { left: -22px; }
    .next { right: -22px; }
    /* Image Cards & Hover Effect */
    .img-card {
        flex: 0 0 150px;
        scroll-snap-align: start;
        border-radius: 12px;
        overflow: hidden;
    }
    .img-inner {
        position: relative;
        width: 100%;
        aspect-ratio: 16/10;
        overflow: hidden;
        background: var(--card-bg);
    }
    .img-inner img {
        width: 100%; height: 100%; object-fit: cover;
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .img-card:hover img { transform: scale(1.1); }
    .overlay {
        position: absolute; bottom: 0; left: 0; right: 0;
        padding: 20px;
        background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        opacity: 0; transition: 0.4s;
        display: flex; align-items: flex-end;
    }
    .img-card:hover .overlay { opacity: 1; }
    .overlay span { color: white; font-size: 0.8rem; font-weight: 300; }
    /* Theme Toggle Button */
    .theme-toggle {
        background: var(--card-bg);
        border: 1px solid rgba(128, 128, 128, 0.2);
        color: var(--text);
        padding: 8px; border-radius: 10px; cursor: pointer;
        transition: 0.3s;
    }
    .theme-toggle:hover { background: var(--accent); color: #000; }
    .show-more-inline {
        flex: 0 0 0px; background: #222; border: 1px dashed #deff9a; color: #deff9a;
        cursor: pointer; font-weight: bold;
    }
    .clickable-header {
        cursor: pointer;
        transition: var(--transition);
    }
    .clickable-header:hover {
        letter-spacing: 3px; /* Hiệu ứng giãn chữ nhẹ khi hover */
        opacity: 0.8;
    }
    /* Lightbox Styles */
    .lightbox {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.91);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .lightbox-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 200%;
    }
    .lightbox img {
        max-height: 200vh;
        max-width: 100%;
        object-fit: contain;
        box-shadow: 0 0 50px rgba(0,0,0,0.5);
    }
    .lightbox-nav {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 30px;
        height: 60px;
        border-radius: 50%;
        font-size: 30px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: 0.3s;
    }
    .lightbox-nav:hover {
        background: var(--accent);
        color: black;
    }
    .lightbox-info {
        margin-top: 15px;
        text-align: center;
        color: #fff;
    }
    .lightbox-info span {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--accent);
    }
    .lightbox-info p { margin: 5px 0 0; opacity: 0.7; font-size: 0.9rem; }
    .close-lightbox {
        position: absolute;
        top: 20px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
    }
    .img-inner, .img-card-large {
        cursor: pointer;
    }
    .footer-logo {
        color: var(--accent);
        font-weight: bold;
    }
    /* Responsive */
    @media (max-width: 768px) {
        .category-section { padding-top: 10px; }
        .desktop-nav button:not(.btn-old-trigger):not(.btn-back) {
            display: none;
        }
        .btn-old-trigger {
            font-size: 30px;
            margin-right: -55px;
            margin-top: 2px;
        }
        .btn-back {
            font-size: 30px;
            margin-right: -45px;
        }
        .img-card { flex: 0 0 100px; }
    }
</style>