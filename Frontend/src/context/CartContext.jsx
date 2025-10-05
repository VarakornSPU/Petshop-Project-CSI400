import React, { createContext, useContext, useState } from 'react'

const CartContext = createContext()

export function useCart(){
  return useContext(CartContext)
}

export function CartProvider({ children }){
  const [cart, setCart] = useState([])
  const [notification, setNotification] = useState('')

  function addToCart(product){
    setCart(prev=>{
      const found = prev.find(p=>p.id===product.id)
      if(found) return prev.map(p=> p.id===product.id? {...p, quantity:p.quantity+1} : p)
      return [...prev, {...product, quantity:1}]
    })
    setNotification(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว`)
    setTimeout(()=> setNotification(''), 3000)
  }

  function removeFromCart(id){
    setCart(prev=> prev.filter(p=>p.id!==id))
    setNotification('ลบสินค้าออกจากตะกร้าแล้ว')
    setTimeout(()=> setNotification(''), 2000)
  }

  function clearCart(){
    setCart([])
  }

  const value = { cart, addToCart, removeFromCart, clearCart, notification }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
