"use client"

import * as React from "react"

export function useLineItemsField<TLine>(
  items: TLine[],
  setItems: (updater: (items: TLine[]) => TLine[]) => void,
  createEmptyLine: () => TLine
) {
  const setLine = React.useCallback(
    (index: number, updater: (line: TLine) => TLine) => {
      setItems((prev) =>
        prev.map((line, i) => (i === index ? updater(line) : line))
      )
    },
    [setItems]
  )

  const addItem = React.useCallback(() => {
    setItems((prev) => [...prev, createEmptyLine()])
  }, [createEmptyLine, setItems])

  const removeItem = React.useCallback(
    (index: number) => {
      setItems((prev) => prev.filter((_, i) => i !== index))
    },
    [setItems]
  )

  return { items, setLine, addItem, removeItem }
}
