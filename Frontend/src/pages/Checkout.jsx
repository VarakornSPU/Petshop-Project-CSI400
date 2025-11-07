import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import "../style/Checkout.css"

export default function Checkout() {
  const { cartItems, clearCart } = useCart()
  const { user, token, isAuthenticated } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("mock")

  // addresses
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState("")

  const [newAddress, setNewAddress] = useState({
    recipientName: user?.first_name || "",
    phone: user?.phone || "",
    addressLine1: "",
    addressLine2: "",
    subdistrict: "",
    district: "",
    province: "",
    postalCode: "",
    isDefault: false,
  })

  const navigate = useNavigate()
  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0)
  const shippingFee = 0
  const total = subtotal + shippingFee
  const canCreateOrder =
    isAuthenticated &&
    cartItems.length > 0 &&
    (selectedAddressId || showAddAddress === false ? Boolean(selectedAddressId) : false)

  useEffect(() => {
    let mounted = true
    if (!token) {
      setSavedAddresses([])
      setSelectedAddressId(null)
      return
    }

    const loadAddresses = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/addresses", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!mounted) return
        const list = Array.isArray(res.data) ? res.data : res.data.addresses || []
        setSavedAddresses(list)
        const def = list.find((a) => a.is_default) || list[0]
        if (def) {
          setSelectedAddressId(def.id)
          setShowAddAddress(false)
        } else {
          setSelectedAddressId(null)
          setShowAddAddress(list.length === 0) // show add form when no addresses
        }
      } catch (err) {
        console.error("load addresses:", err.response?.data || err.message)
        setSavedAddresses([])
        setSelectedAddressId(null)
        setShowAddAddress(true)
      }
    }

    loadAddresses()
    return () => {
      mounted = false
    }
  }, [token])

  function shippingFromSelected() {
    if (!selectedAddressId) return null
    const a = savedAddresses.find((x) => x.id === Number(selectedAddressId))
    if (!a) return null
    return {
      name: a.recipient_name,
      phone: a.phone,
      line1: a.address_line1,
      subdistrict: a.subdistrict,
      district: a.district,
      province: a.province,
      postal_code: a.postal_code,
    }
  }

  const handleCreateOrder = async () => {
    setErrorMsg("")
    if (!isAuthenticated) return setErrorMsg("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ")
    if (cartItems.length === 0) return setErrorMsg("ตะกร้าว่าง")

    const selectedShipping = shippingFromSelected()
    if (!selectedShipping && !showAddAddress) {
      return setErrorMsg("กรุณาเลือกที่อยู่หรือเพิ่มที่อยู่ใหม่ก่อนสั่งซื้อ")
    }

    // if add form visible, user must have created address (we require selectedAddressId)
    if (showAddAddress && !selectedAddressId) {
      return setErrorMsg("กรุณาเพิ่มที่อยู่แล้วเลือกที่อยู่ก่อนยืนยันคำสั่งซื้อ")
    }

    setLoading(true)
    try {
      const finalShipping = selectedShipping
      if (!finalShipping) {
        setLoading(false)
        return setErrorMsg("ที่อยู่ไม่ถูกต้อง")
      }

      const payload = {
        items: cartItems.map((i) => ({
          product_id: i.id,
          product_name: i.name,
          product_price: i.price,
          quantity: i.quantity,
          subtotal: Number(i.price) * Number(i.quantity),
        })),
        shipping: finalShipping,
        subtotal,
        shipping_fee: shippingFee,
        total,
      }
      const res = await axios.post("http://localhost:3001/api/orders", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const created = res.data.order || res.data
      if (created && created.total) created.total = Number(created.total)
      setOrder(created)
      setErrorMsg("")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error("create order error", err.response?.data || err.message)
      setErrorMsg(err.response?.data?.error || "ไม่สามารถสร้างคำสั่งซื้อได้")
    } finally {
      setLoading(false)
    }
  }

  const handleMockPayment = async () => {
    setErrorMsg("")
    if (!order) return setErrorMsg("ต้องสร้างคำสั่งซื้อก่อนชำระเงิน")
    setLoading(true)
    try {
      const p = await axios.post(
        "http://localhost:3001/api/payments",
        {
          order_id: order.id,
          amount: order.total ?? total,
          payment_method: paymentMethod, // <-- ใช้ค่านี้
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      const payment = p.data.payment
      await axios.put(
        `http://localhost:3001/api/payments/${payment.id}/success`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      await clearCart()
      alert("ชำระเงินสำเร็จ (จำลอง)")
      navigate("/my-orders")
    } catch (err) {
      console.error("payment error", err.response?.data || err.message)
      setErrorMsg(err.response?.data?.error || "เกิดปัญหาขณะชำระเงิน")
    } finally {
      setLoading(false)
    }
  }

  // --- Add new address flow ---
  const handleNewAddressChange = (e) => {
    const { name, value, type, checked } = e.target
    setNewAddress((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    setAddError("")
    // minimal validation
    if (
      !newAddress.recipientName ||
      !newAddress.phone ||
      !newAddress.addressLine1 ||
      !newAddress.subdistrict ||
      !newAddress.district ||
      !newAddress.province ||
      !/^[0-9]{5}$/.test(newAddress.postalCode)
    ) {
      return setAddError("กรุณากรอกข้อมูลที่อยู่ให้ครบและรหัสไปรษณีย์ 5 หลัก")
    }
    setAddLoading(true)
    try {
      const payload = {
        recipientName: newAddress.recipientName,
        phone: newAddress.phone,
        addressLine1: newAddress.addressLine1,
        addressLine2: newAddress.addressLine2,
        subdistrict: newAddress.subdistrict,
        district: newAddress.district,
        province: newAddress.province,
        postalCode: newAddress.postalCode,
        isDefault: newAddress.isDefault,
      }
      const res = await axios.post("http://localhost:3001/api/addresses", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const created = res.data.address || res.data
      // update list and select it
      const updated = created ? [created, ...savedAddresses] : savedAddresses
      setSavedAddresses(updated)
      if (created && created.id) {
        setSelectedAddressId(created.id)
        setShowAddAddress(false)
      }
      setAddError("")
    } catch (err) {
      console.error("add address error", err.response?.data || err.message)
      setAddError(err.response?.data?.error || "ไม่สามารถบันทึกที่อยู่ได้")
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h2>ชำระเงิน</h2>
      </div>

      {errorMsg && <div className="alert-error">{errorMsg}</div>}

      <div className="checkout-layout">
        <div className="checkout-main">
          {/* Cart Items Section */}
          <section className="checkout-section">
            <h3 className="section-title">
              รายการสินค้า
              <span className="section-title-badge">{cartItems.length} รายการ</span>
            </h3>
            {cartItems.length === 0 ? (
              <div className="cart-empty">ตะกร้าว่าง</div>
            ) : (
              <div>
                {cartItems.map((i) => (
                  <div key={i.id} className="cart-item">
                    <img
                      alt={i.name}
                      src={
                        (i.image && (i.image.startsWith("http") ? i.image : `http://localhost:3001${i.image}`)) ||
                        "/placeholder.png"
                      }
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.src = "/placeholder.png"
                      }}
                    />
                    <div className="cart-item-details">
                      <div className="cart-item-name">{i.name}</div>
                      {i.description && <div className="cart-item-description">{i.description}</div>}
                      <div className="cart-item-price">
                        จำนวน: {i.quantity} × ฿{Number(i.price).toFixed(2)} = ฿
                        {(Number(i.price) * Number(i.quantity)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Shipping Address Section */}
          <section className="checkout-section">
            <h3 className="section-title">ที่อยู่จัดส่ง</h3>

            {savedAddresses.length > 0 && !showAddAddress && (
              <div>
                <div className="address-select-group">
                  <select
                    value={selectedAddressId || ""}
                    onChange={(e) => setSelectedAddressId(Number(e.target.value) || null)}
                  >
                    <option value="">-- เลือกที่อยู่ --</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.recipient_name} — {a.address_line1} {a.subdistrict} {a.district} {a.province} {a.postal_code}{" "}
                        {a.is_default ? "(ค่าเริ่มต้น)" : ""}
                      </option>
                    ))}
                  </select>
                  <button className="btn-secondary" onClick={() => setShowAddAddress(true)}>
                    เพิ่มที่อยู่ใหม่
                  </button>
                  <button className="btn-secondary" onClick={() => navigate("/addresses")}>
                    จัดการที่อยู่
                  </button>
                </div>
              </div>
            )}

            {(showAddAddress || savedAddresses.length === 0) && (
              <form onSubmit={handleAddAddress} className="address-form">
                {addError && <div className="form-error">{addError}</div>}
                <input
                  name="recipientName"
                  value={newAddress.recipientName}
                  onChange={handleNewAddressChange}
                  placeholder="ชื่อผู้รับ"
                />
                <input name="phone" value={newAddress.phone} onChange={handleNewAddressChange} placeholder="เบอร์โทร" />
                <input
                  name="addressLine1"
                  value={newAddress.addressLine1}
                  onChange={handleNewAddressChange}
                  placeholder="ที่อยู่ (บรรทัด 1)"
                />
                <input
                  name="addressLine2"
                  value={newAddress.addressLine2}
                  onChange={handleNewAddressChange}
                  placeholder="ที่อยู่ (บรรทัด 2) - ไม่บังคับ"
                />
                <input
                  name="subdistrict"
                  value={newAddress.subdistrict}
                  onChange={handleNewAddressChange}
                  placeholder="ตำบล/แขวง"
                />
                <input
                  name="district"
                  value={newAddress.district}
                  onChange={handleNewAddressChange}
                  placeholder="อำเภอ/เขต"
                />
                <input
                  name="province"
                  value={newAddress.province}
                  onChange={handleNewAddressChange}
                  placeholder="จังหวัด"
                />
                <input
                  name="postalCode"
                  value={newAddress.postalCode}
                  onChange={handleNewAddressChange}
                  placeholder="รหัสไปรษณีย์ (5 หลัก)"
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={newAddress.isDefault}
                    onChange={handleNewAddressChange}
                  />
                  ตั้งเป็นที่อยู่เริ่มต้น
                </label>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={addLoading}>
                    {addLoading ? "กำลังบันทึก..." : "บันทึกที่อยู่"}
                  </button>
                  {savedAddresses.length > 0 && (
                    <button type="button" className="btn-secondary" onClick={() => setShowAddAddress(false)}>
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* Payment Method Section */}
          <section className="checkout-section">
            <h3 className="section-title">วิธีการชำระเงิน</h3>
            <div className="payment-select-group">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="mock">จำลอง (Mock)</option>
                <option value="credit_card">บัตรเครดิต</option>
                <option value="bank_transfer">โอนผ่านธนาคาร</option>
                <option value="cash_on_delivery">เก็บเงินปลายทาง</option>
              </select>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-sidebar">
          <div className="order-summary">
            <h3 className="order-summary-title">สรุปคำสั่งซื้อ</h3>

            <div className="order-summary-row">
              <span>รวมย่อย</span>
              <span>฿{subtotal.toFixed(2)}</span>
            </div>
            <div className="order-summary-row">
              <span>ค่าจัดส่ง</span>
              <span>฿{shippingFee.toFixed(2)}</span>
            </div>
            <div className="order-summary-row total">
              <span>รวมทั้งสิ้น</span>
              <span>฿{total.toFixed(2)}</span>
            </div>

            {!order ? (
              <button
                onClick={handleCreateOrder}
                disabled={loading || cartItems.length === 0 || !isAuthenticated || !selectedAddressId}
                className="btn-primary-confirm-order-button"
                style={{ marginTop: "1.5rem" }}
              >
                {loading ? "กำลังสร้างคำสั่งซื้อ..." : "ยืนยันคำสั่งซื้อ"}
              </button>
            ) : (
              <div style={{ marginTop: "1.5rem" }}>
                <div className="order-created-info">
                  <strong>คำสั่งซื้อหมายเลข:</strong> #{order.id}
                  <br />
                  <small>สถานะ: {order.status || "pending"}</small>
                </div>
                <button onClick={handleMockPayment} disabled={loading} className="btn-primary">
                  {loading ? "กำลังชำระ..." : "ชำระเงิน"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
