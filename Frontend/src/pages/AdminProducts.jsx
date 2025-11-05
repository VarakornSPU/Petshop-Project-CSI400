import AddProductForm from '../components/AddProductForm';

console.log("Imported AddProductForm:", AddProductForm);

export default function AddProductPage() {
  const [products, setProducts] = useState([]);

  // โหลดข้อมูลสินค้าจาก backend
async function fetchProducts() {
  try {
    const res = await fetch("http://localhost:3001/api/admin/products"); // ✅ ใช้ URL เต็ม
    const data = await res.json();
    setProducts(data);
  } catch (err) {
    console.error("❌ โหลดข้อมูลสินค้าไม่สำเร็จ:", err);
  }
}

async function handleSubmit(formData) {
  try {
    const res = await fetch("/api/admin/products", { 
      method: "POST",
      body: formData,
    });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "เพิ่มสินค้าไม่สำเร็จ");

      // เพิ่มสินค้าใหม่เข้า state ทันที
      setProducts(prev => [...prev, data.product]);

      console.log("✅ เพิ่มสินค้าสำเร็จ:", data.product);
    } catch (err) {
      console.error("❌ เกิดข้อผิดพลาดในการเพิ่มสินค้า:", err);
      alert(err.message);
    }
  }

  // ปิด modal หรือฟอร์ม
  function handleClose() {
    console.log("ปิดฟอร์ม");
  }

  return (
    <div className="add-product-page">
      <h1>เพิ่มสินค้าใหม่</h1>

      <AddProductForm
        onSubmit={handleSubmit}
        onClose={handleClose}
      />

      <hr />
      <h2>รายการสินค้าในระบบ</h2>

      {products.length === 0 ? (
        <p>ยังไม่มีสินค้า</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              {p.name} — {p.category} — {p.price} บาท
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}