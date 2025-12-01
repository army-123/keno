/* ============================================================
   TELEGRAM MINI APP INIT
============================================================ */

let tg = window.Telegram.WebApp;
tg.expand();

// Light/Dark THEMING
document.body.style.background = tg.colorScheme === "dark" ? "#0d0d0d" : "#ffffff";
document.body.style.color = tg.colorScheme === "dark" ? "#ffffff" : "#000000";

let playerName = tg.initDataUnsafe?.user?.username || "Guest";

/* ============================================================
   GAME VARIABLES
============================================================ */

let selectedNumbers = [];
let drawnNumbers = [];
let currentScore = 0;

const maxSelect = 5;
const totalNumbers = 100;

/* ============================================================
   SUPABASE INIT
============================================================ */

const supabaseUrl = "https://YOUR_PROJECT.supabase.co";
const supabaseKey = "YOUR_ANON_KEY";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

/* ============================================================
   SOUNDS
============================================================ */

const pickSound = new Audio("sounds/pick.mp3");
const winSound = new Audio("sounds/win.mp3");
const drawSound = new Audio("sounds/draw.mp3");
const rewardSound = new Audio("sounds/reward.mp3");

/* ============================================================
   CONFETTI SYSTEM
============================================================ */

function launchConfetti() {
    for (let i = 0; i < 25; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");

        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.animationDuration = (Math.random() * 2 + 2) + "s";

        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

/* ============================================================
   GENERATE NUMBER GRID
============================================================ */

function generateGrid() {
    const grid = document.getElementById("numberGrid");

    for (let i = 1; i <= totalNumbers; i++) {
        const btn = document.createElement("button");
        btn.classList.add("num-btn");
        btn.innerText = i;

        btn.onclick = () => selectNumber(i, btn);
        grid.appendChild(btn);
    }
}
generateGrid();

/* ============================================================
   SELECT NUMBERS
============================================================ */

function selectNumber(num, button) {
    if (selectedNumbers.includes(num)) {
        selectedNumbers = selectedNumbers.filter(n => n !== num);
        button.classList.remove("selected");
    } else {
        if (selectedNumbers.length >= maxSelect) return;

        selectedNumbers.push(num);
        button.classList.add("selected");
        pickSound.play();
    }

    updateSelectedDisplay();
}

function updateSelectedDisplay() {
    document.getElementById("selectedNumbers").innerText =
        selectedNumbers.join(", ") || "None";
}

/* ============================================================
   DRAW NUMBERS (ANIMATED)
============================================================ */

async function drawNumbersAnimated() {
    if (selectedNumbers.length === 0)
        return alert("Pick numbers first!");

    drawnNumbers = [];
    drawSound.play();

    const display = document.getElementById("results");
    display.innerHTML = "Drawing numbers...<br><br>";

    for (let i = 0; i < 20; i++) {
        let randomNum = Math.floor(Math.random() * totalNumbers) + 1;
        drawnNumbers.push(randomNum);

        display.innerHTML += randomNum + " ";

        await new Promise(res => setTimeout(res, 120)); // Animation speed
    }

    showResults();
}

/* ============================================================
   SHOW RESULTS
============================================================ */

function showResults() {
    let matches = selectedNumbers.filter(n => drawnNumbers.includes(n)).length;

    let points = matches * 10;
    currentScore += points;

    if (matches > 0) {
        winSound.play();
        launchConfetti();
    }

    document.getElementById("results").innerHTML = `
        🎯 Drawn: ${drawnNumbers.join(", ")}<br>
        ✔ Matches: ${matches}<br>
        ⭐ Points: +${points}<br>
        🧮 Total Score: ${currentScore}
    `;

    saveScore(playerName, currentScore);
}

/* ============================================================
   SAVE SCORE TO SUPABASE
============================================================ */

async function saveScore(username, score) {
    const { error } = await supabase
        .from("leaderboard")
        .insert([{ username, score }]);

    if (error) console.log("Save error:", error);
}

/* ============================================================
   LOAD LEADERBOARD (WITH MEDALS)
============================================================ */

async function loadLeaderboard() {
    const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order("score", { ascending: false })
        .limit(20);

    if (error) return console.log(error);

    const list = document.getElementById("leaderboardList");
    list.innerHTML = "";

    data.forEach((p, i) => {
        let medal = "";
        if (i === 0) medal = "🥇 ";
        else if (i === 1) medal = "🥈 ";
        else if (i === 2) medal = "🥉 ";

        const div = document.createElement("div");
        div.classList.add("lb-item");
        div.innerHTML = `
            <span>${medal}#${i + 1}</span>
            <span>${p.username}</span>
            <span>${p.score}</span>
        `;
        list.appendChild(div);
    });
}

/* ============================================================
   DAILY REWARD SYSTEM
============================================================ */

function claimDailyReward() {
    const last = localStorage.getItem("lastReward");
    const today = new Date().toDateString();

    if (last === today) {
        alert("You already claimed today!");
        return;
    }

    currentScore += 50;
    localStorage.setItem("lastReward", today);
    rewardSound.play();

    document.getElementById("results").innerHTML = `
        🎁 Daily Reward: +50<br>
        Total Score: ${currentScore}
    `;

    saveScore(playerName, currentScore);
}

/* ============================================================
   TELEGRAM MAIN BUTTON
============================================================ */

tg.MainButton.setText("🎲 DRAW NOW");
tg.MainButton.show();

tg.MainButton.onClick(() => {
    drawNumbersAnimated();
});

/* ============================================================
   BUTTON HOOKS
============================================================ */

document.getElementById("drawBtn").onclick = drawNumbersAnimated;
document.getElementById("rewardBtn").onclick = claimDailyReward;
document.getElementById("leaderboardBtn").onclick = loadLeaderboard;
