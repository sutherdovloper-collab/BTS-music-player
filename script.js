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


async function getSongs(folder) {
    currfolder = folder;

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
        const manifestResp = await fetch(`./${folder}/files.json`);
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
    const response = await fetch(`./${folder}/`);
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
    const encoded = track.split('/').map(s => encodeURIComponent(s)).join('/');
    currentSong.src = `./${currfolder}/${encoded}`;
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
    // Use the existing .card elements in the HTML (no directory listing fetch)
    const cardContainer = document.querySelector(".cardContainer");
    const cards = Array.from(cardContainer.querySelectorAll('.card[data-folder]'));

    for (const card of cards) {
        const folder = card.dataset.folder;
        try {
            const infoResponse = await fetch(`./songs/${encodeURIComponent(folder)}/info.json`);
            if (infoResponse.ok) {
                const info = await infoResponse.json();
                const img = card.querySelector('img');
                if (img) img.src = `/songs/${folder}/cover.jpg`;
                const h2 = card.querySelector('h2');
                if (h2) h2.textContent = info.title || h2.textContent;
                const p = card.querySelector('p');
                if (p) p.textContent = info.description || p.textContent;
            }
        } catch (err) {
            console.warn('Could not load info for', folder, err);
        }

        // attach click handler
        card.addEventListener('click', async () => {
            song = await getSongs(`songs/${folder}`);
            if (songs.length > 0) playMusic(songs[0]);
        });
    }
}

// }
// }

// 🎧 MAIN FUNCTION
async function main() {

    await getSongs("songs/ncs");

    let songUL = document.querySelector(".songlist ul");
    // ORIGINAL: playMusic(songs[0], true)
    if (songs.length > 0) playMusic(songs[0], true)

    //display all the albums on page
    displayAlbums()

    // 🎧 PLAY / PAUSE BUTTON
    playBtn.addEventListener("click", () => {

        if (currentSong.paused) {
            currentSong.play();
            playBtn.src = "pause.svg";
        } else {
            currentSong.pause();
            playBtn.src = "play.svg";
        }

    });
}


//listen for timeupdte event
currentSong.addEventListener("timeupdate", () => {
    console.log(currentSong.currentTime, currentSong.duration);
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`
    document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
})

//add event listner to seekbar
document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = ((currentSong.duration) * percent) / 100
})

//add an event listner for hamburgur
document.querySelector(".hamburgur").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0"
})

//add an event listner for close button
document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%"
})

//add an event listener to previous
previous.addEventListener("click", () => {
    console.log("previous clicked")
    console.log(currentSong)

    const currentFile = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    const index = songs.indexOf(currentFile);
    if ((index - 1) >= 0) {
        playMusic(songs[index - 1])
    }
})

//add an event listener to next
next.addEventListener("click", () => {
    console.log("next clicked")

    const currentFile = decodeURIComponent(currentSong.src.split("/").slice(-1)[0]);
    const index = songs.indexOf(currentFile);
    if ((index + 1) < songs.length) {
        playMusic(songs[index + 1])
    }
})

//add an event to volume
document.querySelector(".range").getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
        console.log("setting volume to", e.target.value, "/100")
        currentSong.volume = parseInt(e.target.value) / 100
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("volume.svg", "mute.svg")
        }
    });

//add event listener to mute the track
document.querySelector(".volume>img").addEventListener("click", e => {
    console.log(e.target)
    console.log("changing", e.target.src)
    if (e.target.src.includes("volume.svg")) {
        e.target.src = e.target.src.replace("volume.svg", "mute.svg")
        currentSong.volume = 0;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
    }
    else {
        e.target.src = e.target.src.replace("mute.svg", "volume.svg")

        currentSong.volume = .10;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
    }
})

// 🚀 START APP
main();
// }
