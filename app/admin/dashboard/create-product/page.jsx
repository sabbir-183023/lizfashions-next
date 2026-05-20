// app/admin/dashboard/create-product/page.jsx
"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const CreateProduct = dynamic(
  () => import('@/app/components/admin/product/Create'),
  { ssr: false, loading: () => <div className="p-8 text-center">Loading product creator...</div> }
);

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CreateProduct />
    </Suspense>
  );
}