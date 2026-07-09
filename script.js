// 1. DATA SOAL UJIAN
const examData = [
    { question: "Manakah benua terbesar di dunia berdasarkan luas wilayahnya?", options: ["Benua Afrika", "Benua Asia", "Benua Amerika Utara", "Benua Eropa"], answer: 1 },
    { question: "Negara manakah yang memiliki wilayah terluas di dunia?", options: ["Amerika Serikat", "Tiongkok", "Kanada", "Rusia"], answer: 3 },
    { question: "Apa nama samudra terbesar dan terdalam di bumi?", options: ["Samudra Atlantik", "Samudra Hindia", "Samudra Pasifik", "Samudra Arktik"], answer: 2 },
    { question: "Hewan mamalia apakah yang diakui sebagai hewan terbesar di bumi?", options: ["Gajah Afrika", "Hiu Paus", "Paus Biru", "Jerapah"], answer: 2 },
    { question: "Gunung apakah yang merupakan gunung tertinggi di dunia?", options: ["Gunung Kilimanjaro", "Gunung Everest", "Gunung K2", "Gunung Fuji"], answer: 1 }
];

// 2. VARIABEL SISTEM
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswerIndex = null;
let timeLeft = 300; // Waktu ujian (5 menit)
let timerInterval;
let afkTimer;

// SISTEM LIMIT ANTI-CHEAT
let afkCount = 0;
let tabCount = 0;
const maxLimit = 3; // Batas Maksimal Pelanggaran
let isDisqualified = false;

// DOM ELEMENTS
const loginScreen = document.getElementById("login-screen");
const examScreen = document.getElementById("exam-screen");
const btnStart = document.getElementById("btn-start");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const btnNext = document.getElementById("btn-next");
const progressBar = document.getElementById("progressBar");

// MODAL ELEMENTS
const warningModal = document.getElementById("warning-modal");
const warningMessage = document.getElementById("warning-message");
const warningCount = document.getElementById("warning-count");
const btnCloseWarning = document.getElementById("btn-close-warning");

// 3. LOGIKA TOMBOL START (LOGIN)
btnStart.addEventListener("click", () => {
    const nama = document.getElementById("input-nama").value.trim();
    const nim = document.getElementById("input-nim").value.trim();

    if (nama === "" || nim === "") {
        alert("Harap masukkan Nama dan NIM Anda!");
        return;
    }

    document.getElementById("display-nama").innerText = nama;
    document.getElementById("display-nim").innerText = "NIM: " + nim;

    loginScreen.style.display = "none";
    examScreen.style.display = "block";

    startExam();
    startAntiCheat();
});

// 4. SISTEM DETEKSI ANTI-CHEAT (MAKSIMAL 3 KALI)
function startAntiCheat() {
    // Deteksi Pindah Tab / Keluar Browser
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && !isDisqualified && examScreen.style.display === "block") {
            triggerWarning('tab');
        }
    });

    // Deteksi AFK (Aktivitas Mouse/Keyboard)
    resetAfkTimer();
    window.addEventListener("mousemove", resetAfkTimer);
    window.addEventListener("keydown", resetAfkTimer);
    window.addEventListener("click", resetAfkTimer);
}

function resetAfkTimer() {
    if (isDisqualified) return;
    clearTimeout(afkTimer);
    
    // Jika diam tanpa aktivitas selama 15 detik = Terhitung AFK
    afkTimer = setTimeout(() => {
        if (!isDisqualified && examScreen.style.display === "block" && !warningModal.classList.contains("show")) {
            triggerWarning('afk');
        }
    }, 15000); 
}

function triggerWarning(type) {
    clearTimeout(afkTimer); // Hentikan hitungan AFK saat modal peringatan tampil

    if (type === 'tab') {
        tabCount++;
        if (tabCount > maxLimit) { kickUser("Terlalu banyak berpindah tab/meninggalkan halaman ujian!"); return; }
        warningMessage.innerText = "Sistem mendeteksi Anda mencoba membuka tab atau aplikasi lain!";
        warningCount.innerText = `Peringatan Keluar Tab: ${tabCount} / ${maxLimit}`;
    } else if (type === 'afk') {
        afkCount++;
        if (afkCount > maxLimit) { kickUser("Anda dikeluarkan karena terlalu lama tidak melakukan aktivitas (AFK)!"); return; }
        warningMessage.innerText = "Sistem mendeteksi Anda tidak melakukan aktivitas gerakan layar atau mengetik!";
        warningCount.innerText = `Peringatan AFK: ${afkCount} / ${maxLimit}`;
    }

    warningModal.classList.add("show");
}

btnCloseWarning.addEventListener("click", () => {
    warningModal.classList.remove("show");
    resetAfkTimer();
});

// FUNGSI BLOKIR JIKA MELEBIHI 3 KALI
function kickUser(reason) {
    isDisqualified = true;
    clearInterval(timerInterval);
    clearTimeout(afkTimer);
    warningModal.classList.remove("show");

    document.getElementById("exam-screen").innerHTML = `
        <div style="text-align: center; padding: 40px 10px; color: #dc2626;">
            <div style="font-size: 80px; margin-bottom: 15px; animation: denyutDanger 0.8s infinite alternate;">⛔</div>
            <h2 style="font-weight: 700; margin-bottom: 10px;">AKSES UJIAN DIBATALKAN</h2>
            <p style="font-size: 15px; color: #4a5568; margin-bottom: 20px; font-weight: 600;">${reason}</p>
            <p style="font-size: 13px; color: #718096;">Anda telah melebihi batas maksimal toleransi pelanggaran sistem (Maksimal 3x). Lembar ujian Anda telah dibekukan otomatis.</p>
        </div>
    `;
}

// 5. OPERASIONAL UJIAN
function startExam() {
    loadQuestion();
    startTimer();
}

function loadQuestion() {
    selectedAnswerIndex = null;
    btnNext.classList.add("disabled");
    btnNext.classList.remove("active");
    btnNext.disabled = true;
    optionsContainer.innerHTML = "";

    let currentQuestion = examData[currentQuestionIndex];
    questionText.innerText = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;
    
    progressBar.style.width = `${(currentQuestionIndex / examData.length) * 100}%`;

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("option-btn");
        
        button.addEventListener("click", () => {
            selectedAnswerIndex = index;
            const allBtns = optionsContainer.querySelectorAll(".option-btn");
            allBtns.forEach(b => b.classList.remove("selected"));
            button.classList.add("selected");
            
            btnNext.classList.remove("disabled");
            btnNext.classList.add("active");
            btnNext.disabled = false;
        });
        optionsContainer.appendChild(button);
    });
}

btnNext.addEventListener("click", () => {
    if (selectedAnswerIndex === examData[currentQuestionIndex].answer) score++;
    currentQuestionIndex++;
    currentQuestionIndex < examData.length ? loadQuestion() : endExam();
});

function startTimer() {
    timerInterval = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        document.getElementById("time").innerText = `${minutes < 10 ? '0'+minutes : minutes}:${seconds < 10 ? '0'+seconds : seconds}`;
        
        if (timeLeft <= 0) { clearInterval(timerInterval); endExam(); }
        timeLeft--;
    }, 1000);
}

function endExam() {
    if (isDisqualified) return;
    clearInterval(timerInterval);
    clearTimeout(afkTimer);
    progressBar.style.width = "100%";
    
    const finalScore = Math.round((score / examData.length) * 100);
    
    document.getElementById("exam-screen").innerHTML = `
        <div style="text-align: center; padding: 30px 10px;">
            <div style="font-size: 70px; margin-bottom: 10px;">🎉</div>
            <h2 style="color: #2d3748; margin-bottom: 10px;">Ujian Selesai!</h2>
            <p style="color: #718096; margin-bottom: 20px;">Terima kasih telah mengerjakan ujian dengan jujur.</p>
            <div style="font-size: 55px; font-weight: 700; color: #3182ce; margin-bottom: 10px;">${finalScore}</div>
            <p style="font-size: 14px; color: #4a5568;">Benar ${score} dari ${examData.length} soal</p>
        </div>
    `;
}