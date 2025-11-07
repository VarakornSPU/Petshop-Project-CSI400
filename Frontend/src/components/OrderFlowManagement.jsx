import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function OrderFlowManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [selectedTab, setSelectedTab] = useState('paid'); // paid, preparing, ready_to_ship, shipping

    const { token } = useAuth();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/orders/admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data.orders || []);
        } catch (err) {
            console.error('Fetch orders error:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        console.log("Update status to:", newStatus);  // เพิ่มการตรวจสอบที่นี่
        setProcessing(orderId);

        // รายการสถานะที่ถูกต้อง
        const validStatuses = ['pending_payment', 'paid', 'preparing', 'ready_to_ship', 'shipping', 'completed', 'cancelled'];

        // ตรวจสอบว่า newStatus อยู่ในรายการที่ถูกต้องไหม
        if (!validStatuses.includes(newStatus)) {
            alert(`❌ สถานะ "${newStatus}" ไม่ถูกต้อง`);
            setProcessing(null);
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error response:', errorData);  // ดูรายละเอียด error ที่ API ส่งกลับมา
                throw new Error('Update failed');
            }

            const data = await res.json();

            // Update local state
            setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));

            alert(`✅ อัปเดตสถานะเป็น "${getStatusLabel(newStatus)}" สำเร็จ`);
        } catch (err) {
            console.error('Update error:', err);
            alert('❌ ไม่สามารถอัปเดตสถานะได้');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusLabel = (status) => {
        const map = {
            pending_payment: 'รอชำระเงิน',
            paid: 'ชำระแล้ว',
            preparing: 'กำลังเตรียมสินค้า',
            ready_to_ship: 'พร้อมจัดส่ง',
            shipping: 'กำลังจัดส่ง',
            completed: 'สำเร็จ',
            cancelled: 'ยกเลิก'
        };
        return map[status] || status;
    };

    const filterOrders = (status) => {
        return orders.filter(o => o.status === status);
    };

    const getNextAction = (currentStatus) => {
        const actions = {
            paid: { next: 'preparing', label: '📦 เริ่มเตรียมสินค้า', color: '#2196F3' },
            preparing: { next: 'ready_to_ship', label: '✅ พร้อมจัดส่ง', color: '#9C27B0' },
            ready_to_ship: { next: 'shipping', label: '🚚 จัดส่งแล้ว', color: '#FF9800' },
            shipping: { label: '⏳ รอลูกค้ายืนยันรับสินค้า', color: '#999', disabled: true }
        };
        return actions[currentStatus];
    };


    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr.replace(' ', 'T') + '+07:00');
            return new Intl.DateTimeFormat('th-TH', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(d);
        } catch {
            return dateStr;
        }
    };

    const OrderCard = ({ order }) => {
        const action = getNextAction(order.status);
        const isProcessing = processing === order.id;

        return (
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e6e9ef'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                            คำสั่งซื้อ #{order.id}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            {order.customer || 'ไม่ระบุ'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#FF6B35' }}>
                            ฿{Number(order.total).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                            {formatDate(order.created_at_local || order.created_at)}
                        </div>
                    </div>
                </div>

                {/* รายการสินค้า */}
                <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#666' }}>
                        รายการสินค้า ({order.items?.length || 0} รายการ)
                    </div>
                    {(order.items || []).slice(0, 3).map(item => (
                        <div key={item.id} style={{
                            fontSize: '13px',
                            padding: '6px 0',
                            borderBottom: '1px solid #e6e9ef'
                        }}>
                            <span style={{ fontWeight: '500' }}>{item.product_name}</span>
                            <span style={{ color: '#666', marginLeft: '8px' }}>x {item.quantity}</span>
                        </div>
                    ))}
                    {order.items?.length > 3 && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                            +{order.items.length - 3} รายการอื่นๆ
                        </div>
                    )}
                </div>

                {/* ที่อยู่จัดส่ง */}
                <div style={{
                    background: '#fff3e0',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '13px'
                }}>
                    <div style={{ fontWeight: '600', marginBottom: '6px' }}>📍 ที่อยู่จัดส่ง</div>
                    <div>{order.shipping_recipient_name} ({order.shipping_phone})</div>
                    <div style={{ color: '#666', marginTop: '4px' }}>
                        {order.shipping_address_line1} {order.shipping_subdistrict} {order.shipping_district} {order.shipping_province} {order.shipping_postal_code}
                    </div>
                </div>

                {/* Action Button */}
                {action && !action.disabled && (
                    <button
                        onClick={() => updateOrderStatus(order.id, action.next)}
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: action.color,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            opacity: isProcessing ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {isProcessing ? '⏳ กำลังดำเนินการ...' : action.label}
                    </button>
                )}

                {action && action.disabled && (
                    <div style={{
                        width: '100%',
                        padding: '14px',
                        backgroundColor: '#f5f5f5',
                        color: '#999',
                        border: '2px dashed #ddd',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        {action.label}
                    </div>
                )}
            </div>
        );
    };

    const TabButton = ({ status, label, count }) => (
        <button
            onClick={() => setSelectedTab(status)}
            style={{
                padding: '12px 24px',
                background: selectedTab === status ? '#FF6B35' : 'white',
                color: selectedTab === status ? 'white' : '#333',
                border: selectedTab === status ? 'none' : '1px solid #e6e9ef',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            {label}
            <span style={{
                background: selectedTab === status ? 'rgba(255,255,255,0.3)' : '#f0f0f0',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
            }}>
                {count}
            </span>
        </button>
    );

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                fontSize: '18px',
                color: '#666'
            }}>
                🔄 กำลังโหลดข้อมูล...
            </div>
        );
    }

    const paidOrders = filterOrders('paid');
    const preparingOrders = filterOrders('preparing');
    const readyOrders = filterOrders('ready_to_ship');
    const shippingOrders = filterOrders('shipping');

    const currentOrders = filterOrders(selectedTab);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                    🎯 จัดการคำสั่งซื้อ
                </h1>
                <p style={{ color: '#666', fontSize: '14px' }}>
                    ติดตามและจัดการสถานะคำสั่งซื้อแบบ Real-time
                </p>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                overflowX: 'auto',
                paddingBottom: '8px'
            }}>
                <TabButton status="paid" label="💰 ชำระแล้ว" count={paidOrders.length} />
                <TabButton status="preparing" label="📦 กำลังเตรียม" count={preparingOrders.length} />
                <TabButton status="ready_to_ship" label="✅ พร้อมจัดส่ง" count={readyOrders.length} />
                <TabButton status="shipping" label="🚚 กำลังจัดส่ง" count={shippingOrders.length} />
            </div>

            {/* Progress Info */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '20px',
                color: 'white',
                marginBottom: '24px'
            }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    📊 สถิติการทำงาน
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{paidOrders.length}</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>รอดำเนินการ</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{preparingOrders.length}</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>กำลังเตรียม</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{readyOrders.length}</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>พร้อมส่ง</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700' }}>{shippingOrders.length}</div>
                        <div style={{ fontSize: '13px', opacity: 0.9 }}>กำลังจัดส่ง</div>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            <div>
                <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    {getStatusLabel(selectedTab)}
                    <span style={{
                        background: '#f0f0f0',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}>
                        {currentOrders.length} รายการ
                    </span>
                </div>

                {currentOrders.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '2px dashed #e6e9ef'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <div style={{ fontSize: '16px', color: '#666' }}>
                            ไม่มีคำสั่งซื้อในสถานะนี้
                        </div>
                    </div>
                ) : (
                    currentOrders.map(order => <OrderCard key={order.id} order={order} />)
                )}
            </div>
        </div>
    );
}