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

    currentSong.src = `./${currfolder}/${track}`;

    if (!pause) {
        currentSong.play();
        playBtn.src = "pause.svg";
    }

    document.querySelector(".songinfo").innerHTML =
        decodeURIComponent(track.split("/").pop()).replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    const response = await fetch(`./songs/`);

    const html = await response.text();

    const div = document.createElement("div");
    div.innerHTML = html;
    const anchors = div.getElementsByTagName("a")
    const cardContainer = document.querySelector(".cardContainer")
    const array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        // for
        // }

        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            const folder = e.href.split("/").slice(-2)[0];
            const infoResponse = await fetch(`./songs/${folder}/info.json`);
            const info = await infoResponse.json();

            console.log(info);
            cardContainer.innerHTML = cardContainer.innerHTML += `
    <div data-folder="${folder}" class="card">

                    <div class="play">
                        <svg width="65" height="65" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50" cy="50" r="50" fill="#AF37FF" />
                            <path d="M40 30 L70 50 L40 70 Z" fill="black" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="${info.title}">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
        }
    }
    //load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async (item) => {
            console.log(item.target, item.target.dataset)

            song = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            playMusic(songs[0])
        })
    })

}
// }
// }

// 🎧 MAIN FUNCTION
async function main() {

    await getSongs("songs/ncs");

    let songUL = document.querySelector(".songlist ul");
    playMusic(songs[0], true)

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
