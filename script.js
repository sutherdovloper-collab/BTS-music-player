console.log("Let's write JavaScript");
// console.log(await getSongs())
let song;
let currfolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}


// 🎧 GLOBAL STATE
let currentSong = new Audio();
let songs = [];

// 🎧 PLAY BUTTON (HTML id="play")
const playBtn = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");


function encodePathSegments(path) {
    return path.split('/').map(encodeURIComponent).join('/');
}

async function getSongs(folder) {
    // Normalize folder input so both "ncs" and "songs/ncs" work.
    let normalizedFolder = String(folder || '').trim();
    if (normalizedFolder.startsWith('./songs/')) normalizedFolder = normalizedFolder.slice('./songs/'.length);
    if (normalizedFolder.startsWith('songs/')) normalizedFolder = normalizedFolder.slice('songs/'.length);
    if (normalizedFolder.startsWith('./')) normalizedFolder = normalizedFolder.slice('./'.length);
    normalizedFolder = normalizedFolder.replace(/\s+/g, ' ').trim();
    const safeFolder = encodePathSegments(normalizedFolder);
    currfolder = normalizedFolder;

    // ===== ORIGINAL CODE (commented) =====
    // const response = await fetch(`./${folder}/`);
    // const html = await response.text();
    // const div = document.createElement("div");
    // div.innerHTML = html;
    // const as = div.getElementsByTagName("a");
    // const loadedSongs = [];
    // for (let i = 0; i < as.length; i++) {
    //     const element = as[i];
    //     if (element.href.endsWith(".mp3")) {
    //         const url = new URL(element.href);
    //         let path = decodeURIComponent(url.pathname);
    //         path = path.replace(/\\/g, "/").replace(/%5C/gi, "/");
    //         loadedSongs.push(path.split(`/${folder}/`).pop());
    //     }
    // }
    // songs = loadedSongs;
    // renderSongList();
    // return songs;
    // ===== END ORIGINAL =====

    // New implementation: try manifest first, then fallback to directory parse
    try {
        const manifestResp = await fetch(`./songs/${safeFolder}/files.json`);
        if (manifestResp.ok) {
            const manifest = await manifestResp.json();
            // manifest expected to be an array of filenames (strings)
            songs = Array.isArray(manifest) ? manifest : [];
            renderSongList();
            return songs;
        }
    } catch (e) {
        // ignore manifest fetch errors and fall back to directory parse
        console.warn('No manifest or manifest fetch failed for', folder, e);
    }

    // Fallback: try parsing directory listing HTML (works on some dev servers)
    const response = await fetch(`./songs/${safeFolder}/`);
    const html = await response.text();

    const div = document.createElement("div");
    div.innerHTML = html;

    const as = div.getElementsByTagName("a");
    const loadedSongs = [];

    for (let i = 0; i < as.length; i++) {
        const element = as[i];

        if (element.href.endsWith(".mp3")) {
            const url = new URL(element.href);
            let path = decodeURIComponent(url.pathname);
            path = path.replace(/\\/g, "/").replace(/%5C/gi, "/");
            loadedSongs.push(path.split(`/${folder}/`).pop());
        }
    }

    songs = loadedSongs;
    renderSongList();
    return songs;
}


function renderSongList() {
    const songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";

    songs.forEach((song, index) => {
        const songName = decodeURIComponent(song.split("/").pop()).replace(".mp3", "");

        const li = document.createElement("li");
        li.innerHTML = `
            <img class="invert" src="playlist2.svg" alt="">
            <div class="info">
                <div>${songName}</div>
                <div>BTS</div>
            </div>
            <div class="playnow">
                <span>Play</span>
                <img class="invert" src="play.svg" alt="">
            </div>`;


        li.addEventListener("click", () => {
            playMusic(songs[index]);
        });

        songUL.appendChild(li);
    });
}

// return songs;

const playMusic = (track, pause = false) => {
    if (!track) return;

    // ===== ORIGINAL CODE (commented) =====
    // currentSong.src = `./${currfolder}/${track}`;
    // if (!pause) {
    //     currentSong.play();
    //     playBtn.src = "pause.svg";
    // }
    // ===== END ORIGINAL =====

    // New implementation: safely encode path segments and handle play() promise
    // Safely encode each path segment to handle spaces/apostrophes etc.
    const safeFolder = encodePathSegments(currfolder);
    const encoded = track.split('/').map(s => encodeURIComponent(s)).join('/');
    currentSong.src = `./songs/${safeFolder}/${encoded}`;
    // Ensure the audio element reloads the new source
    currentSong.load();

    if (!pause) {
        const playPromise = currentSong.play();
        if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(() => {
                playBtn.src = "pause.svg";
            }).catch((err) => {
                // Play could be blocked by browser autoplay policies — log and leave UI in play state
                console.warn('Playback prevented:', err);
                playBtn.src = "play.svg";
            });
        } else {
            playBtn.src = "pause.svg";
        }
    }

    document.querySelector(".songinfo").innerHTML =
        decodeURIComponent(track.split("/").pop()).replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    const cardContainer = document.querySelector(".cardContainer");
    if (!cardContainer) return;

    let folders = [];
    try {
        const resp = await fetch('./songs/folders.json');
        if (resp.ok) folders = await resp.json();
    } catch (e) {
        console.warn('Unable to load songs/folders.json', e);
    }
    if (!Array.isArray(folders) || folders.length === 0) return;

    const fragment = document.createDocumentFragment();

    for (const folder of folders) {
        if (typeof folder !== 'string' || !folder.trim()) continue;
        const normalizedFolder = folder.replace(/\s+/g, ' ').trim();
        const safeFolder = encodePathSegments(normalizedFolder);

        let info = null;
        try {
            // const infoResp = await fetch(`./songs/${safeFolder}/info.json`);
            // if (infoResp.ok) info = await infoResp.json();

        } catch (e) {
            info = null;
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.folder = normalizedFolder;
        card.innerHTML = `
            <div class="play">
                <svg width="65" height="65" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="50" fill="#AF37FF" />
                    <path d="M40 30 L70 50 L40 70 Z" fill="black" />
                </svg>
            </div>
            <img src="./songs/${safeFolder}/cover.jpg" alt="${normalizedFolder}">
            <h2>${info && info.title ? info.title : normalizedFolder}</h2>
            <p>${info && info.description ? info.description : 'BTS'}</p>`;

        card.addEventListener('click', async () => {
            song = await getSongs(normalizedFolder);
            if (songs.length > 0) playMusic(songs[0]);
        });

        fragment.appendChild(card);
    }

    cardContainer.innerHTML = '';
    cardContainer.appendChild(fragment);
}

// UI event listeners below
const hamburgur = document.querySelector(".hamburgur");
if (hamburgur) hamburgur.addEventListener("click", () => document.querySelector(".left").style.left = "0");
const closeBtn = document.querySelector(".close");
if (closeBtn) closeBtn.addEventListener("click", () => document.querySelector(".left").style.left = "-120%");

if (previous) previous.addEventListener("click", () => {
    const currentFile = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    const index = songs.indexOf(currentFile);
    if ((index - 1) >= 0) playMusic(songs[index - 1]);
});
if (next) next.addEventListener("click", () => {
    const currentFile = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    const index = songs.indexOf(currentFile);
    if ((index + 1) < songs.length) playMusic(songs[index + 1]);
});

const volumeInput = document.querySelector(".range input");
if (volumeInput) volumeInput.addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    const volImg = document.querySelector(".volume>img");
    if (volImg && currentSong.volume > 0) volImg.src = volImg.src.replace("volume.svg", "mute.svg");
});
const volImg = document.querySelector(".volume>img");
if (volImg) volImg.addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
        e.target.src = e.target.src.replace("volume.svg", "mute.svg");
        currentSong.volume = 0;
        if (volumeInput) volumeInput.value = 0;
    } else {
        e.target.src = e.target.src.replace("mute.svg", "volume.svg");
        currentSong.volume = 0.1;
        if (volumeInput) volumeInput.value = 10;
    }
});

async function main() {
    await getSongs("ncs");
    if (songs.length > 0) playMusic(songs[0], true);
    await displayAlbums();
}

// Start app
main();
