'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

type ExtendedThemeProviderProps = ThemeProviderProps & {
  children: React.ReactNode
}

export function ThemeProvider({ children, ...props }: ExtendedThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
