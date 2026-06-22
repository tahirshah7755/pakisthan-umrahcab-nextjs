"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AddCustomerForm } from "@/components/admin/AddCustomerForm";

export default function CompanyAddCustomerPage() {
  const router = useRouter();

  return (
    <div className="admin-content-area">
      <AddCustomerForm router={router} />
    </div>
  );
}
