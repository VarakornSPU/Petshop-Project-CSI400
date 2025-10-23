// frontend/src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import Hero from '../sections/Hero'
import Categories from '../sections/Categories'
import Products from '../sections/Products'
import Features from "../sections/Features"
import CartModal from '../components/CartModal'
import Notification from '../components/Notification'

export default function Home(){
  // simple mount scroll to top
  useEffect(()=> window.scrollTo(0,0), [])
  return (
    <>
      <Hero />
      <Categories />
      <Products />
      <Features />
      <CartModal />
      <Notification />
    </>
  )
}
