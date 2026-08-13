"use client";

import React, { useEffect } from "react";
import { usePreferencesStore } from "@/store/usePreferencesStore";

export function PreferencesHydrator() {
  const hydrate = usePreferencesStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}

export default PreferencesHydrator;
