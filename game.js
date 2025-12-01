/* TELEGRAM */
let tg = window.Telegram.WebApp;
tg.expand();
let playerName = tg.initDataUnsafe?.user?.username || "Guest";

/* SUPABASE */
const supabase = supabase.createClient(
  "https://vdhuexwgplylprgpddoq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkaHVleHdncGx5bHByZ3BkZG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzI3MzgsImV4cCI6MjA4MDE0ODczOH0.oAtftTGawGDSTSpvzZQY_TCjn494tGQ2dn6nGwlzYfc"
);

/* NUMBER GRID */
let selected = [];
const maxPick = 5;

const grid = document.getElementById("numberGrid");
for (let i = 1; i <= 100; i++) {
  const div = document.createElement("div");
  div.className = "num";
  div.innerText = i;

  div.onclick = () => {
    if (selected.includes(i)) {
      selected = selected.filter(n => n !== i);
      div.classList.remove("selected");
    } else {
      if (selected.length >= maxPick) return;
      selected.push(i);
      div.classList.add("selected");
    }
  };

  grid.appendChild(div);
}

/* CONFETTI */
function confettiBurst() {
  for (let i = 0; i < 25; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.setProperty("--hue", Math.random() * 360);
    c.style.animationDuration = 2 + Math.random() * 1.5 + "s";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

/* PLAY BUTTON */
document.getElementById("playBtn").onclick = async () => {
  if (selected.length === 0) return alert("Pick numbers first!");

  const drawn = [];
  while (drawn.length < 20) {
    let num = Math.floor(Math.random() * 100) + 1;
    if (!drawn.includes(num)) drawn.push(num);
  }

  const hits = selected.filter(n => drawn.includes(n));

  document.querySelectorAll(".num").forEach(n => n.classList.remove("hit"));
  hits.forEach(n => {
    const box = [...document.querySelectorAll(".num")].find(x => Number(x.innerText) === n);
    if (box) box.classList.add("hit");
  });

  const points = hits.length * 10;

  if (hits.length > 0) confettiBurst();

  document.getElementById("results").innerHTML = `
    🎯 Drawn: ${drawn.join(", ")}<br>
    ✔ Hits: <b>${hits.length}</b><br>
    ⭐ Points: +${points}
  `;

  await supabase.from("leaderboard").insert([
    { username: playerName, score: points }
  ]);
};

/* LEADERBOARD */
document.getElementById("leaderboardBtn").onclick = async () => {
  const list = document.getElementById("leaderboardList");

  const { data } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(20);

  list.innerHTML = "";
  if (!data || data.length === 0) {
    list.innerHTML = "<i>No scores yet</i>";
    return;
  }

  data.forEach((p, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
    const div = document.createElement("div");
    div.className = "lb-item";
    div.innerHTML = `
      <span>${medal} #${i + 1}</span>
      <span>${p.username}</span>
      <span>${p.score}</span>
    `;
    list.appendChild(div);
  });
};
