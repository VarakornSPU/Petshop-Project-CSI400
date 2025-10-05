import React from 'react'
import { useCart } from '../context/CartContext'
import '../style/Notification.css'

export default function Notification(){
  const { notification } = useCart()
  return (
    <div className={'notification' + (notification? ' show' : '')} id="notification">
      {notification}
    </div>
  )
}
