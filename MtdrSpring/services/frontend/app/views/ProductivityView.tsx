// views/ProductivityView.tsx
function ProductivityView() {
  return (
    <div className="p-6 bg-oc-neutral h-full">
      <div className="h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center pb-2 gap-2">
          <i className="fa fa-chevron-right text-2xl text-black"></i>
          <h1 className="text-xl font-medium text-black">Productividad</h1>
        </div>
      </div>
    </div>
  );
}

export default ProductivityView;
