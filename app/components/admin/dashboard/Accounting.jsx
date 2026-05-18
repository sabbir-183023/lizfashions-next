// app/admin/dashboard/components/Accounting.jsx
"use client";

import dynamic from 'next/dynamic';

// Dynamically import the accounting components to avoid SSR issues
const AccountingMain = dynamic(
  () => import('@/app/components/admin/accounting/Accounting'),
  { ssr: false, loading: () => <div className="p-8 text-center">Loading Accounting Module...</div> }
);

const Accounting = () => {
  return <AccountingMain />;
};

export default Accounting;