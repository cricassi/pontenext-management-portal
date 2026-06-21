"use client";

import { useEffect } from "react";

const adminViewportClassName = "admin-viewport-lock";

export function AdminViewportLock() {
  useEffect(() => {
    document.documentElement.classList.add(adminViewportClassName);
    document.body.classList.add(adminViewportClassName);

    return () => {
      document.documentElement.classList.remove(adminViewportClassName);
      document.body.classList.remove(adminViewportClassName);
    };
  }, []);

  return null;
}
