import { Sale } from "../../types/sales";
import { mockTodaysSales } from "../../utils/SalesUtils/dummySales";

let memorySales: Sale[] = [...mockTodaysSales];

export async function fetchTodaysSales(): Promise<Sale[]> {
  // simulate latency
  await new Promise((r) => setTimeout(r, 150));
  return [...memorySales];
}

export async function createSale(newSale: Sale): Promise<Sale> {
  await new Promise((r) => setTimeout(r, 150));
  memorySales = [newSale, ...memorySales];
  return newSale;
}

// helper to reset in tests/dev
export function __resetSales(v: Sale[]) {
  memorySales = [...v];
}
