import AddProductForm from '../components/AddProductForm';

console.log("Imported AddProductForm:", AddProductForm);

export default function AddProductPage() {
  function handleSubmit(formData) {
    console.log("ส่งข้อมูลไป backend:", formData);
  }

  function handleClose() {
    console.log("ปิดฟอร์ม");
  }

  console.log("handleSubmit type:", typeof handleSubmit);
  console.log("handleSubmit:", handleSubmit);

  return (
    <AddProductForm 
      onSubmit={(formData) => {
        console.log("ส่งข้อมูลไป backend:", formData);
      }} 
      onClose={() => {
        console.log("ปิดฟอร์ม");
      }} 
    />
  );
}