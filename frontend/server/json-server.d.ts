/* eslint-disable @typescript-eslint/no-explicit-any */

declare module "json-server/lib/app.js" {
  import type { App } from "@tinyhttp/app"

  export function createApp(db: any): App
}

declare module "json-server/lib/adapters/normalized-adapter.js" {
  export class NormalizedAdapter<T = unknown> {
    constructor(adapter: T)
  }
}

declare module "json-server/lib/adapters/observer.js" {
  export class Observer<T = unknown> {
    constructor(adapter: T)
    read(): Promise<any>
    write(data: any): Promise<void>
    onReadEnd(data: Record<string, unknown> | null): void
    onWriteStart(): void
    onWriteEnd(): void
  }
}

declare module "json-server/lib/service.js" {
  export function isItem(value: unknown): value is Record<string, unknown>

  export class Service {
    constructor(db: any)
    create(
      resource: string,
      body: Record<string, unknown>
    ): Promise<{ id: string } | null>
    patchById(
      resource: string,
      id: string,
      body: Record<string, unknown>
    ): Promise<{ id: string } | null>
  }
}
