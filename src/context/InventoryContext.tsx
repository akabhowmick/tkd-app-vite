import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { track } from "../analytics/posthog";
import { captureException } from "../analytics/sentry";
import { useAsyncState } from "../hooks/useAsyncState";
import {
  InventoryItemWithAlert,
  InventoryTransaction,
  CreateInventoryItemRequest,
  CreateTransactionRequest,
  UpdateInventoryItemRequest,
} from "../types/inventory";
import {
  getInventoryItems,
  getLowStockItems,
  createInventoryItem as apiCreateInventoryItem,
  updateInventoryItem as apiUpdateInventoryItem,
  deleteInventoryItem as apiDeleteInventoryItem,
  getTransactions,
  createTransaction as apiCreateTransaction,
  deleteTransaction as apiDeleteTransaction,
} from "../api/InventoryRequests/inventoryRequests";
import { useSchool } from "./SchoolContext";

interface InventoryContextType {
  items: InventoryItemWithAlert[];
  lowStockItems: InventoryItemWithAlert[];
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  createItem: (data: Omit<CreateInventoryItemRequest, "school_id">) => Promise<void>;
  updateItem: (itemId: string, updates: UpdateInventoryItemRequest) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  recordTransaction: (data: Omit<CreateTransactionRequest, "school_id">) => Promise<void>;
  deleteTransactionRecord: (transactionId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [items, setItems] = useState<InventoryItemWithAlert[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItemWithAlert[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const { loading, error, run, load } = useAsyncState();

  const loadItems = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const [allItems, lowStock] = await Promise.all([
        getInventoryItems(schoolId),
        getLowStockItems(schoolId),
      ]);
      setItems(allItems);
      setLowStockItems(lowStock);
    }, "Failed to load inventory");
  }, [schoolId, load]);

  const loadTransactions = useCallback(async () => {
    if (!schoolId) return;
    await load(async () => {
      const data = await getTransactions(schoolId);
      setTransactions(data);
    }, "Failed to load transactions");
  }, [schoolId, load]);

  const createItem = useCallback(
    async (data: Omit<CreateInventoryItemRequest, "school_id">): Promise<void> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        await run(async () => {
          await apiCreateInventoryItem({ ...data, school_id: schoolId });
          await loadItems();
          track("inventory_item_created", { category: data.category });
        }, "Failed to create item");
      } catch (err) {
        captureException(err, { feature: "inventory", action: "createItem" });
        throw err;
      }
    },
    [schoolId, loadItems, run],
  );

  const updateItem = useCallback(
    async (itemId: string, updates: UpdateInventoryItemRequest): Promise<void> => {
      await run(async () => {
        await apiUpdateInventoryItem(itemId, updates);
        await loadItems();
      }, "Failed to update item");
    },
    [loadItems, run],
  );

  const deleteItem = useCallback(
    async (itemId: string): Promise<void> => {
      try {
        await run(async () => {
          await apiDeleteInventoryItem(itemId);
          await loadItems();
          track("inventory_item_deleted");
        }, "Failed to delete item");
      } catch (err) {
        captureException(err, { feature: "inventory", action: "deleteItem" });
        throw err;
      }
    },
    [loadItems, run],
  );

  const recordTransaction = useCallback(
    async (data: Omit<CreateTransactionRequest, "school_id">): Promise<void> => {
      if (!schoolId) throw new Error("School ID required");
      try {
        await run(async () => {
          await apiCreateTransaction({ ...data, school_id: schoolId });
          await Promise.all([loadItems(), loadTransactions()]);
          const item = items.find((i) => i.item_id === data.item_id);
          if (data.transaction_type === "sale") {
            track("inventory_sale_recorded", {
              category: item?.category ?? "unknown",
              quantity: data.quantity,
              total: data.quantity * (data.price_per_unit ?? item?.price ?? 0),
            });
          } else if (data.transaction_type === "restock") {
            track("inventory_restock_recorded");
          }
        }, "Failed to record transaction");
      } catch (err) {
        captureException(err, { feature: "inventory", action: "recordTransaction" });
        throw err;
      }
    },
    [schoolId, loadItems, loadTransactions, items, run],
  );

  const deleteTransactionRecord = useCallback(
    async (transactionId: string): Promise<void> => {
      try {
        await run(async () => {
          await apiDeleteTransaction(transactionId);
          await Promise.all([loadItems(), loadTransactions()]);
        }, "Failed to delete transaction");
      } catch (err) {
        captureException(err, { feature: "inventory", action: "deleteTransaction" });
        throw err;
      }
    },
    [loadItems, loadTransactions, run],
  );

  useEffect(() => {
    if (schoolId) {
      loadItems();
      loadTransactions();
    }
  }, [schoolId, loadItems, loadTransactions]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        lowStockItems,
        transactions,
        loading,
        error,
        loadItems,
        loadTransactions,
        createItem,
        updateItem,
        deleteItem,
        recordTransaction,
        deleteTransactionRecord,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};
