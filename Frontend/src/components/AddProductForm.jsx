// frontend/src/components/AddProductForm.jsx
import { useState } from "react";
import "../style/AddProductForm.css";

export default function AddProductForm({ onClose, onSubmit, initialData = null }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "food",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
    images: [], // multiple files
  });

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "images") {
      setForm({ ...form, images: files });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("price", form.price);
    formData.append("stock", form.stock);

    for (let i = 0; i < form.images.length; i++) {
      formData.append("images", form.images[i]);
    }

    onSubmit(formData); // call parent
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
          ></textarea>
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
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="food">อาหาร</option>
            <option value="toys">ของเล่น</option>
            <option value="accessories">อุปกรณ์</option>
          </select>
          <input type="file" name="images" onChange={handleChange} multiple />

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