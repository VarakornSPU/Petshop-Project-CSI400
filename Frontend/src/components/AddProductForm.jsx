import { useState, useEffect } from "react";
import "../style/AddProductForm.css";

export default function AddProductForm({ 
  onClose, 
  onSubmit, 
  initialData = null 
}) {
  console.log("Received onSubmit in AddProductForm:", onSubmit);
  console.log("Component stack trace:");
  console.trace();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "food",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
    images: [],
  });

  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    if (!form.images || form.images.length === 0) {
      setPreviews([]);
      return;
    }

    const objectUrls = Array.from(form.images).map((file) =>
      URL.createObjectURL(file)
    );
    setPreviews(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.images]);

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "images") {
      // แปลง FileList เป็น Array
      setForm({ ...form, images: Array.from(files) });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!onSubmit) {
      console.error("onSubmit is undefined! This component was called without onSubmit prop");
      console.trace();
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("price", form.price);
    formData.append("stock", form.stock);

    // เช็คว่า images เป็น array ก่อน
    if (Array.isArray(form.images)) {
      form.images.forEach((file) => {
        formData.append("images", file);
      });
    }

    console.log("About to call onSubmit with:", formData);
    console.log("onSubmit type:", typeof onSubmit);
    
    if (typeof onSubmit === "function") {
      onSubmit(formData);
    } else {
      console.error("onSubmit is not a function! Received:", onSubmit);
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

          <input
            type="file"
            name="images"
            onChange={handleChange}
            multiple
            accept="image/*"
          />

          <div
            className="image-preview-container"
            style={{ display: "flex", gap: 10, marginTop: 10, overflowX: "auto" }}
          >
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`preview-${i}`}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 5 }}
              />
            ))}
          </div>

          <div className="form-actions">
            <button type="submit">บันทึก</button>
            <button type="button" onClick={onClose}>
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}