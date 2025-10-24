import { useState, useEffect } from "react";
import "../style/AddProductForm.css";

export default function AddProductForm({ onClose, onSubmit, initialData = null }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "food",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
  });

  // ✅ รูปภาพสูงสุด 5 รูป (เก็บไฟล์จริง)
  const [images, setImages] = useState([null, null, null, null, null]);

  // ✅ อัปเดตค่าเมื่อแก้ไขสินค้า
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        category: initialData.category || "food",
        price: initialData.price || "",
        stock: initialData.stock || "",
      });
      setImages([null, null, null, null, null]);
    }
  }, [initialData]);

  // ✅ เปลี่ยนข้อมูลในฟอร์ม
  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  // ✅ เมื่อเลือกรูปในแต่ละช่อง
  function handleImageChange(e, index) {
    const file = e.target.files[0];
    if (!file) return;

    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  }

  // ✅ ลบรูปออกจากช่อง
  function handleRemoveImage(index) {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  }

  // ✅ ส่งข้อมูลฟอร์ม
  function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("price", form.price);
    formData.append("stock", form.stock);

    images.forEach((img) => {
      if (img) formData.append("images", img);
    });

    if (typeof onSubmit === "function") {
      onSubmit(formData);
    }

    // รีเซ็ตฟอร์มเมื่อเพิ่มสินค้าใหม่
    if (!initialData) {
      setForm({
        name: "",
        description: "",
        category: "food",
        price: "",
        stock: "",
      });
      setImages([null, null, null, null, null]);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{initialData ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="ชื่อสินค้า"
            value={form.name}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="รายละเอียดสินค้า"
            value={form.description}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="price"
            placeholder="ราคา"
            value={form.price}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="stock"
            placeholder="จำนวนสินค้าในสต็อก"
            value={form.stock}
            onChange={handleChange}
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="food">อาหาร</option>
            <option value="toys">ของเล่น</option>
            <option value="accessories">อุปกรณ์</option>
          </select>

          {/* ✅ ส่วนอัปโหลดรูป 5 ช่อง */}
          <div className="image-upload-section">
            {images.map((img, i) => (
              <label key={i} className="image-upload-box">
                {img ? (
                  <>
                    <img
                      src={URL.createObjectURL(img)}
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
                  style={{ display: "none" }}
                />
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              {initialData ? "บันทึกการแก้ไข" : "เพิ่มสินค้าใหม่"}
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