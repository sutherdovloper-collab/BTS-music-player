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
    currfolder = folder;
    const safeFolder = encodePathSegments(folder);

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
        const manifestResp = await fetch(`./${safeFolder}/files.json`);
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
    const response = await fetch(`./${safeFolder}/`);
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
    currentSong.src = `./${safeFolder}/${encoded}`;
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
    // Use the existing .card elements in the HTML
    const cardContainer = document.querySelector(".cardContainer");
    if (!cardContainer) return;
    const cards = Array.from(cardContainer.querySelectorAll('.card'));

    // Load known folder list to help match cards without data-folder
    let knownFolders = [];
    try {
        const fresp = await fetch('./songs/folders.json');
        if (fresp.ok) knownFolders = await fresp.json();
    } catch (e) {
        console.warn('folders.json not found, proceeding without it', e);
    }

    const infoCache = {};
    const tryMatchByInfo = async (titleLower) => {
        for (const f of knownFolders) {
            if (infoCache[f] === undefined) {
                try {
                    const r = await fetch(`./songs/${encodeURIComponent(f)}/info.json`);
                    infoCache[f] = r.ok ? await r.json() : null;
                } catch (e) {
                    infoCache[f] = null;
                }
            }
            const info = infoCache[f];
            if (info && info.title && info.title.toLowerCase().includes(titleLower)) return f;
            if (info && titleLower.includes((info.title || '').toLowerCase())) return f;
        }
        return null;
    };

    for (const card of cards) {
        let folder = card.dataset.folder;

        if (!folder) {
            const title = (card.querySelector('h2')?.textContent || '').trim();
            const titleLower = title.toLowerCase();
            if (titleLower) {
                // try exact or partial folder-name matches
                let match = knownFolders.find(f => f.toLowerCase() === titleLower)
                    || knownFolders.find(f => f.toLowerCase().includes(titleLower))
                    || knownFolders.find(f => titleLower.includes(f.toLowerCase()));
                if (!match) {
                    match = await tryMatchByInfo(titleLower);
                }
                if (match) folder = match;
            }
        }

        if (!folder) continue; // cannot map this card to a folder

        const safeFolder = encodePathSegments(folder);
        // load info if needed
        if (infoCache[folder] === undefined) {
            try {
                const r = await fetch(`./${safeFolder}/info.json`);
                infoCache[folder] = r.ok ? await r.json() : null;
            } catch (e) { infoCache[folder] = null; }
        }

        const info = infoCache[folder];
        if (info) {
            const img = card.querySelector('img');
            if (img) img.src = `/songs/${folder}/cover.jpg`;
            const h2 = card.querySelector('h2');
            if (h2) h2.textContent = info.title || h2.textContent;
            const p = card.querySelector('p');
            if (p) p.textContent = info.description || p.textContent;
        }

        // ensure data-folder set for later use and attach click
        card.dataset.folder = folder;
        card.addEventListener('click', async () => {
            song = await getSongs(`songs/${folder}`);
            if (songs.length > 0) playMusic(songs[0]);
        });
    }
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
    await getSongs("songs/ncs");
    if (songs.length > 0) playMusic(songs[0], true);
    await displayAlbums();
}

// Start app
main();
