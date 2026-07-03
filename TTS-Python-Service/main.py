import os           # Dùng để kiểm tra file tồn tại và xóa file tạm trên ổ cứng
import uuid          # Tạo tên file ngẫu nhiên (UUID) để tránh xung đột khi nhiều request đến cùng lúc
import re            # Thư viện Regular Expression - dùng để tìm và xóa HTML tags trong văn bản
import logging       # Ghi log ra console để theo dõi tiến trình xử lý, dễ debug khi có lỗi
import tempfile      # Lấy thư mục tạm của hệ thống (vd: C:\Users\...\AppData\Local\Temp)

# Thư mục tạm để ghi file MP3 - KHÔNG ghi vào thư mục code để tránh kích hoạt Hot Reload
TEMP_DIR = os.path.join(tempfile.gettempdir(), "tts_audio_temp")
os.makedirs(TEMP_DIR, exist_ok=True)
from typing import List                         # Khai báo kiểu dữ liệu danh sách (List) cho Python
from fastapi import FastAPI, HTTPException      # FastAPI: framework API | HTTPException: trả lỗi HTTP chuẩn
from pydantic import BaseModel                  # BaseModel: định nghĩa schema + tự động validate dữ liệu đầu vào
import edge_tts                                 # Thư viện gọi engine Text-to-Speech của Microsoft Edge (miễn phí)
import cloudinary                               # SDK Cloudinary để kết nối và upload file lên Cloud
import cloudinary.uploader                      # Module upload cụ thể của Cloudinary SDK


# ==========================================
# 0. CẤU HÌNH LOGGER ĐỂ DỄ DÀNG DEBUG
# ==========================================
# basicConfig: thiết lập format log gồm [thời gian - cấp độ - nội dung]
# level=INFO: chỉ hiển thị log từ INFO trở lên (bỏ qua DEBUG)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)  # Tạo logger riêng cho file này, tên logger = tên module

# ==========================================
# 1. CẤU HÌNH CLOUDINARY
# ==========================================
# Khai báo thông tin đăng nhập Cloudinary - giống như đăng nhập vào tài khoản Cloud
# secure=True: luôn dùng HTTPS khi upload và lấy URL (bảo mật hơn HTTP)
cloudinary.config(
    cloud_name="dwlmpibpc",                    # Tên tài khoản Cloud (giống username)
    api_key="713195285545435",                 # Khóa API công khai (định danh ứng dụng)
    api_secret="FPtspxNYx4AIOMpCoa5qQRBDmEU", # Khóa bí mật (không được chia sẻ ra ngoài)
    secure=True                                # Bắt buộc dùng HTTPS cho mọi URL trả về
)

# Khởi tạo ứng dụng FastAPI - đây là "cửa hàng" nhận request từ Spring Boot
app = FastAPI()

# ==========================================
# ĐỊNH NGHĨA SCHEMA DỮ LIỆU ĐẦU VÀO (Pydantic Model)
# ==========================================
# TTSRequest là "khuôn mẫu" dữ liệu Spring Boot phải gửi đúng theo
# Pydantic tự động báo lỗi 422 nếu Spring Boot gửi thiếu trường hoặc sai kiểu
class TTSRequest(BaseModel):
    text_chunks: List[str]  # Danh sách các đoạn văn bản ĐÃ được Spring Boot cắt sẵn (≤1000 ký tự/đoạn)
    voice: str              # Mã giọng đọc do Admin chọn (vd: "banmai", "leminh", "nanami")

# ==========================================
# 2. BỘ CÔNG THỨC PHA CHẾ GIỌNG ĐỌC
# ==========================================
# Mỗi key là mã giọng Admin chọn, value là cấu hình gửi cho Microsoft Edge TTS
# voice: tên giọng Neural của Microsoft (ngôn ngữ-quốc gia-TênGiọngNeural)
# pitch: cao độ giọng nói (+0Hz = giữ nguyên, +50Hz = cao hơn, -50Hz = trầm hơn)
# rate:  tốc độ đọc (+0% = bình thường, +20% = nhanh hơn 20%, -10% = chậm hơn)
VOICE_PROFILES = {
    "banmai":   {"voice": "vi-VN-HoaiMyNeural",               "pitch": "+0Hz", "rate": "+0%"},  # Giọng nữ Việt Nam
    "thuminh":  {"voice": "en-US-AriaNeural",                  "pitch": "+0Hz", "rate": "+0%"},  # Giọng nữ tiếng Anh Mỹ
    "ngoclam":  {"voice": "en-US-JennyNeural",                 "pitch": "+0Hz", "rate": "+0%"},  # Giọng nữ tiếng Anh Mỹ (Jenny)
    "leminh":   {"voice": "vi-VN-NamMinhNeural",               "pitch": "+0Hz", "rate": "+0%"},  # Giọng nam Việt Nam
    "giahuy":   {"voice": "en-US-GuyNeural",                   "pitch": "+0Hz", "rate": "+0%"},  # Giọng nam tiếng Anh Mỹ
    "baotin":   {"voice": "en-US-ChristopherNeural",           "pitch": "+0Hz", "rate": "+0%"},  # Giọng nam tiếng Anh Mỹ (Christopher)
    "vyvy":     {"voice": "fr-FR-VivienneMultilingualNeural",  "pitch": "+0Hz", "rate": "+0%"},  # Giọng nữ tiếng Pháp đa ngôn ngữ
    "phuocloc": {"voice": "de-DE-FlorianMultilingualNeural",   "pitch": "+0Hz", "rate": "+0%"},  # Giọng nam tiếng Đức đa ngôn ngữ
    "nanami":   {"voice": "ja-JP-NanamiNeural",                "pitch": "+0Hz", "rate": "+0%"},  # Giọng nữ tiếng Nhật
    "keita":    {"voice": "ja-JP-KeitaNeural",                 "pitch": "+0Hz", "rate": "+0%"}   # Giọng nam tiếng Nhật
}

# ==========================================
# HÀM TIỆN ÍCH: LÀM SẠCH VĂN BẢN (Lần 2)
# ==========================================
# Lần 1 đã được Java (sanitizeText) làm sạch trước khi gửi sang
# Lần 2 này là lớp bảo vệ thứ 2 tại Python, đảm bảo 100% văn bản sạch trước khi đưa vào TTS
def clean_text(text: str) -> str:
    cleaned = re.sub(r'<.*?>', ' ', text)        # Xóa toàn bộ HTML tags (vd: <p>, <b>, <br/>) thay bằng khoảng trắng
    return re.sub(r'\s+', ' ', cleaned).strip()  # Gộp nhiều khoảng trắng liền nhau thành 1, xóa đầu/cuối

# ==========================================
# 3. API ENDPOINT CHÍNH: XỬ LÝ CHUYỂN ĐỔI VÀ NỐI ÂM THANH
# ==========================================
# Đây là cổng duy nhất nhận request từ Spring Boot
# Spring Boot gọi: POST http://localhost:8000/api/generate-audio
@app.post("/api/generate-audio")
async def generate_audio(request: TTSRequest):
    temp_files = []  # Danh sách tên file tạm cần xóa sau khi xong (dọn dẹp ổ cứng)

    # Tạo tên file ngẫu nhiên bằng UUID để tránh 2 request cùng lúc ghi đè lên nhau
    # vd: "C:\Users\...\Temp\tts_audio_temp\final_audio_a3f7c2d1e5b8f0924a1c6d8e.mp3"
    final_filename = os.path.join(TEMP_DIR, f"final_audio_{uuid.uuid4().hex}.mp3")
    
    try:
        # Chuẩn hóa mã giọng: chuyển thường + xóa khoảng trắng thừa (tránh lỗi "BanMai " không tìm thấy)
        requested_voice = request.voice.lower().strip()

        # Tìm cấu hình giọng theo mã, nếu không có trong danh sách → dùng giọng nữ Việt Nam mặc định
        profile = VOICE_PROFILES.get(
            requested_voice,
            {"voice": "vi-VN-HoaiMyNeural", "pitch": "+0Hz", "rate": "+0%"}  # Giọng mặc định khi không tìm thấy
        )
        
        # ── BƯỚC 1: LỌC CHUNK RỖng ──────────────────────────────────────────────
        # Làm sạch từng chunk và chỉ giữ lại những chunk có nội dung sau khi làm sạch
        # (Một số chunk có thể chỉ chứa HTML tags, sau khi xóa thì rỗng hoàn toàn)
        valid_chunks = [clean_text(chunk) for chunk in request.text_chunks if clean_text(chunk)]
        
        # Nếu toàn bộ văn bản rỗng sau khi làm sạch → trả về file âm thanh im lặng 250ms
        # (Tránh crash, trả về kết quả hợp lệ thay vì lỗi)
        if not valid_chunks:
            logger.warning("Văn bản rỗng. Trả về âm thanh trống.")
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        logger.info(f"Bắt đầu đọc: {requested_voice} | Số lượng chunks: {len(valid_chunks)}")

        # ── CẤU HÌNH THAM SỐ CHO EDGE TTS ──────────────────────────────────────
        # Chỉ truyền rate/pitch vào edge_tts khi khác giá trị mặc định
        # (Truyền +0% hoặc +0Hz sẽ gây lỗi với một số phiên bản edge-tts)
        kwargs = {}
        if profile.get("rate") and profile["rate"] != "+0%":
            kwargs["rate"] = profile["rate"]   # Tốc độ đọc (chỉ thêm nếu không phải mặc định)
        if profile.get("pitch") and profile["pitch"] != "+0Hz":
            kwargs["pitch"] = profile["pitch"] # Cao độ giọng (chỉ thêm nếu không phải mặc định)

        # ── BƯỚC 2: GỌI MICROSOFT EDGE TTS CHO TỪNG CHUNK ──────────────────────
        # Xử lý tuần tự từng đoạn văn bản, mỗi đoạn → 1 file MP3 tạm trên ổ cứng
        for i, chunk in enumerate(valid_chunks):
            # Đặt tên file tạm có UUID + số thứ tự để dễ debug và tránh trùng tên
            temp_filename = os.path.join(TEMP_DIR, f"chunk_{uuid.uuid4().hex}_{i}.mp3")
            
            try:
                # Khởi tạo đối tượng TTS với văn bản + giọng đọc đã chọn
                # edge_tts.Communicate sẽ kết nối đến server Microsoft Edge để chuyển đổi
                communicate = edge_tts.Communicate(
                    text=chunk,           # Đoạn văn bản cần đọc (≤1000 ký tự)
                    voice=profile["voice"], # Giọng Neural của Microsoft (vd: "vi-VN-HoaiMyNeural")
                    **kwargs              # Truyền thêm rate/pitch nếu có
                )
                await communicate.save(temp_filename)  # Lưu kết quả thành file MP3 tạm trên ổ cứng
                temp_files.append(temp_filename)        # Ghi nhớ tên file để xóa sau
                logger.info(f" Đã xử lý xong chunk {i + 1}/{len(valid_chunks)}")

            except edge_tts.exceptions.NoAudioReceived:
                # Lỗi này xảy ra khi chunk chỉ chứa số, ký hiệu đặc biệt, không đọc được
                # → Bỏ qua chunk này, tiếp tục chunk tiếp theo (không crash toàn bộ)
                logger.warning(f" Chunk {i + 1} bị lỗi (chỉ chứa ký tự không thể đọc). Đã bỏ qua đoạn này.")
                continue
            except Exception as chunk_error:
                # Lỗi bất ngờ khác (mất mạng, timeout server Microsoft...) → cũng bỏ qua chunk đó
                import traceback
                chunk_err_details = traceback.format_exc()
                logger.warning(f" Lỗi không mong muốn ở chunk {i + 1}:\n{chunk_err_details}\nĐã bỏ qua đoạn này.")
                continue

        # Nếu TẤT CẢ chunks đều lỗi → không có file nào tạo ra → trả về file im lặng
        if not temp_files:
            logger.warning("Toàn bộ các chunk đều không thể đọc được. Trả về file âm thanh trống.")
            return {
                "status": "success",
                "audio_url": "https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3"
            }

        # ── BƯỚC 3: GHÉP NỐI BINARY (KHÔNG CẦN FFMPEG) ─────────────────────────
        # Nguyên lý: File MP3 gồm các "Frame" độc lập, mỗi frame tự chứa đủ header
        # → Ghép byte của nhiều file MP3 = nối các frame → trình phát đọc tuần tự = âm thanh liền mạch
        # Ưu điểm: Nhanh, không cần cài FFMPEG, không re-encode (không mất chất lượng)
        logger.info("Đang ghép nối các đoạn âm thanh (chế độ Binary)...")
        
        with open(final_filename, 'wb') as outfile:    # Mở file đích ở chế độ ghi nhị phân (wb = write binary)
            for file in temp_files:
                with open(file, 'rb') as infile:       # Đọc từng file tạm ở chế độ nhị phân (rb = read binary)
                    outfile.write(infile.read())        # Ghi thẳng toàn bộ bytes vào file đích (không chỉnh sửa)
                    
        temp_files.append(final_filename)  # Thêm file đích vào danh sách cần xóa (dọn dẹp sau upload)
        
        # ── BƯỚC 4: UPLOAD FILE HOÀN CHỈNH LÊN CLOUDINARY ──────────────────────
        # Sau khi ghép xong → upload 1 file MP3 duy nhất lên Cloudinary CDN
        logger.info("Tiến hành Upload lên Cloudinary...")
        upload_result = cloudinary.uploader.upload(
            final_filename,          # Đường dẫn file MP3 trên ổ cứng cần upload
            resource_type="video",   # Phân loại file: MP3/audio trong Cloudinary thuộc nhóm "video" (không phải "image")
            folder="audiobooks"      # Lưu vào thư mục "audiobooks" trên Cloudinary để dễ quản lý
        )
        
        # Lấy URL HTTPS của file vừa upload - đây là link vĩnh viễn trên Cloudinary CDN
        final_url = upload_result["secure_url"]
        logger.info(f"Hoàn tất Upload! Link: {final_url}")
        
        # Trả kết quả về cho Spring Boot: JSON chứa URL audio trên Cloudinary
        # Spring Boot sẽ lưu URL này vào database SQL Server
        return {
            "status": "success",
            "audio_url": final_url   # URL dạng: https://res.cloudinary.com/dwlmpibpc/video/upload/audiobooks/...mp3
        }

    except Exception as e:
        # Bắt mọi lỗi không mong muốn (lỗi mạng, Cloudinary từ chối, ổ cứng đầy...)
        # In chi tiết lỗi để dễ tìm nguyên nhân, sau đó trả lỗi HTTP 500 về Spring Boot
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"================ CHI TIẾT LỖI HỆ THỐNG ================\n{error_details}\n========================================================")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # ── BƯỚC 5: DỌN DẸP FILE TẠM (LUÔN CHẠY DÙ THÀNH CÔNG HAY LỖI) ────────
        # Khối "finally" đặc biệt: Python đảm bảo nó LUÔN LUÔN được thực thi
        # dù try thành công, dù có exception, dù có return ở giữa
        # → Đảm bảo 100% file tạm trên ổ cứng được xóa → tránh đầy ổ cứng server theo thời gian
        logger.info("Bắt đầu dọn dẹp file tạm local...")
        for file in temp_files:
            if os.path.exists(file):  # Kiểm tra file có tồn tại không trước khi xóa (tránh lỗi nếu chưa tạo)
                try:
                    os.remove(file)   # Xóa file khỏi ổ cứng vĩnh viễn
                    logger.debug(f"Đã xóa file: {file}")
                except Exception as cleanup_error:
                    # Nếu xóa thất bại (file đang bị lock, quyền truy cập...) → chỉ cảnh báo, không crash
                    logger.warning(f"Không thể xóa file {file}: {str(cleanup_error)}")