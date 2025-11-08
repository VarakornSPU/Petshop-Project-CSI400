import React, { useState, useEffect } from 'react';
import AddProductForm from '../components/AddProductForm';

export default function AdminProductsPage() { // เปลี่ยนชื่อจาก AddProductPage เป็น AdminProductsPage
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false); // สถานะ Modal
  const [productToEdit, setProductToEdit] = useState(null); // ✅ เก็บข้อมูลสินค้าที่กำลังจะแก้ไข

  useEffect(() => {
    fetchProducts();
  }, []);

  // โหลดข้อมูลสินค้าจาก backend
  async function fetchProducts() {
    try {
      const res = await fetch("http://localhost:3001/api/admin/products"); 
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌ โหลดข้อมูลสินค้าไม่สำเร็จ:", err);
    }
  }
  
  // ✅ จัดการเมื่อเพิ่ม/แก้ไขสินค้าสำเร็จ (รับ data.product)
  function handleProductAddedOrUpdated(newProduct) {
      // รีเฟรชรายการ
      fetchProducts();
      // ไม่ต้อง alert แล้ว เพราะฟอร์มจัดการแล้ว
      console.log(`✅ ${productToEdit ? 'แก้ไข' : 'เพิ่ม'}สินค้าสำเร็จ:`, newProduct);
  }

  // ✅ เปิด Modal ในโหมดเพิ่มสินค้าใหม่
  function handleOpenAddModal() {
      setProductToEdit(null); // เคลียร์สถานะแก้ไข
      setIsModalOpen(true);
  }

  // ✅ เปิด Modal ในโหมดแก้ไขสินค้า
  function handleOpenEditModal(product) {
      setProductToEdit(product); // กำหนดสินค้าที่กำลังแก้ไข
      setIsModalOpen(true);
  }

  // ปิด modal
  function handleCloseModal() {
      setIsModalOpen(false);
      setProductToEdit(null); // เคลียร์ข้อมูลแก้ไขเมื่อปิด
  }

  // *ลบฟังก์ชัน handleSubmit เดิมออกไป เพราะ logic ไปอยู่ใน AddProductForm แล้ว*
  
  return (
    <div className="admin-products-page">
      <h1>จัดการสินค้า</h1>

      <button onClick={handleOpenAddModal} style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
        + เพิ่มสินค้าใหม่
      </button>

      {/* ✅ แสดง Modal เมื่อ isModalOpen เป็น true */}
      {isModalOpen && (
        <AddProductForm
          onClose={handleCloseModal} // ปิด Modal
          onProductAdded={handleProductAddedOrUpdated} // จัดการเมื่อบันทึก
          initialData={productToEdit} // ✅ ส่งข้อมูลสินค้าไปให้ฟอร์ม (null สำหรับเพิ่มใหม่, object สำหรับแก้ไข)
        />
      )}

      <hr />
      <h2>รายการสินค้าในระบบ ({products.length})</h2>

      {products.length === 0 ? (
        <p>ยังไม่มีสินค้า</p>
      ) : (
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>ชื่อสินค้า</th>
                    <th>หมวดหมู่</th>
                    <th>ราคา</th>
                    <th>สต็อก</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {products.map((p) => (
                    <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.category}</td>
                        <td>{p.price}</td>
                        <td>{p.stock}</td>
                        <td>
                            {/* ✅ เพิ่มปุ่มแก้ไข */}
                            <button 
                                onClick={() => handleOpenEditModal(p)}
                                style={{ marginRight: '10px', padding: '5px 10px', cursor: 'pointer' }}
                            >
                                แก้ไข
                            </button>
                            {/* ลบ/ดูรายละเอียด เพิ่มได้ภายหลัง */}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      )}
    </div>
  );
}