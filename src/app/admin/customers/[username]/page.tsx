'use client';

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CustomerDetailPageRedirect() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  useEffect(() => {
    if (username) {
      router.replace(`/admin/customers/${username}/history`);
    }
  }, [username, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#b70011]" role="status"></div>
      <p className="mt-4 text-slate-500 font-medium font-sans">Đang chuyển hướng...</p>
    </div>
  );
}
