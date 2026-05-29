export function SiteHeader() {
  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
      style={{ background: "var(--k-bg)", boxShadow: "var(--k-shadow-raised-xs)" }}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-base font-semibold" style={{ color: "var(--k-text-primary)" }}></h1>
      </div>
    </header>
  );
}
