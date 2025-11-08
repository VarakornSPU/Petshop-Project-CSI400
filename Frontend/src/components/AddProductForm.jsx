import { useState, useEffect } from "react";
import "../style/AddProductForm.css";

// ตัวช่วยในการสร้าง URL เต็มจาก Path (ใช้เมื่อแสดงรูปภาพเดิม)
const createFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    // ใช้ localhost:3001 เนื่องจากรูปภาพถูกเก็บไว้ที่นั่น (อ้างอิงจาก Products.js)
    return `http://localhost:3001${imagePath}`; 
};

export default function AddProductForm({ onClose, onProductAdded, initialData = null }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "food",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
  });

  // ✅ รูปภาพ: เก็บได้ทั้ง File Object (รูปใหม่) หรือ String (path รูปเดิม)
  // [String/File/null, String/File/null, ...] (สูงสุด 5 รูป)
  const [images, setImages] = useState(Array(5).fill(null)); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialData; // สถานะกำลังแก้ไข

  // ✅ 1. โหลดข้อมูลและรูปภาพเดิมเมื่อ initialData เปลี่ยน
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category || "food",
        price: initialData.price || "",
        stock: initialData.stock || "",
      });

      // ✅ เติมรูปภาพเดิม: นำ path รูปภาพเดิมมาใส่ใน state
      const initialImages = Array(5).fill(null);
      if (Array.isArray(initialData.images)) {
        initialData.images.slice(0, 5).forEach((path, i) => {
          initialImages[i] = path; // เก็บ path เป็น string
        });
      }
      setImages(initialImages);
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleImageChange(e, index) {
    const file = e.target.files[0];
    if (!file) return;
    const newImages = [...images];
    newImages[index] = file; // ✅ เก็บเป็น File Object (รูปใหม่)
    setImages(newImages);
  }

  function handleRemoveImage(index) {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  }

  // ✅ 2. จัดการ Submit สำหรับ POST หรือ PUT
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEditing 
        ? `/api/admin/products/${initialData.id}` 
        : "/api/admin/products";
    const method = isEditing ? "PUT" : "POST";
    
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("price", form.price);
      formData.append("stock", form.stock);

      const existingImagePaths = [];
      
      images.forEach((img) => {
        if (img instanceof File) {
          // ✅ รูปภาพใหม่: ใช้ field "newImages" (ตามที่กำหนดใน backend)
          formData.append("newImages", img); 
        } else if (typeof img === 'string') {
          // ✅ รูปภาพเดิม (Path String): เก็บไว้เพื่อรวมกับรูปใหม่ใน backend
          existingImagePaths.push(img); 
        }
      });
      
      // ✅ ส่ง path รูปภาพเดิมที่ยังเหลืออยู่ไปให้ Backend
      formData.append("existingImages", JSON.stringify(existingImagePaths)); 

      const res = await fetch(url, {
        method: method, // ใช้ POST หรือ PUT ตามสถานะ
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || (isEditing ? "ไม่สามารถแก้ไขสินค้าได้" : "ไม่สามารถเพิ่มสินค้าได้"));
      }

      // ✅ แจ้ง parent ว่ามีสินค้าใหม่/แก้ไข
      if (typeof onProductAdded === "function") {
        onProductAdded(data.product);
      }

      // รีเซ็ตฟอร์ม หรือปิด Modal
      if (!isEditing) {
        setForm({
          name: "",
          description: "",
          category: "food",
          price: "",
          stock: "",
        });
        setImages(Array(5).fill(null));
      }
      onClose();

    } catch (err) {
      console.error(`❌ Error ${isEditing ? 'editing' : 'adding'} product:`, err);
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  // 3. ส่วน JSX: ใช้ createFullImageUrl ในการแสดงรูปภาพเดิม
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>

        <form onSubmit={handleSubmit}>
          {/* ... ส่วน input อื่นๆ ยังคงเดิม ... */}
          <input type="text" name="name" placeholder="ชื่อสินค้า" value={form.name} onChange={handleChange} required />
          <textarea name="description" placeholder="รายละเอียดสินค้า" value={form.description} onChange={handleChange} required />
          <input type="number" name="price" placeholder="ราคา" value={form.price} onChange={handleChange} required />
          <input type="number" name="stock" placeholder="จำนวนสินค้าในสต็อก" value={form.stock} onChange={handleChange} required />
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="food">อาหาร</option>
            <option value="toys">ของเล่น</option>
            <option value="accessories">อุปกรณ์</option>
          </select>

          <div className="image-upload-section">
            {images.map((img, i) => (
              <label key={i} className="image-upload-box">
                {img ? (
                  <>
                    <img
                      // ✅ ถ้าเป็น File ใช้ URL.createObjectURL ถ้าเป็น string ใช้ createFullImageUrl
                      src={img instanceof File ? URL.createObjectURL(img) : createFullImageUrl(img)}
                      alt={`preview-${i}`}
                      className="image-preview"
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveImage(i);
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <div className="upload-placeholder">➕</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, i)}
                  // ✅ รีเซ็ต input file เมื่อมีการเลือกไฟล์ (เพื่อให้เลือกไฟล์เดิมซ้ำได้)
                  onClick={(e) => e.target.value = null} 
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={loading}>
              {loading
                ? "กำลังบันทึก..."
                : isEditing
                ? "บันทึกการแก้ไข"
                : "เพิ่มสินค้าใหม่"}
            </button>
            <button type="button" className="btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}