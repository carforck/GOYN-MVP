import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { getViewer, isAdminRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { buildRows, datasets, parseExportFilters, toCsv, type Dataset } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!isAdminRole(viewer.role)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const dataset = request.nextUrl.searchParams.get("dataset") as Dataset | null;
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  if (!dataset || !(dataset in datasets)) return NextResponse.json({ error: "Conjunto no válido" }, { status: 400 });

  const filters = parseExportFilters(request.nextUrl.searchParams);
  const { columns, rows } = await buildRows(dataset, filters);

  // Registro de la exportación (quién, qué conjunto, con qué filtros). El archivo no se guarda.
  if (isSupabaseConfigured && viewer.userId) {
    const supabase = await createClient();
    await supabase.from("export_job").insert({ requested_by: viewer.userId, format, dataset, filters, status: "listo" });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `goyn-conecta-${dataset}-${stamp}.${format}`;

  if (format === "csv") {
    return new NextResponse(toCsv(columns, rows), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GOYN Conecta BAQ";
  const sheet = workbook.addWorksheet(datasets[dataset]);
  sheet.addRow(columns).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF8100E4" } };
  rows.forEach((r) => sheet.addRow(r));
  sheet.columns.forEach((c) => (c.width = 24));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
