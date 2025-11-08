import { useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "../context/AuthContext"
import "../style/MyOrders.css"

export default function MyOrders() {
    const { token } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [confirmingOrder, setConfirmingOrder] = useState(null)
    const [cancellingOrder, setCancellingOrder] = useState(null)
    const [processingPayment, setProcessingPayment] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState("credit_card") // วิธีชำระเงิน

    useEffect(() => {
        if (!token) return
        fetchOrders()
    }, [token])

    const fetchOrders = async () => {
        try {
            const res = await axios.get("http://localhost:3001/api/orders", {
                headers: { Authorization: `Bearer ${token}` },
            })
            setOrders(res.data.orders || [])
        } catch (err) {
            console.error("Fetch orders error:", err)
        } finally {
            setLoading(false)
        }
    }

    // ฟังก์ชันแสดงชื่อขนส่งเป็นภาษาไทย
    const getCourierName = (courierMethod) => {
        const courierMap = {
            thailand_post: "ไปรษณีย์ไทย",
            flash_express: "Flash Express",
            jnt_express: "J&T Express",
            rider: "ไรเดอร์",
            standard: "มาตรฐาน",
        }
        return courierMap[courierMethod] || courierMethod || "ไม่ระบุ"
    }

    // ฟังก์ชันตรวจสอบสถานะการชำระเงินที่ถูกต้อง
    const checkPaymentStatus = (order) => {
        // ถ้าคำสั่งซื้อนี้ถูกยกเลิกแล้ว ให้คืน false ทันที (ไม่ต้องรอชำระ)
        if (order.status === 'cancelled') return false;

        // ถ้ามี payments ให้ตรวจสอบจาก payment_status
        if (order.payments && order.payments.length > 0) {
            const hasPaidPayment = order.payments.some(p =>
                ['paid', 'completed', 'success'].includes(p.payment_status)
            );
            return hasPaidPayment;
        }

        // ถ้าไม่มี payments ให้ตรวจสอบจาก order status
        return ['paid', 'completed'].includes(order.status);
    };


    // ฟังก์ชันชำระเงิน (เหมือนใน Checkout)
    const handlePayment = async (orderId) => {
        if (!window.confirm(`คุณต้องการชำระเงินสำหรับคำสั่งซื้อ #${orderId} ใช่หรือไม่?`)) {
            return;
        }

        setProcessingPayment(orderId);
        try {
            // ขั้นตอนที่ 1: สร้าง payment (pending)
            const createRes = await axios.post(
                "http://localhost:3001/api/payments",
                {
                    order_id: orderId,
                    amount: orders.find(o => o.id === orderId)?.total,
                    payment_method: paymentMethod,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const payment = createRes.data.payment;

            // ขั้นตอนที่ 2: ยืนยัน payment เป็น success (mock)
            await axios.put(
                `http://localhost:3001/api/payments/${payment.id}/success`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            alert("✅ ชำระเงินสำเร็จ!");
            fetchOrders(); // โหลด orders ใหม่เพื่ออัพเดตสถานะ

        } catch (err) {
            console.error("Payment error:", err);
            alert(err.response?.data?.error || "❌ ไม่สามารถชำระเงินได้");
        } finally {
            setProcessingPayment(null);
        }
    }

    // ฟังก์ชันยกเลิกคำสั่งซื้อ
    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?")) return;

        setCancellingOrder(orderId);
        try {
            const res = await axios.put(
                `http://localhost:3001/api/orders/${orderId}/cancel`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            alert("✅ ยกเลิกคำสั่งซื้อสำเร็จ และคืนสต็อกแล้ว");

            setOrders(prev =>
                prev.map(o =>
                    o.id === orderId
                        ? { ...o, status: "cancelled" }
                        : o
                )
            );
        } catch (err) {
            console.error("Cancel order error:", err);
            alert(err.response?.data?.error || "❌ ไม่สามารถยกเลิกคำสั่งซื้อได้");
        } finally {
            setCancellingOrder(null);
        }
    };

    // ฟังก์ชันยืนยันรับสินค้า
    const handleConfirmDelivery = async (orderId) => {
        const order = orders.find(o => o.id === orderId)

        // ตรวจสอบว่ามีการชำระเงินแล้ว
        const hasPaidPayment = checkPaymentStatus(order)

        if (!hasPaidPayment) {
            alert("❌ ยังไม่มีการชำระเงิน ไม่สามารถยืนยันรับสินค้าได้")
            return
        }

        if (!window.confirm("คุณต้องการยืนยันว่าได้รับสินค้าแล้วใช่หรือไม่?")) {
            return
        }

        setConfirmingOrder(orderId)
        try {
            const res = await axios.put(
                `http://localhost:3001/api/orders/${orderId}/confirm-delivery`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )

            alert("✅ ยืนยันรับสินค้าสำเร็จ")

            setOrders(prev =>
                prev.map(o =>
                    o.id === orderId
                        ? { ...o, status: "completed", delivered_at: new Date().toISOString() }
                        : o
                )
            )
        } catch (err) {
            console.error("Confirm delivery error:", err)
            alert(err.response?.data?.error || "❌ ไม่สามารถยืนยันรับสินค้าได้")
        } finally {
            setConfirmingOrder(null)
        }
    }

    // ฟังก์ชันแสดงสถานะเป็นภาษาไทย
    const getStatusDisplay = (status) => {
        const statusMap = {
            pending_payment: { label: "รอชำระเงิน", color: "#ffa500" },
            paid: { label: "ชำระแล้ว", color: "#4CAF50" },
            preparing: { label: "กำลังเตรียมสินค้า", color: "#2196F3" },
            ready_to_ship: { label: "พร้อมจัดส่ง", color: "#9C27B0" },
            shipping: { label: "กำลังจัดส่ง", color: "#FF9800" },
            completed: { label: "สำเร็จ", color: "#4CAF50" },
            cancelled: { label: "ยกเลิก", color: "#f44336" },
            canceled: { label: "ยกเลิก", color: "#f44336" },
        }
        return statusMap[status] || { label: status, color: "#999" }
    }

    // ตรวจสอบสถานะที่สามารถดำเนินการได้
    const getOrderActions = (order) => {
        const actions = []
        const hasPaidPayment = checkPaymentStatus(order)

        // ชำระเงิน — เฉพาะคำสั่งที่ยังไม่จ่ายและยังไม่ถูกยกเลิก
        if (
            order.status !== "cancelled" &&
            (order.status === "pending_payment" || !hasPaidPayment) &&
            !hasPaidPayment
        ) {
            actions.push({
                label: processingPayment === order.id ? "กำลังชำระ..." : "ชำระเงิน",
                action: () => handlePayment(order.id),
                disabled: processingPayment === order.id,
                style: { backgroundColor: "#4CAF50" }
            });
        }

        // ยกเลิก — เฉพาะคำสั่งซื้อที่ยังไม่สำเร็จหรือจัดส่ง และยังไม่ชำระเงิน และยังไม่ถูกยกเลิก
        if (
            order.status !== "cancelled" &&
            ["pending_payment", "paid", "preparing"].includes(order.status) &&
            !hasPaidPayment
        ) {
            actions.push({
                label: cancellingOrder === order.id ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ",
                action: () => handleCancelOrder(order.id),
                disabled: cancellingOrder === order.id,
                style: { backgroundColor: "#f44336" }
            });
        }


        // ยืนยันรับสินค้า - เฉพาะที่กำลังจัดส่งและชำระเงินแล้ว
        if (order.status === "shipping" && hasPaidPayment) {
            actions.push({
                label: confirmingOrder === order.id ? "กำลังยืนยัน..." : "✓ ยืนยันรับสินค้า",
                action: () => handleConfirmDelivery(order.id),
                disabled: confirmingOrder === order.id,
                style: { backgroundColor: "#2196F3" }
            })
        }

        return actions
    }

    if (loading) return <div className="orders-loading">กำลังโหลดคำสั่งซื้อ...</div>
    if (orders.length === 0) return <div className="orders-empty">ยังไม่มีคำสั่งซื้อ</div>

    return (
        <div className="orders-container">
            <div className="orders-header">
                <h2>คำสั่งซื้อของฉัน</h2>
            </div>

            {orders.map((o) => {
                const statusInfo = getStatusDisplay(o.status)
                const actions = getOrderActions(o)
                const hasPaidPayment = checkPaymentStatus(o)

                return (
                    <div key={o.id} className="order-card">
                        <div className="order-header">
                            <span className="order-number">คำสั่งซื้อ #{o.id}</span>
                            <span
                                className={`order-status-badge ${o.status || "pending"}`}
                                style={{ backgroundColor: statusInfo.color }}
                            >
                                {statusInfo.label}
                            </span>
                        </div>

                        <div className="order-info-grid">
                            <div className="order-info-item">
                                <span className="order-info-label">ยอดรวม</span>
                                <span className="order-info-value">฿{Number(o.total).toFixed(2)}</span>
                            </div>
                            <div className="order-info-item">
                                <span className="order-info-label">วันที่สั่งซื้อ</span>
                                <span className="order-info-value">
                                    {o.created_at_local
                                        ? o.created_at_local
                                        : new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                                </span>
                            </div>
                            <div className="order-info-item">
                                <span className="order-info-label">ขนส่ง</span>
                                <span className="order-info-value">{getCourierName(o.courier_method)}</span>
                            </div>
                            <div className="order-info-item">
                                <span className="order-info-label">สถานะการชำระเงิน</span>
                                <span
                                    className="order-info-value"
                                    style={{
                                        color:
                                            o.status === "cancelled"
                                                ? "#f44336" // สีแดง
                                                : hasPaidPayment
                                                    ? "#4CAF50"
                                                    : "#ffa500",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {o.status === "cancelled"
                                        ? "❌ ยกเลิกแล้ว"
                                        : hasPaidPayment
                                            ? "✅ ชำระแล้ว"
                                            : "⏳ รอชำระเงิน"}
                                </span>
                            </div>

                        </div>

                        {/* แสดงข้อมูลการจัดส่ง */}
                        {o.tracking_number && (
                            <div className="order-tracking">
                                <strong>เลขพัสดุ:</strong> {o.tracking_number}
                                {o.courier && <span> ({o.courier})</span>}
                            </div>
                        )}

                        <details className="order-details">
                            <summary>รายการสินค้า ({o.items?.length || 0} รายการ)</summary>
                            <div className="order-details-content">
                                <ul className="order-items-list">
                                    {(o.items || []).map((it) => (
                                        <li key={it.id} className="order-item">
                                            <span className="order-item-name">{it.product_name}</span>
                                            <span className="order-item-quantity">x {it.quantity}</span>
                                            <span className="order-item-subtotal">฿{Number(it.subtotal).toFixed(2)}</span>
                                        </li>
                                    ))}
                                    {o.shipping_fee > 0 && (
                                        <li className="order-item" style={{ borderTop: "1px solid #eee", marginTop: "8px", paddingTop: "8px", fontWeight: "600" }}>
                                            <span className="order-item-name">ค่าจัดส่ง</span>
                                            <span className="order-item-subtotal">฿{Number(o.shipping_fee).toFixed(2)}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </details>

                        <details className="order-details">
                            <summary>การชำระเงิน ({o.payments?.length || 0})</summary>
                            <div className="order-details-content">
                                <ul className="payment-list">
                                    {(o.payments || []).map((p) => (
                                        <li key={p.id} className="payment-item">
                                            <span className="payment-method">{p.payment_method}</span>
                                            <span className="payment-amount">฿{Number(p.amount).toFixed(2)}</span>
                                            <span className={`payment-status ${p.payment_status}`}>
                                                {p.payment_status === 'paid' ? '✅ ชำระแล้ว' :
                                                    p.payment_status === 'pending' ? '⏳ รอชำระ' :
                                                        p.payment_status === 'success' ? '✅ ชำระแล้ว' : p.payment_status}
                                            </span>
                                        </li>
                                    ))}
                                    {(!o.payments || o.payments.length === 0) && (
                                        <li className="payment-item">ยังไม่มีรายการชำระเงิน</li>
                                    )}
                                </ul>
                            </div>
                        </details>

                        {/* ปุ่มดำเนินการ */}
                        {actions.length > 0 && (
                            <div className="order-actions">
                                {actions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={action.action}
                                        disabled={action.disabled}
                                        style={{
                                            padding: "10px 20px",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "8px",
                                            cursor: action.disabled ? "not-allowed" : "pointer",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            opacity: action.disabled ? 0.6 : 1,
                                            ...action.style
                                        }}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* แสดงวันที่รับสินค้า */}
                        {o.status === "completed" && (o.delivered_at || o.delivered_at_local) && ( // ตรวจสอบว่ามีข้อมูลหรือไม่
                            <div className="delivery-confirmed">
                                ✓ ยืนยันรับสินค้าเมื่อ: {
                                    o.delivered_at_local // <-- ใช้ฟิลด์ที่ API ส่งมาเป็นเวลาไทยแล้ว
                                    || new Date(o.delivered_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
                                }
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}