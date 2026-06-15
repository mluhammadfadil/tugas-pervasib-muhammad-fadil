import streamlit as st
import streamlit.components.v1 as components
import time

# Memanggil data soal secara dinamis dari file soal.py
from Soal import SOAL_UJIAN

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="Context-Aware Smart Exam", page_icon="📝", layout="centered")

# --- INITIALIZATION STATE (Penyimpanan Memori Aplikasi) ---
if "page" not in st.session_state:
    st.session_state.page = "START"
if "username" not in st.session_state:
    st.session_state.username = ""
if "nim" not in st.session_state:
    st.session_state.nim = ""
if "answers" not in st.session_state:
    st.session_state.answers = {}
if "cheat_count" not in st.session_state:
    st.session_state.cheat_count = 0
if "afk_duration" not in st.session_state:
    st.session_state.afk_duration = 0
if "is_away" not in st.session_state:
    st.session_state.is_away = False
if "start_time" not in st.session_state:
    st.session_state.start_time = None

# --- TANGKAP SINYAL OTOMATIS DARI JAVASCRIPT (Web API Browser) ---
if "event" in st.query_params:
    event_type = st.query_params["event"]
    
    # 1. Jika mendeteksi mahasiswa pindah tab browser (Anti-Cheating)
    if event_type == "cheat":
        st.session_state.cheat_count += 1
        # Jika pelanggaran terlalu banyak (misal 3 kali), otomatis kunci ujian dan lempar ke halaman hasil
        if st.session_state.cheat_count >= 3:
            st.session_state.page = "RESULT"
            
    # 2. Jika mendeteksi laptop ditinggal (User Inactivity / Presence Tracker)
    elif event_type == "idle":
        if not st.session_state.is_away:
            st.session_state.is_away = True
            st.session_state.afk_duration += 15 # Log mencatat waktu AFK bertambah
            
    # 3. Jika mahasiswa kembali aktif menggerakkan mouse/keyboard
    elif event_type == "active":
        st.session_state.is_away = False

    # Bersihkan parameter URL agar tidak terjadi infinite loop refresh
    st.query_params.clear()

# --- EMBED SMART DETECTOR (JAVASCRIPT) ---
# Fitur pengawasan cerdas ini hanya berjalan ketika halaman ujian aktif
if st.session_state.page == "EXAM":
    js_detector = """
    <script>
    const topDoc = window.parent.document;
    const topWin = window.parent;
    
    // A. DETEKSI PINDAH TAB (Page Visibility API)
    topDoc.addEventListener("visibilitychange", () => {
        if (topDoc.hidden) {
            const url = new URL(topWin.location.href);
            url.searchParams.set("event", "cheat");
            url.searchParams.set("t", Date.now());
            topWin.location.href = url.href; 
        }
    });

    // B. DETEKSI IDLE / AFK (Inactivity Detector via Pergerakan Mouse & Keyboard)
    let idleTime = 0;
    let userIsAway = false;

    function resetTimer() {
        idleTime = 0;
        if (userIsAway) {
            userIsAway = false;
            const url = new URL(topWin.location.href);
            url.searchParams.set("event", "active");
            url.searchParams.set("t", Date.now());
            topWin.location.href = url.href;
        }
    }

    // Sistem memantau aktivitas fisik pengguna di komputer
    topDoc.addEventListener("mousemove", resetTimer);
    topDoc.addEventListener("keypress", resetTimer);
    topDoc.addEventListener("click", resetTimer);

    setInterval(() => {
        idleTime += 1;
        // Jika selama 15 detik tidak ada aktivitas sama sekali
        if (idleTime >= 15 && !userIsAway) {
            userIsAway = true;
            const url = new URL(topWin.location.href);
            url.searchParams.set("event", "idle");
            url.searchParams.set("t", Date.now());
            topWin.location.href = url.href;
        }
    }, 1000);
    </script>
    """
    components.html(js_detector, height=0, width=0)


# --- ALUR JALANNYA SIMULASI APLIKASI ---

# HALAMAN 1: HALAMAN MULAI (IDENTITAS PESERTA)
if st.session_state.page == "START":
    st.title("📝 Simulasi E-Ujian Cerdas")
    st.subheader("Mata Kuliah: Komputasi Pervasif")
    st.write("Aplikasi ini dilengkapi fitur deteksi konteks kehadiran dan perhatian secara real-time.")
    
    with st.form("form_mulai"):
        nama = st.text_input("Nama Lengkap:")
        nim = st.text_input("NIM:")
        submit = st.form_submit_button("Mulai Ujian")
        if submit:
            if nama and nim:
                st.session_state.username = nama
                st.session_state.nim = nim
                st.session_state.page = "EXAM"
                st.session_state.start_time = time.time()
                st.rerun()
            else:
                st.error("Silakan isi Nama dan NIM terlebih dahulu!")

# HALAMAN 2: LEMBAR HALAMAN UJIAN
elif st.session_state.page == "EXAM":
    st.title("✍️ Lembar Jawab Digital")
    st.caption(f"Peserta: {st.session_state.username} ({st.session_state.nim})")
    
    # Perhitungan Waktu Mundur (Timer 5 Menit)
    waktu_berjalan = time.time() - st.session_state.start_time
    sisa_waktu = max(0, 300 - int(waktu_berjalan))
    
    if sisa_waktu <= 0:
        st.session_state.page = "RESULT"
        st.rerun()
        
    menit, detik = divmod(sisa_waktu, 60)
    st.sidebar.metric(label="⏱️ Sisa Waktu Ujian", value=f"{menit:02d}:{detik:02d}")
    
    st.error("⚠️ **Sistem Pengawasan Otomatis Aktif!**")
    
    # Indikator Real-Time Fitur Pervasif
    col_p1, col_p2 = st.columns(2)
    with col_p1:
        st.metric(label="Pelanggaran Tab (Maks 3)", value=f"{st.session_state.cheat_count} kali")
    with col_p2:
        status_kehadiran = "🔴 User is Away From Keyboard" if st.session_state.is_away else "🟢 Hadir Aktif"
        st.metric(label="Status Kehadiran", value=status_kehadiran)

    st.write("---")

    # MENAMPILKAN SOAL SECARA DINAMIS SESUAI ISI FILE soal.py
    for item in SOAL_UJIAN:
        st.markdown(f"**Soal {item['no']}.** {item['tanya']}")
        pilihan = st.radio(
            f"Pilihan {item['no']}:", 
            item['opsi'], 
            index=None, 
            key=f"soal_{item['no']}", 
            label_visibility="collapsed"
        )
        if pilihan:
            st.session_state.answers[item['no']] = pilihan
        st.write("")

    if st.button("Selesai & Kirim Jawaban", type="primary"):
        st.session_state.page = "RESULT"
        st.rerun()

# HALAMAN 3: HALAMAN HASIL & LOG PERILAKU (CONTEXT REPORT)
elif st.session_state.page == "RESULT":
    st.title("📊 Hasil Evaluasi & Log Perilaku Konteks")
    st.subheader(f"Peserta: {st.session_state.username} ({st.session_state.nim})")
    
    # Evaluasi Nilai otomatis berdasarkan kunci jawaban di soal.py
    skor_benar = 0
    for item in SOAL_UJIAN:
        jawaban_user = st.session_state.answers.get(item['no'], "")
        # Mencocokkan jawaban user dengan kunci di soal.py
        if jawaban_user == item['kunci']:
            skor_benar += 1
            
    nilai_akhir = int((skor_benar / len(SOAL_UJIAN)) * 100)
    
    st.metric(label="Nilai Akhir Ujian", value=f"{nilai_akhir} / 100")
    
    st.write("---")
    st.subheader("🕵️‍♂️ Rekaman Log Perilaku Konteks Pengguna (Context Report)")
    
    st.info(f"📋 Anda tercatat berpindah tab sebanyak **{st.session_state.cheat_count}** kali selama ujian.")
    st.info(f"⏳ Anda terdeteksi meninggalkan perangkat (AFK) selama **{st.session_state.afk_duration}** detik.")
    
    # Penalti Keras jika melakukan kecurangan tab berturut-turut
    if st.session_state.cheat_count >= 3:
        st.error("Status Kelulusan: **DITANGGUKAN (Otomatis Dikunci karena Indikasi Curang / Terlalu Sering Pindah Tab)**")
    else:
        st.success("Status Kelulusan: **TERVERIFIKASI JUJUR (LULUS)**")

    if st.button("Ulangi Simulasi Ujian"):
        for key in list(st.session_state.keys()): 
            del st.session_state[key]
        st.rerun()