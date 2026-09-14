import { createInventoryCsv, createProfitReportCsv, createSalesCsv } from "@/lib/csv-exports";
import { getInventoryItems } from "@/lib/db/inventory";
import { getSales } from "@/lib/db/sales";

type RouteContext = {
  params: Promise<{ type: string }>;
};

function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { type } = await context.params;

  try {
    if (type === "inventory") {
      const items = await getInventoryItems();
      return csvResponse(createInventoryCsv(items), "marginiq-inventory.csv");
    }

    if (type === "sales") {
      const sales = await getSales();
      return csvResponse(createSalesCsv(sales), "marginiq-sales.csv");
    }

    if (type === "profit") {
      const sales = await getSales();
      return csvResponse(
        createProfitReportCsv(sales),
        "marginiq-profit-report.csv"
      );
    }

    return Response.json({ error: "Export type not found." }, { status: 404 });
  } catch (error) {
    console.error("CSV export failed:", error);
    return Response.json(
      { error: "The CSV export could not be generated." },
      { status: 500 }
    );
  }
}
