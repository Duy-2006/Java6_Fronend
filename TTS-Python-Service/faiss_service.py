import os
import json
import time
import logging
import numpy as np
import faiss
from embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_FILE = os.path.join(BASE_DIR, "book_index.faiss")
METADATA_FILE = os.path.join(BASE_DIR, "metadata.json")
VECTOR_DIM = 512  # Kích thước vector của OpenCLIP ViT-B-32

class FaissService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FaissService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.embedding_service = EmbeddingService()
        self.metadata = {}  # { "book_id_str": {"book_id": int, "image_url": str} }
        self.load_or_init_index()

    def load_or_init_index(self):
        if os.path.exists(INDEX_FILE) and os.path.exists(METADATA_FILE):
            try:
                start_time = time.time()
                logger.info(f"Đang tải FAISS Index từ file: {INDEX_FILE}...")
                self.index = faiss.read_index(INDEX_FILE)
                
                with open(METADATA_FILE, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    
                elapsed = (time.time() - start_time) * 1000
                logger.info(f"Tải FAISS Index thành công ({self.index.ntotal} phần tử) trong {elapsed:.2f}ms")
                return
            except Exception as e:
                logger.error(f"Lỗi khi đọc file FAISS Index/Metadata: {e}. Tạo mới Index rỗng...")
        
        # Tạo mới IndexFlatIP (Inner Product = Cosine Similarity khi vector đã chuẩn hóa)
        # Sử dụng IndexIDMap2 để hỗ trợ xóa/sửa vector theo book_id trực tiếp
        flat_index = faiss.IndexFlatIP(VECTOR_DIM)
        self.index = faiss.IndexIDMap2(flat_index)
        self.metadata = {}
        logger.info("Khởi tạo FAISS Index rỗng thành công.")

    def save(self):
        try:
            faiss.write_index(self.index, INDEX_FILE)
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(self.metadata, f, ensure_ascii=False, indent=2)
            logger.info(f"Đã lưu FAISS Index ({self.index.ntotal} phần tử) và Metadata xuống đĩa.")
        except Exception as e:
            logger.error(f"Lỗi khi lưu FAISS Index: {e}")
            raise e

    def search_image(self, image_bytes: bytes, top_k: int = 10):
        start_time = time.time()
        if self.index.ntotal == 0:
            logger.warning("FAISS Index rỗng, không thể tìm kiếm.")
            return []

        query_vector = self.embedding_service.get_embedding_from_bytes(image_bytes)
        query_batch = query_vector.reshape(1, VECTOR_DIM)

        # Giới hạn top_k không vượt quá số phần tử hiện tại
        k = min(top_k, self.index.ntotal)
        distances, ids = self.index.search(query_batch, k)

        results = []
        for dist, book_id in zip(distances[0], ids[0]):
            if book_id != -1 and dist > 0:
                # Đảm bảo similarity nằm trong khoảng 0.0 - 1.0
                sim = float(round(float(dist), 4))
                results.append({
                    "book_id": int(book_id),
                    "similarity": sim
                })

        elapsed = (time.time() - start_time) * 1000
        logger.info(f"Tìm kiếm FAISS hoàn tất trong {elapsed:.2f}ms, tìm thấy {len(results)} kết quả.")
        return results

    def build_index(self, books: list):
        start_time = time.time()
        logger.info(f"Bắt đầu xây dựng lại toàn bộ FAISS Index cho {len(books)} sách...")
        
        flat_index = faiss.IndexFlatIP(VECTOR_DIM)
        self.index = faiss.IndexIDMap2(flat_index)
        self.metadata = {}

        success_count = 0
        for b in books:
            book_id = b.get("book_id")
            image_url = b.get("image_url")
            
            if not book_id or not image_url:
                continue

            try:
                vec = self.embedding_service.get_embedding_from_url_or_path(image_url)
                vec_batch = vec.reshape(1, VECTOR_DIM)
                id_array = np.array([book_id], dtype=np.int64)
                
                self.index.add_with_ids(vec_batch, id_array)
                self.metadata[str(book_id)] = {
                    "book_id": book_id,
                    "image_url": image_url
                }
                success_count += 1
            except Exception as e:
                logger.warning(f"Bỏ qua sách ID {book_id} do lỗi sinh embedding: {e}")

        self.save()
        elapsed = (time.time() - start_time) * 1000
        logger.info(f"Hoàn thành xây dựng FAISS Index. Đã đánh chỉ mục {success_count}/{len(books)} sách trong {elapsed:.2f}ms.")
        return {"total": len(books), "indexed": success_count}

    def add_or_update_book(self, book_id: int, image_url: str):
        start_time = time.time()
        logger.info(f"Cập nhật chỉ mục FAISS cho sách ID: {book_id}...")
        
        try:
            # Xóa ID cũ nếu đã tồn tại trong FAISS index
            id_array = np.array([book_id], dtype=np.int64)
            try:
                self.index.remove_ids(id_array)
            except Exception:
                pass  # Nếu chưa có ID thì bỏ qua

            # Sinh embedding và thêm mới
            vec = self.embedding_service.get_embedding_from_url_or_path(image_url)
            vec_batch = vec.reshape(1, VECTOR_DIM)
            self.index.add_with_ids(vec_batch, id_array)
            
            self.metadata[str(book_id)] = {
                "book_id": book_id,
                "image_url": image_url
            }
            self.save()
            
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"Đã cập nhật FAISS Index thành công cho sách ID {book_id} trong {elapsed:.2f}ms")
            return True
        except Exception as e:
            logger.error(f"Lỗi khi cập nhật sách ID {book_id} vào FAISS: {e}")
            raise e

    def delete_book(self, book_id: int):
        start_time = time.time()
        logger.info(f"Xóa sách ID: {book_id} khỏi FAISS Index...")
        try:
            id_array = np.array([book_id], dtype=np.int64)
            self.index.remove_ids(id_array)
            self.metadata.pop(str(book_id), None)
            self.save()
            
            elapsed = (time.time() - start_time) * 1000
            logger.info(f"Đã xóa sách ID {book_id} khỏi FAISS trong {elapsed:.2f}ms")
            return True
        except Exception as e:
            logger.error(f"Lỗi khi xóa sách ID {book_id} khỏi FAISS: {e}")
            raise e
