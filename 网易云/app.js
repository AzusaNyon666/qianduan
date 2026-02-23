function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const menuItems = document.querySelectorAll('.menu-item');
const pages = document.querySelectorAll('.page');

menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = item.dataset.page;
        
        menuItems.forEach(m => m.classList.remove('active'));
        item.classList.add('active');
        
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById(`${pageName}-page`).classList.add('active');
        
        if (pageName === 'home') {
            loadHomePage();
        }
    });
});

async function loadHomePage() {
    await loadBanner();
    await loadRecommendPlaylists();
}

async function loadBanner() {
    const bannerEl = document.getElementById('banner');
    const data = await fetchAPI('/banner?type=0');
    
    if (data && data.banners) {
        bannerEl.innerHTML = data.banners.slice(0, 5).map(item => `
            <div class="banner-item">
                <img src="${item.imageUrl}" alt="${item.typeTitle}">
            </div>
        `).join('');
    }
}

async function loadRecommendPlaylists() {
    const playlistsEl = document.getElementById('playlists');
    const data = await fetchAPI('/personalized?limit=12');
    
    if (data && data.result) {
        playlistsEl.innerHTML = data.result.map(item => `
            <div class="playlist-card" onclick="openPlaylist(${item.id})">
                <img src="${item.picUrl}" alt="${item.name}">
                <div class="playlist-info">
                    <div class="playlist-name">${item.name}</div>
                    <div class="playlist-count">▶️ ${(item.playCount / 10000).toFixed(1)}万</div>
                </div>
            </div>
        `).join('');
    }
}

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const keyword = searchInput.value.trim();
    if (!keyword) {
        alert('请输入关键词');
        return;
    }
    
    searchResults.innerHTML = '<p>搜索中...</p>';
    const data = await fetchAPI(`/search?keywords=${encodeURIComponent(keyword)}&limit=30`);
    
    if (data && data.result && data.result.songs) {
        const songs = data.result.songs;
        searchResults.innerHTML = `
            <h3>找到 ${songs.length} 首歌曲</h3>
            ${songs.map((song, index) => `
                <div class="song-item" onclick="playSong(${song.id}, '${song.name.replace(/'/g, "\\'")}', '${song.artists[0].name.replace(/'/g, "\\'")}', '${song.album.picUrl}')">
                    <div class="song-index">${index + 1}</div>
                    <div class="song-info">
                        <div class="song-name">${song.name}</div>
                        <div class="song-artist">${song.artists.map(a => a.name).join(' / ')} - ${song.album.name}</div>
                    </div>
                    <div class="song-duration">${formatTime(song.duration / 1000)}</div>
                </div>
            `).join('')}
        `;
    } else {
        searchResults.innerHTML = '<p>未找到相关歌曲</p>';
    }
}

async function openPlaylist(id) {
 
    menuItems.forEach(m => m.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('playlist-page').classList.add('active');
    
    const detailEl = document.getElementById('playlist-detail');
    detailEl.innerHTML = '<p>加载中...</p>';
    
    const data = await fetchAPI(`/playlist/detail?id=${id}`);
    
    if (data && data.playlist) {
        const pl = data.playlist;
        detailEl.innerHTML = `
            <div class="playlist-header">
                <img src="${pl.coverImgUrl}" alt="${pl.name}">
                <div class="playlist-header-info">
                    <h2>${pl.name}</h2>
                    <p class="playlist-desc">创建者: ${pl.creator.nickname}</p>
                    <p class="playlist-desc">歌曲数: ${pl.trackCount} 首</p>
                    <p class="playlist-desc">播放量: ${(pl.playCount / 10000).toFixed(1)} 万</p>
                    <p class="playlist-desc">${pl.description || '暂无简介'}</p>
                </div>
            </div>
            <h3>歌曲列表</h3>
            <div class="search-results">
                ${pl.tracks.map((song, index) => `
                    <div class="song-item" onclick="playSong(${song.id}, '${song.name.replace(/'/g, "\\'")}', '${song.ar[0].name.replace(/'/g, "\\'")}', '${song.al.picUrl}')">
                        <div class="song-index">${index + 1}</div>
                        <div class="song-info">
                            <div class="song-name">${song.name}</div>
                            <div class="song-artist">${song.ar.map(a => a.name).join(' / ')} - ${song.al.name}</div>
                        </div>
                        <div class="song-duration">${formatTime(song.dt / 1000)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const playerCover = document.getElementById('player-cover');
const playerName = document.getElementById('player-name');
const playerArtist = document.getElementById('player-artist');

let currentSong = null;
let isPlaying = false;


async function playSong(id, name, artist, cover) {
    const data = await fetchAPI(`/song/url?id=${id}`);
    
    if (data && data.data && data.data[0] && data.data[0].url) {
        const url = data.data[0].url;
        audio.src = url;
        audio.play();
        
        currentSong = { id, name, artist, cover };
        isPlaying = true;
        playBtn.textContent = '暂停';
        
        playerCover.src = cover;
        playerName.textContent = name;
        playerArtist.textContent = artist;
    } else {
        alert('无法播放该歌曲（可能是VIP歌曲）');
    }
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        audio.pause();
        playBtn.textContent = '播放';
        isPlaying = false;
    } else {
        audio.play();
        playBtn.textContent = '暂停';
        isPlaying = true;
    }
});


audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }
});


progressBar.addEventListener('input', () => {
    if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
});

audio.addEventListener('ended', () => {
    playBtn.textContent = '播放';
    isPlaying = false;
});

window.addEventListener('DOMContentLoaded', () => {
    loadHomePage();
});
